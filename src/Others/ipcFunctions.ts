import { AppMode } from "../Types/appMode";
import { Channel } from "./listenerConst";
import { BrowserView, BrowserWindow, ipcMain, webContents } from "electron";
import { getCurrentMode, setMode, toggleRecord, toggleReplay, updateTestEventList } from "./electronUtilities";

// ------------------- IPC EVENT export functionS -------------------
// export function to test log events
export function testLogEvents() {
    ipcMain.on(Channel.TEST_LOG, (event, data) => {
        console.log(data);
    });
}

export function ipcGetMode() {
    ipcMain.handle(Channel.GET_MODE, async (event) => {
        return getCurrentMode();
    });
}

export function updateTestSteps(win: BrowserWindow) {
    ipcMain.on(Channel.NEXT_REPLAY, async (event, data) => {
        win.webContents.send(Channel.NEXT_REPLAY, data);
    });
}

export function handleUpdateTestCase() {
    ipcMain.on(Channel.UPDATE_TEST_CASE, (event, updatedEventList) => {
        updateTestEventList(updatedEventList);
    });
}

export function handleClickRecord() {
    ipcMain.handle(Channel.CLICK_RECORD, async (event) => {
        toggleRecord();
        return getCurrentMode();
    });
}

export function handleClickReplay() {
    ipcMain.handle(Channel.CLICK_REPLAY, async (event) => {
        toggleReplay();
        return getCurrentMode();
    });
}

export function handleNavigateInPage(view: BrowserView) {
    view.webContents.on("did-navigate-in-page", () => {
        if (getCurrentMode() === AppMode.replay) {
            const status = true;
            console.log("Navigation started during replay");
            view.webContents.send(Channel.UPDATE_NAVIGATE, status);
        }
    });
}

export function handleNavigate(view: BrowserView) {
    view.webContents.on("did-finish-load", () => {
        if (getCurrentMode() === AppMode.replay) {
            const status = false;
            console.log("Navigation finished during replay");
            view.webContents.send(Channel.UPDATE_NAVIGATE, status);
        }
    });
}

export function handleTestCaseEnded() {
    ipcMain.on(Channel.TEST_CASE_ENDED, (event) => {
        setMode(AppMode.normal);
    });
}