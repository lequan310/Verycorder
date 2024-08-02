import { ipcRenderer } from "electron";
import { Channel } from "../Others/listenerConst";
import { TestCase } from "../Types/testCase";
import { RecordedEvent } from "../Types/recordedEvent";
import { delay } from "../Others/utilities";
import { EventEnum } from "../Types/eventComponents";

let testCase: TestCase;
let isReplaying = true; // Flag to control the replay
let currentEventIndex = 0;
let abortController: AbortController;

// Function to get the test case from main process
export function getTestCase(newTestCase: TestCase) {
  testCase = newTestCase;
  //ipcRenderer.send(Channel.TEST_LOG, "Test case received: " + testCase.events);
}

// Function to set the current index based on the one existing in electron utilities
export function setCurrentIndex(index: number) {
  currentEventIndex = index;
  //ipcRenderer.send(Channel.TEST_LOG, "Current index set to: " + index);
}

// Reset index in both replay.ts and electron Utils to 0
function resetIndex() {
  currentEventIndex = 0;
  ipcRenderer.send(Channel.view.replay.GET_INDEX, currentEventIndex, false);
}

async function delayWithAbort(ms: number, signal: AbortSignal) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error("aborted"));
    });
  });
}

function checkElementVisibility(element: Element): boolean {
  // Get computed style of the element
  const computedStyle = window.getComputedStyle(element);

  // Check for display: none
  if (computedStyle.display === "none") {
    ipcRenderer.send(Channel.all.TEST_LOG, "Element is display: none");
    return false;
  }

  // Check for visibility: hidden or collapse
  if (
    computedStyle.visibility === "hidden" ||
    computedStyle.visibility === "collapse"
  ) {
    ipcRenderer.send(
      Channel.all.TEST_LOG,
      "Element is visibility: hidden or collapse"
    );
    return false;
  }

  // Check for opacity: 0
  if (computedStyle.opacity === "0") {
    ipcRenderer.send(Channel.all.TEST_LOG, "Element has opacity: 0");
    return false;
  }

  // Check for zero dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    ipcRenderer.send(Channel.all.TEST_LOG, "Element has zero dimensions");
    return false;
  }

  // Check if it's in the viewport
  const inViewport =
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
    rect.top < (window.innerHeight || document.documentElement.clientHeight);
  if (!inViewport) {
    ipcRenderer.send(Channel.all.TEST_LOG, "Element is not in the viewport");
    return false;
  }

  // Check parent visibility recursively
  function isParentVisible(elem: Element): boolean {
    if (elem === document.body) return true; // Reached the top of the DOM tree
    const parent = elem.parentElement;
    if (!parent) return true; // No parent element
    const parentStyle = window.getComputedStyle(parent);
    if (
      parentStyle.display === "none" ||
      parentStyle.visibility === "hidden" ||
      parentStyle.visibility === "collapse" ||
      parentStyle.opacity === "0"
    ) {
      ipcRenderer.send(
        Channel.all.TEST_LOG,
        `Parent element (${parent.tagName}) is not visible`
      );
      return false;
    }
    return isParentVisible(parent);
  }

  if (!isParentVisible(element)) {
    return false; // Note: The specific failing parent is logged in the recursive function
  }

  return true;
}

function findElementByCss(css: string): Element | null {
  return document.querySelector(css);
}

function findElementByXPath(xpath: string): Element | null {
  const xpathResult = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  return xpathResult.singleNodeValue instanceof Element
    ? xpathResult.singleNodeValue
    : null;
}

// Function to locate the element based on the CSS selector or XPath
function findElement(event: RecordedEvent) {
  let element: Element | null = null;

  try {
    element = findElementByCss(event.target.css);
    if (!element) element = findElementByXPath(event.target.xpath);
  } catch (error) {
    ipcRenderer.send(Channel.all.TEST_LOG, error.message);
  }

  return element;
}

// Function to handle the event type
function controlEventType(element: Element, event: RecordedEvent) {
  if (!checkElementVisibility(element)) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  switch (event.type) {
    case EventEnum.click:
      runClickEvent(event, rect);
      break;
    case EventEnum.input:
      runInputEvent(event, rect);
      break;
    case EventEnum.hover:
      runHoverEvent(event, rect);
      break;
    case EventEnum.scroll:
      runScrollEvent(event, element);
      break;
    // Add cases for other event types if needed
  }

  return true;
}

function controlReplayLogic(event: RecordedEvent) {
  if (event.target.css && event.target.css !== "window") {
    const element: Element | null = findElement(event);

    if (!(element && controlEventType(element, event))) return false;
  } else if (event.target.css == "window") {
    // If event.target.css is not provided or invalid, and the event is a scroll event
    runScrollEvent(event);
  }

  return true;
}

// Modified replayManager to be async and controlled by isReplaying flag
async function manageReplay() {
  abortController = new AbortController();
  const signal = abortController.signal;

  for (
    currentEventIndex;
    currentEventIndex < testCase.events.length;
    currentEventIndex++
  ) {
    if (signal.aborted || !isReplaying) return; // Stop if the abort signal is triggered or isReplaying is false

    // Save for when navigate to another page
    ipcRenderer.send(Channel.view.replay.GET_INDEX, currentEventIndex, true);

    const event = testCase.events[currentEventIndex];
    const result = controlReplayLogic(event);

    if (!result) {
      ipcRenderer.send(Channel.win.NEXT_REPLAY, {
        index: currentEventIndex,
        state: false,
      });
      ipcRenderer.send(
        Channel.all.TEST_LOG,
        `Event ${currentEventIndex} failed to replay`
      );
      resetIndex();
      turnOffOverlay();
      return;
    }

    ipcRenderer.send(Channel.win.NEXT_REPLAY, {
      index: currentEventIndex + 1,
      state: true,
    });

    // Stop when complete immediately
    if (currentEventIndex == testCase.events.length - 1) {
      // Reset index when out of test cases
      resetIndex();
      turnOffOverlay();
      return;
    }

    // Delay with abort handling
    try {
      await delayWithAbort(2000, signal);
    } catch (error) {
      ipcRenderer.send(Channel.all.TEST_LOG, error.message);
      return;
    }
  }
}

function turnOffOverlay() {
  ipcRenderer.send(Channel.view.replay.UPDATE_OVERLAY);
}

function runInputEvent(event: RecordedEvent, rect: DOMRect) {
  const box = rect;
  const inputX = box.x + box.width / 2;
  const inputY = box.y + box.height / 2;

  ipcRenderer.send(Channel.view.replay.REPLAY_INPUT, {
    x: inputX,
    y: inputY,
    value: event.value,
  });
}

function runHoverEvent(event: RecordedEvent, rect: DOMRect) {
  const box = rect;
  const hoverX = box.x + box.width / 2;
  const hoverY = box.y + box.height / 2;

  ipcRenderer.send(Channel.view.replay.REPLAY_HOVER, { x: hoverX, y: hoverY });
}

function runClickEvent(event: RecordedEvent, rect: DOMRect) {
  const box = rect;
  const clickX = box.x + box.width / 2;
  const clickY = box.y + box.height / 2;

  ipcRenderer.send(Channel.view.replay.REPLAY_CLICK, { x: clickX, y: clickY });
}

function runScrollEvent(event: RecordedEvent, element?: Element) {
  if (event.type == EventEnum.scroll) {
    // Get current position of the cursor
    const currentX = event.mousePosition.x;
    const currentY = event.mousePosition.y;

    // Get the destination scroll cooridnate
    const scrollY = event.value.y;
    const scrollX = event.value.x;

    // Get the current scroll coordinate
    // Initialize both to 0
    let currentScrollY = 0;
    let currentScrollX = 0;

    // If element is provided, get the scroll position of the element
    // If element is provided, the scroll action is performed on a specific element
    if (element) {
      currentScrollY = element.scrollTop;
      currentScrollX = element.scrollLeft;
    }
    // If element is not provided, get the scroll position of the window
    else {
      currentScrollX = window.scrollX;
      currentScrollY = window.scrollY;
    }

    // Calculate the distance to scroll using the provided destination and current scroll coordinates
    const deltaY = scrollY - currentScrollY;
    const deltaX = scrollX - currentScrollX;

    // Check for vertical scroll
    if (deltaY !== 0) {
      //ipcRenderer.send(Channel.TEST_LOG, `Scrolling vertically from ${currentScrollY} to ${scrollY}`);
      ipcRenderer.send(Channel.view.replay.REPLAY_SCROLL, {
        type: "vertical",
        deltaY,
        currentX,
        currentY,
      });
    }

    // Check for horizontal scroll
    if (deltaX !== 0) {
      ipcRenderer.send(
        Channel.all.TEST_LOG,
        `Scrolling horizontally from ${currentScrollX} to ${scrollX}`
      );
      ipcRenderer.send(Channel.view.replay.REPLAY_SCROLL, {
        type: "horizontal",
        deltaX,
        currentX,
        currentY,
      });
    }
  }
}

// Modified replay function to start replayManager asynchronously
export async function replay() {
  await delay(2000); // Delay for 2 seconds before replaying
  await manageReplay();

  // If not aborted
  if (isReplaying) {
    isReplaying = false;
    ipcRenderer.send(Channel.view.replay.TEST_CASE_ENDED);
  }
}

// Function to stop replaying
export function stopReplaying() {
  isReplaying = false;
  abortController.abort();

  // Reset index when aborted
  resetIndex();
}
