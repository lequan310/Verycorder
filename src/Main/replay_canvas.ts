import { delay } from "../Others/utilities";
import { ipcRenderer } from "electron";
import { Channel } from "../Others/listenerConst";
import { CanvasTestCase } from "../Types/testCase";
import { getReplayTargetBBox } from "../Others/openai";
import { CanvasEvent } from "../Types/canvasEvent";

let abortController: AbortController;
let isReplaying = true; // Flag to control the replay
let currentEventIndex = 0;
let canvasTestCase: CanvasTestCase;

// Reset index in both replay.ts and electron Utils to 0
function resetIndex() {
  currentEventIndex = 0;
  ipcRenderer.send(Channel.view.replay.GET_INDEX, currentEventIndex, false);
}

export function getCanvasTestCase(newCanvasTestCase: CanvasTestCase) {
  canvasTestCase = newCanvasTestCase;
  ipcRenderer.send(
    Channel.all.TEST_LOG,
    "Test case received: " + canvasTestCase.events
  );
}

async function delayWithAbort(ms: number, signal: AbortSignal) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error("aborted"));
    });
  });
}

function getCurrentScreenshot(): Promise<Buffer> {
  try {
    return new Promise((resolve, reject) => {
      ipcRenderer
        .invoke(Channel.view.replay.GET_SCREENSHOT)
        .then((screenshot: Buffer) => {
          resolve(screenshot);
        })
        .catch((error) => {
          reject(error);
        });
    });
  } catch (error) {
    ipcRenderer.send(Channel.all.TEST_LOG, error.message);
    return null;
  }
}

async function controlReplayLogic(event: CanvasEvent) {
  const image = await getCurrentScreenshot();
  const locator = event.target;
  if (!image) {
    ipcRenderer.send(Channel.all.TEST_LOG, "Failed to get screenshot");
    return false;
  } else {
    ipcRenderer.send(Channel.all.TEST_LOG, image);
    ipcRenderer.send(Channel.all.TEST_LOG, locator);
    const result = await ipcRenderer.invoke(
      Channel.view.replay.GET_TARGET_BBOX,
      image,
      locator
    );
    ipcRenderer.send(Channel.all.TEST_LOG, result);
  }

  return true;
}

async function manageCanvasReplay() {
  abortController = new AbortController();
  const signal = abortController.signal;

  for (
    currentEventIndex;
    currentEventIndex < canvasTestCase.events.length;
    currentEventIndex++
  ) {
    if (signal.aborted || !isReplaying) return;

    const event = canvasTestCase.events[currentEventIndex];
    const result = controlReplayLogic(event);

    if (!result) {
      ipcRenderer.send(Channel.win.NEXT_REPLAY, {
        index: currentEventIndex,
        state: false,
      });
      ipcRenderer.send(
        Channel.all.TEST_LOG,
        `Event ${currentEventIndex} failed to replay`
      );
      resetIndex();
      //turnOffOverlay();
      return;
    }
    ipcRenderer.send(Channel.win.NEXT_REPLAY, {
      index: currentEventIndex + 1,
      state: true,
    });

    // Stop when complete immediately
    if (currentEventIndex == canvasTestCase.events.length - 1) {
      // Reset index when out of test cases
      resetIndex();
      //turnOffOverlay();
      return;
    }

    // Delay with abort handling
    try {
      await delayWithAbort(2000, signal);
    } catch (error) {
      ipcRenderer.send(Channel.all.TEST_LOG, error.message);
      return;
    }
  }
}

export async function replayCanvas() {
  await delay(2000); // Delay for 2 seconds before replaying
  await manageCanvasReplay();

  // If not aborted
  if (isReplaying) {
    isReplaying = false;
    ipcRenderer.send(Channel.view.replay.TEST_CASE_ENDED);
  }
}

export function stopReplayCanvas() {
  isReplaying = false;
  abortController.abort();

  // Reset index when aborted
  resetIndex();
}
