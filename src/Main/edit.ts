import { ipcRenderer } from "electron";
import { Channel } from "../Others/listenerConst";
import { getCssSelector, getXPath } from "../Others/utilities";
import { Target } from "../Types/eventComponents";

// Variables for editing target element
let hoveredElement: HTMLElement; // Current Hover
let previousOutlineStyle = ""; // Previous outline style

function clearPreviousOutline() {
  if (hoveredElement) {
    hoveredElement.style.outline = previousOutlineStyle; // Re-assigned previous outline style
  }
}

// Hover to edit target element for event
function hoverEditHandler(event: MouseEvent) {
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
    ipcRenderer.send(Channel.view.edit.UPDATE_EVENT_TARGET, eventTarget);
  }
}

export function startEdit() {
  ipcRenderer.send(Channel.all.TEST_LOG, "Edit mode started");
  document.body.addEventListener("mouseenter", hoverEditHandler, true);
  document.body.addEventListener("contextmenu", handleContextMenu, true);
}

export function stopEditing() {
  ipcRenderer.send(Channel.all.TEST_LOG, "Edit mode stopped");
  document.body.removeEventListener("mouseenter", hoverEditHandler, true);
  document.body.removeEventListener("contextmenu", handleContextMenu, true);
  clearPreviousOutline();
}
