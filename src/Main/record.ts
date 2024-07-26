import {
  delay,
  isCursor,
  isEditable,
  isClickable,
  containsHover,
  hasEditableContent,
  hasValueProperty,
  getCssSelector,
  getXPath,
  isVisualElement,
} from "../Others/utilities";
import { RecordedEvent } from "../Types/recordedEvent";
import { ipcRenderer } from "electron";
import { Channel } from "../Others/listenerConst";
import { Target } from "../Types/eventComponents";

// ------------------- GLOBAL VARIABLES -------------------
// Variables for editing target element
let hoveredElement: HTMLElement; // Current Hover
let previousOutlineStyle: string = ""; // Previous outline style

// Variables for event recording
let currentEvent = document.createEvent("Event");
let focusElement: HTMLElement; // Element that is currently focused
let checkMutation = false;
let change = false; // Change observed by mutation observer
let click = false;
let hover = false;
let mouseX = 0;
let mouseY = 0;
// let input = false;

// Timers so events won't register too fast
// let clickTimer: ReturnType<typeof setTimeout>;
let scrollTimer: ReturnType<typeof setTimeout>;
let hoverTimer: ReturnType<typeof setTimeout>;
const TIMEOUT = 250;

// ------------------- OBSERVERS -------------------
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach(() => {
    if (click && checkMutation) {
      // Handle click event
      const mouseEvent = currentEvent as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      click = false;
      hover = false;
      change = false;

      const eventObject: RecordedEvent = {
        type: "click",
        target: { css: getCssSelector(target), xpath: getXPath(target) },
        value: null,
        mousePosition: { x: mouseEvent.clientX, y: mouseEvent.clientY },
      };

      ipcRenderer.send("click-event", eventObject);
    } else if (hover && !click) {
      // Support for hover event
      change = true;
      delay(500).then(() => (change = false));
    }
  });
});

// Observe the whole document body
const config = {
  attributes: true,
  childList: true,
  subtree: true,
  characterData: true,
};

// ------------------- EVENT HANDLERS -------------------
function registerClick(clickValue: boolean, checkMutationValue: boolean) {
  click = clickValue;
  checkMutation = checkMutationValue;
  handleAfterClick();
  delay(TIMEOUT).then(() => {
    click = false;
    checkMutation = false;
  });
}

// Remove hover event listener after click event, re-add after 1s
function handleAfterClick() {
  document.body.removeEventListener("mouseenter", hoverHandler, true);
  delay(1000).then(() =>
    document.body.addEventListener("mouseenter", hoverHandler, true)
  );
}

function clickHandler(event: MouseEvent) {
  // Check if the event is made by user
  if (event.isTrusted) {
    currentEvent = event;
    const target = event.target as HTMLElement;
    ipcRenderer.send(Channel.TEST_LOG, target.outerHTML);
    const eventObject: RecordedEvent = {
      type: "click",
      target: { css: getCssSelector(target), xpath: getXPath(target) },
      value: null,
      mousePosition: { x: event.clientX, y: event.clientY },
    };

    // Clicks on editable content
    if (isEditable(target)) {
      registerClick(true, false);
      ipcRenderer.send("click-event", eventObject);
      return;
    }

    // If pointer cursor or select element, return click event immediately
    if (isCursor(event, "pointer") || isClickable(target)) {
      ipcRenderer.send("click-event", eventObject);
      handleAfterClick();
      return;
    }

    // Register click function called when not pointer cursor click, for observer to handle
    registerClick(true, true);
  }
}

// Window (whole web) scroll events
function windowScrollHandler(event: Event) {
  // Clear any existing timeout
  clearTimeout(scrollTimer);

  // Set a timeout to detect scroll end
  scrollTimer = setTimeout(() => {
    const eventObject: RecordedEvent = {
      type: "scroll",
      target: { css: "window", xpath: "window" },
      value: { x: window.scrollX, y: window.scrollY },
      mousePosition: { x: mouseX, y: mouseY },
    };

    ipcRenderer.send("scroll-event", eventObject);
  }, TIMEOUT); // Adjust the delay as needed
}

// Small element scroll (div, textarea)
function scrollHandler(event: Event) {
  // Clear any existing timeout
  clearTimeout(scrollTimer);

  // Set a timeout to detect scroll end
  scrollTimer = setTimeout(() => {
    const target = event.target as HTMLElement;
    const eventObject: RecordedEvent = {
      type: "scroll",
      target: { css: getCssSelector(target), xpath: getXPath(target) },
      value: { x: target.scrollLeft, y: target.scrollTop },
      mousePosition: { x: mouseX, y: mouseY },
    };

    ipcRenderer.send("scroll-event", eventObject);
  }, TIMEOUT); // Adjust the delay as needed
}

function hoverHandler(event: MouseEvent) {
  if (click) return;
  const target = event.target as HTMLElement;
  if (target === document.body) return;

  const eventObject: RecordedEvent = {
    type: "hover",
    target: { css: getCssSelector(target), xpath: getXPath(target) },
    value: null,
    mousePosition: { x: mouseX, y: mouseY },
  };

  // Check if target class name contains "hover" keyword (thanks tailwind or similar)
  if (containsHover(target) || isClickable(target) || isVisualElement(target)) {
    currentEvent = event;
    clearTimeout(hoverTimer);

    hoverTimer = setTimeout(function () {
      ipcRenderer.send("hover-event", eventObject);
      //console.log("Hover element:", getCssSelector(event.target));
    }, TIMEOUT);
  } else if (isCursor(event, "pointer")) {
    // Register hover only when pointer event (doesnt know if hover change styles or DOM)
    clearTimeout(hoverTimer);

    hover = true;
    hoverTimer = setTimeout(function () {
      // if new target is not parent of current target
      const currentTarget = currentEvent.target as HTMLElement;
      hover = !target.contains(currentTarget) || target === currentTarget;
      currentEvent = event;

      // If observer detect changes in DOM and styles, and mouse is hovering
      if (hover && change) {
        change = false;
        ipcRenderer.send("hover-event", eventObject);
      }
    }, TIMEOUT);
  }
}

function focusHandler(event: FocusEvent) {
  focusElement = event.target as HTMLElement;
}

function changeHandler(event: Event) {
  const target = event.target as HTMLElement;
  const keyboardInputTypes = [
    "text",
    "password",
    "number",
    "email",
    "tel",
    "url",
    "search",
  ];

  if (target === focusElement) {
    if (hasValueProperty(target)) {
      const eventObject: RecordedEvent = {
        type: "input",
        target: { css: getCssSelector(target), xpath: getXPath(target) },
        value: target.value,
      };

      if (
        !(target instanceof HTMLInputElement) ||
        keyboardInputTypes.includes(target.type)
      ) {
        ipcRenderer.send("input-event", eventObject);
      }
    } else if (hasEditableContent(target)) {
      const eventObject: RecordedEvent = {
        type: "input",
        target: { css: getCssSelector(target), xpath: getXPath(target) },
        value: target.textContent,
      };

      ipcRenderer.send("input-event", eventObject);
    }
  }
}

function observeMutation() {
  mutationObserver.observe(document.body, config);
}

function disconnectObserver() {
  mutationObserver.disconnect();
}

function mouseTracker(event: MouseEvent) {
  mouseX = event.clientX;
  mouseY = event.clientY;
}

function clearPreviousOutline() {
  if (hoveredElement) {
    hoveredElement.style.outline = previousOutlineStyle; // Re-assigned previous outline style
  }
}

// Hover to edit target element for event
export function hoverEditHandler(event: MouseEvent) {
  clearPreviousOutline();
  // Highlight currently hovered element
  hoveredElement = event.target as HTMLElement;
  previousOutlineStyle = hoveredElement.style.outline;
  hoveredElement.style.outline = "2px solid red";
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  if (hoveredElement) {
    const css = getCssSelector(hoveredElement);
    const xpath = getXPath(hoveredElement);
    const eventTarget: Target = { css, xpath };
    ipcRenderer.send(Channel.UPDATE_EVENT_TARGET, eventTarget);
  }
}
export function record() {
  observeMutation();
  document.body.addEventListener("mousemove", mouseTracker, true);
  document.body.addEventListener("click", clickHandler, true);
  window.addEventListener("scroll", windowScrollHandler);
  document.body.addEventListener("scroll", scrollHandler, true);
  document.body.addEventListener("mouseenter", hoverHandler, true);
  document.body.addEventListener("change", changeHandler, true);
  document.body.addEventListener("focus", focusHandler, true);
}

export function stopRecording() {
  disconnectObserver();
  document.body.removeEventListener("mousemove", mouseTracker, true);
  document.body.removeEventListener("click", clickHandler, true);
  window.removeEventListener("scroll", windowScrollHandler);
  document.body.removeEventListener("scroll", scrollHandler, true);
  document.body.removeEventListener("mouseenter", hoverHandler, true);
  document.body.removeEventListener("change", changeHandler, true);
  document.body.removeEventListener("focus", focusHandler, true);
}

export function startEdit() {
  ipcRenderer.send(Channel.TEST_LOG, "Edit mode started");
  document.body.addEventListener("mouseenter", hoverEditHandler, true);
  document.body.addEventListener("contextmenu", handleContextMenu, true);
}

export function stopEditing() {
  ipcRenderer.send(Channel.TEST_LOG, "Edit mode stopped");
  document.body.removeEventListener("mouseenter", hoverEditHandler, true);
  document.body.removeEventListener("contextmenu", handleContextMenu, true);
  clearPreviousOutline();
}
