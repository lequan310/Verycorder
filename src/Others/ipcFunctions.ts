import { AppMode } from "../Types/appMode";
import { Channel } from "./listenerConst";
import { BrowserView, BrowserWindow, ipcMain } from "electron";
import {
  elementScreenshot,
  getCurrentMode,
  initBBox,
  setMode,
  toggleEdit,
  toggleRecord,
  toggleReplay,
  updateTestEventList,
  getDetectMode,
  incrementCurrentEventIndex,
  getCurrentEventIndex,
  setDetectMode,
} from "./electronUtilities";
import { getCaption } from "./openai";
import { EventEnum } from "../Types/eventComponents";
import { BoundingBox } from "../Types/bbox";
import { CanvasEvent } from "../Types/canvasEvent";
import { DetectMode } from "../Types/detectMode";

// ------------------- IPC EVENT export functionS -------------------
// export function to test log events
export function testLogEvents() {
  ipcMain.on(Channel.all.TEST_LOG, (event, data) => {
    console.log(data);
  });
}

export function ipcGetMode() {
  ipcMain.handle(Channel.view.all.GET_MODE, (event) => {
    return getCurrentMode();
  });
}

export function ipcGetDetectMode() {
  ipcMain.handle(Channel.view.all.GET_DETECT_MODE, (event) => {
    return getDetectMode();
  });
}

export function ipcSetDetectMode() {
  ipcMain.on(Channel.win.UPDATE_DETECT_MODE, (event, data: DetectMode) => {
    setDetectMode(data);
  });
}

export function updateTestSteps(win: BrowserWindow) {
  ipcMain.on(Channel.win.NEXT_REPLAY, async (event, data) => {
    win.webContents.send(Channel.win.NEXT_REPLAY, data);
  });
}

export function handleUpdateTestCase() {
  ipcMain.handle(Channel.win.UPDATE_TEST_CASE, (event, updatedEventList) => {
    updateTestEventList(updatedEventList);
    return updatedEventList;
  });
}

export function handleClickRecord() {
  ipcMain.handle(Channel.win.CLICK_RECORD, async (event) => {
    await toggleRecord();
    return getCurrentMode();
  });
}

export function handleClickEdit() {
  ipcMain.on(Channel.win.CLICK_EDIT, async (event) => {
    toggleEdit();
  });
}

export function handleClickReplay() {
  ipcMain.handle(Channel.win.CLICK_REPLAY, async (event) => {
    toggleReplay();
    return getCurrentMode();
  });
}

export function handleNavigateInPage(view: BrowserView) {
  view.webContents.on("did-navigate-in-page", () => {
    if (getCurrentMode() === AppMode.replay) {
      console.log("Navigation started during replay");
    }
  });
}

export function handleTestCaseEnded(win: BrowserWindow) {
  ipcMain.on(Channel.view.replay.TEST_CASE_ENDED, (event) => {
    setMode(AppMode.normal);
    console.log("ENEDED-------------");
    win.webContents.send(Channel.win.UPDATE_STATE, getCurrentMode());
  });
}

export function handleGetBBoxes() {
  ipcMain.handle(Channel.view.record.GET_BBOX, async (event) => {
    return await initBBox();
  });
}

function handleGetCaption(win: BrowserWindow, bbox: BoundingBox, id: number) {
  elementScreenshot(bbox).then((base64image) => {
    getCaption(base64image).then((completion) => {
      const caption = completion.choices[0].message.content;
      win.webContents.send(Channel.win.UPDATE_EVENT_CAPTION, id, caption);
      console.log(`ID:${id} - ${caption}`);
    });
  });
}

export function handleRecordCanvasClick(win: BrowserWindow) {
  ipcMain.on(
    Channel.view.record.CANVAS_CLICK,
    (event, bbox: BoundingBox, mouseX: number, mouseY: number) => {
      const eventId = getCurrentEventIndex();

      // Screenshot and send caption later
      handleGetCaption(win, bbox, eventId);

      const clickEvent: CanvasEvent = {
        id: eventId,
        type: EventEnum.click,
        target: "Waiting for caption...",
        value: null,
        mousePosition: { x: mouseX, y: mouseY },
      };

      win.webContents.send(Channel.win.ADD_EVENT_CANVAS, clickEvent);
      console.log(clickEvent);
      incrementCurrentEventIndex();
    }
  );
}

export function handleRecordCanvasScroll(win: BrowserWindow) {
  ipcMain.on(
    Channel.view.record.CANVAS_SCROLL,
    (event, deltaScrollX, deltaScrollY, mouseX, mouseY) => {
      const eventId = getCurrentEventIndex();

      const scrollEvent: CanvasEvent = {
        id: eventId,
        type: EventEnum.scroll,
        target: "window",
        value: `${deltaScrollX} ${deltaScrollY}`,
        scrollValue: { x: deltaScrollX, y: deltaScrollY },
        mousePosition: { x: mouseX, y: mouseY },
      };

      win.webContents.send(Channel.win.ADD_EVENT_CANVAS, scrollEvent);
      console.log(scrollEvent);
      incrementCurrentEventIndex();
    }
  );
}

export function handleRecordCanvasHover(win: BrowserWindow) {
  ipcMain.on(
    Channel.view.record.CANVAS_HOVER,
    (event, bbox: BoundingBox, mouseX: number, mouseY: number) => {
      const eventId = getCurrentEventIndex();

      // Screenshot and send caption later
      handleGetCaption(win, bbox, eventId);

      const hoverEvent: CanvasEvent = {
        id: eventId,
        type: EventEnum.hover,
        target: "Waiting for caption...",
        value: null,
        mousePosition: { x: mouseX, y: mouseY },
      };

      win.webContents.send(Channel.win.ADD_EVENT_CANVAS, hoverEvent);
      console.log(hoverEvent);
      incrementCurrentEventIndex();
    }
  );
}

export function handleRecordCanvasInput(win: BrowserWindow) {
  ipcMain.on(Channel.view.record.CANVAS_INPUT, (event, value) => {
    const eventId = getCurrentEventIndex();

    const inputEvent: CanvasEvent = {
      id: eventId,
      type: EventEnum.input,
      target: "Target from previous event (Phy's job)",
      value: value,
    };

    win.webContents.send(Channel.win.ADD_EVENT_CANVAS, inputEvent);
    console.log(inputEvent);
    incrementCurrentEventIndex();
  });
}
