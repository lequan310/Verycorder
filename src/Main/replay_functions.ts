import { ipcMain } from "electron";
import { Channel } from "../Others/listenerConst";
import { getView } from "../Others/electron_utilities";

export function handleReplayEvents() {
  replayInputEvent();
  replayHoverEvent();
  replayClickEvent();
  replayScrollEvent();
}

// Function used to simulate hover event
function hoverEvent(x: number, y: number) {
  const view = getView();
  view.webContents.sendInputEvent({
    type: "mouseMove",
    x: x,
    y: y,
    movementX: 250,
    movementY: 250,
  });
}

// ------------------- IPC EVENT FUNCTIONS -------------------
function replayInputEvent() {
  ipcMain.on(Channel.REPLAY_INPUT, async (event, data) => {
    const view = getView();
    // Simulate key press for each character in data.value
    for (const char of data.value) {
      view.webContents.sendInputEvent({ type: "char", keyCode: char });
    }
    console.log("Inputed" + data.value + " at ", data.x, data.y);
  });
}

function replayHoverEvent() {
  ipcMain.on(Channel.REPLAY_HOVER, async (event, data) => {
    hoverEvent(data.x, data.y);
    console.log("Hovered at " + data.x + " " + data.y);
  });
}

function replayClickEvent() {
  ipcMain.on(Channel.REPLAY_CLICK, async (event, data) => {
    const view = getView();

    //Hover over the element first
    hoverEvent(data.x, data.y);

    // Click the element
    view.webContents.sendInputEvent({
      type: "mouseDown",
      x: data.x,
      y: data.y,
      button: "left",
      clickCount: 1,
    });
    view.webContents.sendInputEvent({
      type: "mouseUp",
      x: data.x,
      y: data.y,
      button: "left",
      clickCount: 1,
    });
    console.log("Clicked at ", data.x, data.y);
  });
}

function replayScrollEvent() {
  ipcMain.on(Channel.REPLAY_SCROLL, async (event, data) => {
    const view = getView();
    // Send the mouseWheel event with the calculated deltaY to scroll
    if (data.type === "vertical") {
      view.webContents.sendInputEvent({
        type: "mouseWheel",
        x: data.currentX,
        y: data.currentY,
        deltaX: 0,
        deltaY: data.deltaY * -1,
        canScroll: true,
      });
    } else if (data.type === "horizontal") {
      view.webContents.sendInputEvent({
        type: "mouseWheel",
        x: data.currentX,
        y: data.currentY,
        deltaX: data.deltaX * -1,
        deltaY: 0,
        canScroll: true,
      });
    }
    console.log("Scrolled to ", data);
  });
}
