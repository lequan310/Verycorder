import { AppMode } from "../Types/appMode";
import { Channel } from "./listenerConst";
import {
  BrowserView,
  BrowserWindow,
  ipcMain,
} from "electron";
import {
  elementScreenshot,
  getCurrentMode,
  initBBox,
  setMode,
  toggleEdit,
  toggleRecord,
  toggleReplay,
  updateTestEventList,
} from "./electronUtilities";

// ------------------- IPC EVENT export functionS -------------------
// export function to test log events
export function testLogEvents() {
  ipcMain.on(Channel.all.TEST_LOG, (event, data) => {
    console.log(data);
  });
}

export function ipcGetMode() {
  ipcMain.handle(Channel.view.all.GET_MODE, async (event) => {
    return getCurrentMode();
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
    toggleRecord();
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
  ipcMain.handle(Channel.GET_BBOX, async (event) => {
    return await initBBox();
  });
}

export function handleCaptureElementScreenshot() {
  ipcMain.on(Channel.ELEMENT_SCREENSHOT, (event, x, y, width, height) => {
      elementScreenshot(x,y,width,height);
  });
}