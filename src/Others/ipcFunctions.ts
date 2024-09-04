import { AppMode } from "../Types/appMode";
import { Channel } from "./listenerConst";
import { BrowserWindow, ipcMain } from "electron";
import {
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
  updateCanvasTestEventList,
  getScreenshot,
  getViewScreenshotBuffer,
  saveTestCase,
  loadTestCase,
} from "./electronUtilities";
import { getCaption, setSimilarity } from "./openai";
import { EventEnum } from "../Types/eventComponents";
import { BoundingBox } from "../Types/bbox";
import {
  CanvasClickEvent,
  CanvasHoverEvent,
  CanvasInputEvent,
  CanvasScrollEvent,
} from "../Types/canvasEvent";
import { DetectMode } from "../Types/detectMode";
import { releaseOnnxSession, cropImageBuffer } from "./inference";

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

export function handleUpdateCanvasTestCase() {
  ipcMain.on(
    Channel.win.UPDATE_CANVAS_EVENT_LIST,
    (event, updatedCanvasEventList) => {
      updateCanvasTestEventList(updatedCanvasEventList);
    }
  );
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

export function handleNavigateInPage(view: BrowserWindow) {
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
    if (getDetectMode() === DetectMode.AI) {
      releaseOnnxSession();
    }
  });
}

export function handleGetBBoxes() {
  ipcMain.handle(Channel.view.record.GET_BBOX, async (event) => {
    return await initBBox();
  });
}

function handleGetCaption(win: BrowserWindow, buffer: Buffer, id: number) {
  const base64image = buffer.toString("base64");
  getCaption(base64image).then((caption) => {
    win.webContents.send(Channel.win.UPDATE_EVENT_CAPTION, id, caption);
  });
}

export function handleRecordCanvasClick(win: BrowserWindow) {
  ipcMain.on(
    Channel.view.record.CANVAS_CLICK,
    async (event, bbox: BoundingBox, mouseX: number, mouseY: number) => {
      const eventId = getCurrentEventIndex();
      incrementCurrentEventIndex();

      // Screenshot and send caption later
      const croppedImageBuffer = await cropImageBuffer(getScreenshot(), bbox);
      handleGetCaption(win, croppedImageBuffer, eventId);

      const clickEvent: CanvasClickEvent = {
        id: eventId,
        type: EventEnum.click,
        target: "Waiting for caption...",
        value: null,
        mousePosition: { x: mouseX, y: mouseY },
      };

      win.webContents.send(Channel.win.ADD_EVENT_CANVAS, clickEvent);
      console.log(clickEvent);
    }
  );
}

export function handleRecordCanvasScroll(win: BrowserWindow) {
  ipcMain.on(
    Channel.view.record.CANVAS_SCROLL,
    async (event, deltaScrollX, deltaScrollY, mouseX, mouseY) => {
      const eventId = getCurrentEventIndex();
      incrementCurrentEventIndex();

      const scrollEvent: CanvasScrollEvent = {
        id: eventId,
        type: EventEnum.scroll,
        target: "window",
        value: `${deltaScrollX} ${deltaScrollY}`,
        scrollValue: { x: deltaScrollX, y: deltaScrollY },
        mousePosition: { x: mouseX, y: mouseY },
      };

      win.webContents.send(Channel.win.ADD_EVENT_CANVAS, scrollEvent);
      console.log(scrollEvent);
    }
  );
}

export function handleRecordCanvasHover(win: BrowserWindow) {
  ipcMain.on(
    Channel.view.record.CANVAS_HOVER,
    async (event, bbox: BoundingBox, mouseX: number, mouseY: number) => {
      const eventId = getCurrentEventIndex();
      incrementCurrentEventIndex();

      // Screenshot and send caption later
      const croppedImageBuffer = await cropImageBuffer(getScreenshot(), bbox);
      handleGetCaption(win, croppedImageBuffer, eventId);

      const hoverEvent: CanvasHoverEvent = {
        id: eventId,
        type: EventEnum.hover,
        target: "Waiting for caption...",
        value: null,
        mousePosition: { x: mouseX, y: mouseY },
      };

      win.webContents.send(Channel.win.ADD_EVENT_CANVAS, hoverEvent);
      console.log(hoverEvent);
    }
  );
}

export function handleRecordCanvasInput(win: BrowserWindow) {
  ipcMain.on(
    Channel.view.record.CANVAS_INPUT,
    async (event, cssSelector, value) => {
      const eventId = getCurrentEventIndex();
      incrementCurrentEventIndex();

      const inputEvent: CanvasInputEvent = {
        id: eventId,
        type: EventEnum.input,
        target: cssSelector,
        value: value,
        mousePosition: null,
      };

      win.webContents.send(Channel.win.ADD_EVENT_CANVAS, inputEvent);
      console.log(inputEvent);
    }
  );
}

export function handleScreenshotForReplay() {
  ipcMain.handle(Channel.view.replay.GET_SCREENSHOT, async () => {
    return await getViewScreenshotBuffer();
  });
}

export function handleSetSimilarity() {
  ipcMain.on(Channel.win.SET_SIMILARITY, (event, similarity: number) => {
    setSimilarity(similarity);
  });
}

export function handleSaveFile() {
  ipcMain.on(Channel.win.SAVE_FILE, () => {
    saveTestCase();
  });
}

export function handleUploadFile() {
  ipcMain.on(Channel.win.UPLOAD_FILE, () => {
    loadTestCase();
  });
}
