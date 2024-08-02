import { ipcRenderer } from "electron";
import {
  record,
  stopRecording,
  hoverEditHandler,
  startEdit,
  stopEditing,
} from "./Main/record";
import {
  replay,
  stopReplaying,
  getTestCase,
  setCurrentIndex,
} from "./Main/replay";
import { Channel } from "./Others/listenerConst";
import { AppMode } from "./Types/appMode";

function onload(load: boolean) {
  ipcRenderer.invoke(Channel.view.all.GET_MODE).then((mode: AppMode) => {
    if (mode === AppMode.record) {
      load ? record() : stopRecording();
    }
  });
}

window.addEventListener("load", () => {
  // document.body.addEventListener("mouseenter", hoverEditHandler, true);
  onload(true);
});

window.addEventListener("beforeunload", () => {
  // document.body.removeEventListener("mouseenter", hoverEditHandler, true);
  onload(false);
});

// Handle when toggle record notification is received
ipcRenderer.on(Channel.view.record.TOGGLE_RECORD, (event, currentMode) => {
  currentMode === AppMode.record ? record() : stopRecording();
});

// Handle when toggle replay notification is received
ipcRenderer.on(
  Channel.view.replay.TOGGLE_REPLAY,
  async (event, currentMode) => {
    currentMode === AppMode.replay ? replay() : stopReplaying();
  }
);

// Handle when test case is sent
ipcRenderer.on(Channel.view.replay.SEND_EVENTS, (event, testCase) => {
  getTestCase(testCase);
});

ipcRenderer.on(Channel.view.replay.SET_INDEX, (event, index) => {
  setCurrentIndex(index);
});

ipcRenderer.on(Channel.view.edit.TOGGLE_EDIT, (event, currentMode) => {
  currentMode === AppMode.edit ? startEdit() : stopEditing();
});
