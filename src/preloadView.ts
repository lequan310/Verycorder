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
import { DetectMode } from "./Types/detectMode";
import {
  getCanvasTestCase,
  replayCanvas,
  stopReplayCanvas,
} from "./Main/replay_canvas";

async function onload(load: boolean) {
  let mode = await ipcRenderer.invoke(Channel.view.all.GET_MODE);
  let detectMode = await ipcRenderer.invoke(Channel.view.all.GET_DETECT_MODE);

  if (mode === AppMode.record) {
    if (detectMode === DetectMode.AI) {
      if (load) {
        ipcRenderer
          .invoke(Channel.view.record.GET_BBOX)
          .then((bboxes: BoundingBox[]) => {
            recordCanvas(bboxes);
          });
      } else {
        stopRecordCanvas();
      }
    } else {
      load ? record() : stopRecording();
    }
  }
}

window.addEventListener("load", async () => {
  await onload(true);
});

window.addEventListener("beforeunload", async () => {
  await onload(false);
});

// Handle when toggle record notification is received
ipcRenderer.on(
  Channel.view.record.TOGGLE_RECORD,
  (event, currentMode, detectMode) => {
    if (currentMode === AppMode.record) {
      if (detectMode === DetectMode.AI) {
        ipcRenderer
          .invoke(Channel.view.record.GET_BBOX)
          .then((bboxes: BoundingBox[]) => {
            recordCanvas(bboxes);
          });
      } else {
        record();
      }
    } else {
      if (detectMode === DetectMode.AI) {
        stopRecordCanvas();
      } else {
        stopRecording();
      }
    }
  }
);

// Handle when toggle replay notification is received
ipcRenderer.on(
  Channel.view.replay.TOGGLE_REPLAY,
  async (event, currentMode, detectMode) => {
    if (detectMode === DetectMode.AI) {
      currentMode === AppMode.replay ? replayCanvas() : stopReplayCanvas();
    } else {
      currentMode === AppMode.replay ? replay() : stopReplaying();
    }
  }
);

// Handle when test case is sent
ipcRenderer.on(
  Channel.view.replay.SEND_EVENTS,
  (event, testCase, detectMode) => {
    if (detectMode === DetectMode.AI) {
      getCanvasTestCase(testCase);
    } else {
      getTestCase(testCase);
    }
  }
);

ipcRenderer.on(Channel.view.replay.SET_INDEX, (event, index) => {
  setCurrentIndex(index);
});

ipcRenderer.on(Channel.view.edit.TOGGLE_EDIT, (event, currentMode) => {
  currentMode === AppMode.edit ? startEdit() : stopEditing();
});
