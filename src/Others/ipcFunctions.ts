import { AppMode } from "../Types/appMode";
import { Channel } from "./listenerConst";
import {
  BrowserView,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  webContents,
} from "electron";
import {
  getCurrentMode,
  setMode,
  toggleEdit,
  toggleRecord,
  toggleReplay,
  updateTestEventList,
} from "./electronUtilities";
import { processImage } from "./inference";
import Jimp from "jimp";

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

export function handleProcessImage() {
  // handle to process img
  ipcMain.on(Channel.all.PROCESS_IMAGE, async (event, imageBuffer: Buffer) => {
    const processedImageBuffer = await processImage(imageBuffer);
    event.sender.send("processed-image", processedImageBuffer);
  });

  // save image
  // const imgName = "image";
  // Jimp.read(imgName + ".png").then((image: Jimp) => {
  //   image.getBufferAsync(Jimp.MIME_JPEG).then((buffer: Buffer) => {
  //     processImage(buffer).then((processedImageBuffer: Jimp) => {
  //       processedImageBuffer.writeAsync(imgName + "-processed.png").then(() => {
  //         console.log("Image saved");
  //       });
  //     });
  //   });
  // });
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
