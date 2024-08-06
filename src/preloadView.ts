import { ipcRenderer } from "electron";
import { record, stopRecording } from "./Main/record";
import {
  replay,
  stopReplaying,
  getTestCase,
  setCurrentIndex,
} from "./Main/replay";
import { startEdit, stopEditing } from "./Main/edit";
import { Channel } from "./Others/listenerConst";
import { AppMode } from "./Types/appMode";
import { recordCanvas, stopRecordCanvas } from "./Main/record_canvas";
import { BoundingBox } from "./Types/bbox";

function onload(load: boolean) {
  ipcRenderer.invoke(Channel.view.all.GET_MODE).then((mode: AppMode) => {
    if (mode === AppMode.record) {
      load ? record() : stopRecording();
    }
    
    if (mode === AppMode.canvas_record) {
      if (load) {
        ipcRenderer.invoke(Channel.view.all.GET_BBOX).then((bboxes: BoundingBox[]) => {
          recordCanvas(bboxes);
        })
      } else {
        stopRecordCanvas();
      }
    }
  });
}

window.addEventListener("load", () => {
  onload(true);
});

window.addEventListener("beforeunload", () => {
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

ipcRenderer.on(Channel.view.record.TOGGLE_CANVAS_RECORD, (event, currentMode, bboxes) => {
  currentMode === AppMode.canvas_record ? recordCanvas(bboxes) : stopRecordCanvas();
})