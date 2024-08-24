import { delay } from "../Others/utilities";
import { ipcRenderer } from "electron";
import { Channel } from "../Others/listenerConst";
import { CanvasTestCase } from "../Types/testCase";
import { CanvasEvent } from "../Types/canvasEvent";
import { EventEnum } from "../Types/eventComponents";
import { BoundingBox } from "../Types/bbox";

let abortController: AbortController;
let isReplaying = true; // Flag to control the replay
let currentEventIndex = 0;
let canvasTestCase: CanvasTestCase;

// Reset index in both replay.ts and electron Utils to 0
function resetIndex() {
  currentEventIndex = 0;
  ipcRenderer.send(Channel.view.replay.GET_INDEX, currentEventIndex, false);
  ipcRenderer.send(Channel.all.TEST_LOG, "Reset index to 0");
}

function turnOffOverlay() {
  ipcRenderer.send(Channel.view.replay.UPDATE_OVERLAY);
}

export function setCurrentCanvasIndex(index: number) {
  currentEventIndex = index;
}

export function getCanvasTestCase(newCanvasTestCase: CanvasTestCase) {
  canvasTestCase = newCanvasTestCase;
  ipcRenderer.send(
    Channel.all.TEST_LOG,
    "Test case received: " + canvasTestCase.events
  );
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

async function getEventBoundingBox(event: CanvasEvent) {
  const clickedBuffer = event.buffer;
  const locator = event.target;
  const result = await ipcRenderer.invoke(
    Channel.view.replay.GET_TARGET_BBOX,
    clickedBuffer,
    locator,
  );
  if (!result)
    ipcRenderer.send(Channel.all.TEST_LOG, "Failed to get bounding box");
  else {
    ipcRenderer.send(Channel.all.TEST_LOG, result);
  }
  return result;
}

async function controlEventType(event: CanvasEvent) {
  switch (event.type) {
    case EventEnum.click:
      const clickEventBBox = await getEventBoundingBox(event);
      if (!clickEventBBox) return false;
      else runCanvasClickEvent(clickEventBBox);
      break;
    case EventEnum.hover:
      const hoverEventBBox = await getEventBoundingBox(event);
      if (!hoverEventBBox) return false;
      else runCanvasHoverEvent(hoverEventBBox);
      break;
    case EventEnum.scroll:
      runCanvasScrollEvent(event);
      break;
    case EventEnum.input:
      const prevEvent = canvasTestCase.events[currentEventIndex - 1];
      const inputEventBBox = await getEventBoundingBox(prevEvent);
      if (!inputEventBBox) return false;
      else runCanvasInputEvent(event, inputEventBBox);
      break;
  }

  return true;
}

async function controlReplayLogic(event: CanvasEvent) {
  const result = await controlEventType(event);
  return result;
}

async function manageCanvasReplay() {
  abortController = new AbortController();
  const signal = abortController.signal;

  for (
    currentEventIndex;
    currentEventIndex < canvasTestCase.events.length;
    currentEventIndex++
  ) {
    if (signal.aborted || !isReplaying) return;

    ipcRenderer.send(Channel.view.replay.GET_INDEX, currentEventIndex, true);
    const event = canvasTestCase.events[currentEventIndex];
    const result = await controlReplayLogic(event);

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
    if (currentEventIndex == canvasTestCase.events.length - 1) {
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

function runCanvasClickEvent(boundingBox: BoundingBox) {
  const box = boundingBox;
  const clickX = box.x + box.width / 2;
  const clickY = box.y + box.height / 2;

  ipcRenderer.send(Channel.view.replay.REPLAY_CLICK, { x: clickX, y: clickY });
}

function runCanvasHoverEvent(boundingBox: BoundingBox) {
  const box = boundingBox;
  const hoverX = box.x + box.width / 2;
  const hoverY = box.y + box.height / 2;

  ipcRenderer.send(Channel.view.replay.REPLAY_HOVER, { x: hoverX, y: hoverY });
}

function runCanvasScrollEvent(event: CanvasEvent) {
  if (event.type == EventEnum.scroll) {
    const currentX = event.mousePosition.x;
    const currentY = event.mousePosition.y;

    const deltaX = event.scrollValue.x * -1;
    const deltaY = event.scrollValue.y * -1;

    if (deltaY !== 0) {
      ipcRenderer.send(Channel.view.replay.REPLAY_SCROLL, {
        type: "vertical",
        deltaY,
        currentX,
        currentY,
      });
    }

    if (deltaX !== 0) {
      ipcRenderer.send(Channel.view.replay.REPLAY_SCROLL, {
        type: "horizontal",
        deltaX,
        currentX,
        currentY,
      });
    }
  }
}

function runCanvasInputEvent(event: CanvasEvent, boundingBox: BoundingBox) {
  const box = boundingBox;
  const inputX = box.x + box.width / 2;
  const inputY = box.y + box.height / 2;

  const existingLength = 0;
  ipcRenderer.send(Channel.view.replay.REPLAY_INPUT, {
    x: inputX,
    y: inputY,
    value: event.value,
    prevLength: existingLength,
  });
}

export async function replayCanvas() {
  await delay(2000); // Delay for 2 seconds before replaying
  await manageCanvasReplay();

  // If not aborted
  if (isReplaying) {
    isReplaying = false;
    ipcRenderer.send(Channel.view.replay.TEST_CASE_ENDED);
  }
}

export function stopReplayCanvas() {
  isReplaying = false;
  abortController.abort();

  // Reset index when aborted
  resetIndex();
}
