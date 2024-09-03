import {
  BrowserWindow,
  ipcMain,
  dialog,
  SaveDialogReturnValue,
} from "electron";
import { handleUrl } from "./utilities";
import { CanvasTestCase, TestCase } from "../Types/testCase";
import { ChangeUrlResult } from "../Types/urlResult";
import { BLANK_PAGE, Channel } from "./listenerConst";
import { AppMode } from "../Types/appMode";
import { RecordedEvent } from "../Types/recordedEvent";
import { CanvasEvent } from "../Types/canvasEvent";
import {
  createOnnxSession,
  drawBoxes,
  getBBoxes,
  releaseOnnxSession,
} from "./inference";
import { Target } from "../Types/eventComponents";
import {
  handleClickRecord,
  handleClickReplay,
  handleNavigateInPage,
  handleUpdateTestCase,
  updateTestSteps,
  ipcGetMode,
  testLogEvents,
  handleTestCaseEnded,
  handleClickEdit,
  handleGetBBoxes,
  ipcGetDetectMode,
  handleRecordCanvasClick,
  handleRecordCanvasHover,
  handleRecordCanvasInput,
  handleRecordCanvasScroll,
  ipcSetDetectMode,
  handleUpdateCanvasTestCase,
  handleScreenshotForReplay,
  handleSetSimilarity,
  handleSaveFile,
  handleUploadFile,
} from "./ipcFunctions";
import { DetectMode } from "../Types/detectMode";
import { getReplayTargetBBox } from "./openai";
import { saveData } from "./file";
import fs from "fs";

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const BROWSER_VIEW_PRELOAD_WEBPACK_ENTRY: string;

let currentMode = AppMode.disabled;
let detectMode = DetectMode.DOM;
let testCase: TestCase;
let canvasTestCase: CanvasTestCase;
let abortController: AbortController;
let leftPosition = 326;
let currentEventIndex = 0;
let navigationCheck = false;
let editedTarget: Target = {
  css: "",
  xpath: "",
};
let screenshot: Buffer;

let win: BrowserWindow;
let view: BrowserWindow;
let overlayWin: BrowserWindow | null = null;

function initializeDOMTestCase() {
  const newTestCase: TestCase = {
    url: view.webContents.getURL(),
    events: [],
  };

  return newTestCase;
}

function initializeCanvasTestCase() {
  const newTestCase: CanvasTestCase = {
    url: view.webContents.getURL(),
    events: [],
  };

  return newTestCase;
}

export function toggleEdit() {
  if (
    currentMode === AppMode.record ||
    currentMode === AppMode.disabled ||
    currentMode === AppMode.replay
  )
    return;

  //if (!testCase || !testCase.events || testCase.events.length === 0) return;

  if (
    view.webContents.getURL() === "" ||
    view.webContents.getURL() === BLANK_PAGE
  )
    return;

  if (!testCase || !testCase.events) {
    testCase = initializeDOMTestCase();
  }

  if (!canvasTestCase || !canvasTestCase.events) {
    canvasTestCase = initializeCanvasTestCase();
  }

  toggleMode(AppMode.edit);
  win.webContents.send(Channel.win.UPDATE_STATE, currentMode);
  if (detectMode === DetectMode.DOM) {
    view.webContents.send(Channel.view.edit.TOGGLE_EDIT, currentMode);
  }
}

function updateEvent() {
  ipcMain.on(
    Channel.view.edit.UPDATE_EVENT_TARGET,
    async (event, eventTarget) => {
      console.log("Event updated");
      editedTarget = eventTarget;
      console.log("CSS Selector: ", editedTarget.css);
      console.log("xpath: ", editedTarget.xpath);
      win.webContents.send(Channel.win.SEND_TARGET, editedTarget);
    }
  );
}

export function getCanvasTestCase() {
  return canvasTestCase;
}

// Getter for win
export function getWin(): BrowserWindow {
  return win;
}

// Getter for view
export function getView(): BrowserWindow {
  return view;
}

// Function to create the web view to load webs
export function createBrowserView() {
  view = new BrowserWindow({
    webPreferences: {
      preload: BROWSER_VIEW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
    parent: win,
    frame: false,
    show: false,
    resizable: false,
  });

  view.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });
  view.webContents.loadURL(BLANK_PAGE); // Load blank page on start

  view.webContents.on("did-navigate", async (event, url) => {
    if (url === BLANK_PAGE) {
      view.hide();
      return;
    }
    win.webContents.send(Channel.win.UPDATE_URL, url); // Update URL in search bar
    view.show();
  });

  view.webContents.on("did-navigate-in-page", async (event, url) => {
    win.webContents.send(Channel.win.UPDATE_URL, url); // Update URL in search bar
  });
}

export const createWindow = (): void => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    show: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#fafafc",
      symbolColor: "#28282B",
      height: 40,
    },

    trafficLightPosition: {
      x: 15,
      y: 13, // macOS traffic lights seem to be 14px in diameter. If you want them vertically centered, set this to `titlebar_height / 2 - 7`.
    },

    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  createBrowserView();
  // win.setBrowserView(view);

  // Clear cache
  view.webContents.session.clearCache();
  // Maximize app on launch
  win.maximize();
  // Update view bounds for the app
  updateViewBounds();
  // Disable menu bar
  win.setMenu(null);
  // and load the index.html of the app.
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  //win.webContents.openDevTools({ mode: "detach" });

  // Update overlay window position when app window is moved
  win.on("will-move", () => view.setResizable(true));
  win.on("move", () => {
    updateViewBounds();
    view.setResizable(false);
  });

  // Handle resize app
  win.on("will-resize", () => view.setResizable(true));
  win.on("resize", () => {
    updateViewBounds();
    view.setResizable(false);
  });

  // Handle window close
  win.on("closed", () => {
    disableOverlay();
    win = null;
  });
};

// Create overlay window to prevent interaction during replay
export function createOverlayWindow() {
  const viewBounds = view.getBounds();
  const winBounds = win.getBounds();

  overlayWin = new BrowserWindow({
    x: winBounds.x + viewBounds.x,
    y: winBounds.y + viewBounds.y,
    width: viewBounds.width,
    height: viewBounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  // UNCOMMENT THIS TO SEE THE OVERLAY WINDOW
  // overlayWin.loadURL(
  //   "data:text/html;charset=utf-8," +
  //     encodeURI(
  //       '<html><body style="margin:0; padding:0; height:100%; background-color: rgba(255, 0, 0, 0.1); opacity: .4;"></body></html>'
  //     )
  // );
  overlayWin.setIgnoreMouseEvents(false);
}

export function enableOverlay() {
  if (!overlayWin) {
    createOverlayWindow();
  }
  overlayWin?.show();
  console.log("Overlay enabled");
}

export function disableOverlay() {
  if (overlayWin) {
    overlayWin.close();
    overlayWin = null;
    console.log("Overlay disabled");
  }
}

// Turn off overlay when replay ends
export function turnOffOverlay() {
  ipcMain.on(Channel.view.replay.UPDATE_OVERLAY, () => {
    disableOverlay();
  });
}

export function handleSwitchTab() {
  win.on("blur", () => {
    if (currentMode === AppMode.replay) {
      disableOverlay();
    }
  });

  win.on("focus", () => {
    if (currentMode === AppMode.replay) {
      enableOverlay();
    }
  });
}

function controlOverlay() {
  currentMode === AppMode.replay ? enableOverlay() : disableOverlay();
}

export function getCurrentMode() {
  return currentMode;
}

export function getDetectMode() {
  return detectMode;
}

function clearTestCase() {
  if (detectMode === DetectMode.DOM) {
    if (canvasTestCase) canvasTestCase.events = [];
  } else if (detectMode === DetectMode.AI) {
    if (testCase) testCase.events = [];
  }
}

export function setDetectMode(data: DetectMode) {
  console.log(data);
  detectMode = data;
  clearTestCase();
}

export function setMode(mode: AppMode) {
  currentMode = mode;
}

// Toggle record/replay/edit mode vs normal mode
function toggleMode(mode: AppMode) {
  if (mode === AppMode.record) {
    currentMode =
      currentMode === AppMode.record ? AppMode.normal : AppMode.record;
  } else if (mode === AppMode.replay) {
    currentMode =
      currentMode === AppMode.replay ? AppMode.normal : AppMode.replay;
  } else if (mode === AppMode.edit) {
    currentMode = currentMode === AppMode.edit ? AppMode.normal : AppMode.edit;
  }
}

export function getScreenshot() {
  return screenshot;
}

export function getCurrentEventIndex() {
  return currentEventIndex;
}

export function incrementCurrentEventIndex() {
  currentEventIndex++;
}

export function updateTestEventList(eventList: RecordedEvent[]) {
  testCase.events = eventList;
  if (testCase.events.length === 0) {
    win.webContents.send(Channel.win.UPDATE_STATE, getCurrentMode());
  }
}

export function updateCanvasTestEventList(
  updatedCanvasEventList: CanvasEvent[]
) {
  canvasTestCase.events = updatedCanvasEventList;
  if (canvasTestCase.events.length === 0) {
    win.webContents.send(Channel.win.UPDATE_STATE, getCurrentMode());
  }
  //console.log(canvasTestCase.events);
}

// Export for Ctrl + R to toggle record
export async function toggleRecord() {
  if (
    currentMode === AppMode.replay ||
    currentMode === AppMode.disabled ||
    currentMode === AppMode.edit
  )
    return;

  if (
    view.webContents.getURL() === "" ||
    view.webContents.getURL() === BLANK_PAGE
  )
    return;

  toggleMode(AppMode.record);
  win.webContents.send(Channel.win.UPDATE_STATE, currentMode, detectMode); // Send message to change UI (disable search bar)
  console.log("Current mode: ", currentMode);

  if (detectMode === DetectMode.DOM) {
    if (currentMode === AppMode.record) {
      testCase = initializeDOMTestCase();
    }
  } else {
    if (currentMode === AppMode.record) {
      currentEventIndex = 0;
      canvasTestCase = initializeCanvasTestCase();
      await createOnnxSession();
    } else {
      await releaseOnnxSession();
    }
  }

  view.webContents.send(
    Channel.view.record.TOGGLE_RECORD,
    currentMode,
    detectMode
  ); // Send message to attach event listeners
}

export async function initBBox() {
  const image = await getViewScreenshotBuffer();
  const bboxes = await getBBoxes(image);
  const drawnBuffer = await drawBoxes(image, bboxes, true);
  saveData("./logs/bboxes.json", JSON.stringify(bboxes, null, "\t"));
  saveData("./logs/bboxes.png", drawnBuffer);

  return bboxes;
}

export async function getViewScreenshotBuffer() {
  const image = (await view.webContents.capturePage()).toPNG();
  screenshot = image;

  saveData("./logs/screenshot.png", image);
  return image;
}

export function handleFindCanvasReplayTarget() {
  ipcMain.handle(
    Channel.view.replay.GET_TARGET_BBOX,
    async (event, clickedBuffer, locator) => {
      console.log("hanlding find canvas replay target");
      const image = await getViewScreenshotBuffer();
      console.log(locator);

      const result = await getReplayTargetBBox(image, locator, clickedBuffer);
      return result;
    }
  );
}

// Handle URL change via search bar with abort controller
function changeUrlWithAbort(
  url: string,
  view: BrowserWindow,
  signal: AbortSignal
): Promise<ChangeUrlResult> {
  if (!url) {
    // If the URL is invalid
    view.webContents.loadURL(BLANK_PAGE);
    currentMode = AppMode.disabled;
    win.webContents.send(Channel.win.UPDATE_STATE, currentMode);
    return Promise.resolve({ success: false, message: "Invalid URL" });
  }

  if (!view) {
    // If there is no browser view available
    view.webContents.loadURL(BLANK_PAGE);
    currentMode = AppMode.disabled;
    win.webContents.send(Channel.win.UPDATE_STATE, currentMode);
    return Promise.resolve({ success: false, message: "Browser view error" });
  }

  return new Promise<ChangeUrlResult>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Aborted"));
      return;
    }

    const handleAbort = () => {
      reject(new Error("Aborted"));
    };

    signal.addEventListener("abort", handleAbort);

    view.webContents
      .loadURL(url)
      .then(() => {
        signal.removeEventListener("abort", handleAbort);
        resolve({ success: true, message: "Success" });
        if (currentMode === AppMode.disabled) {
          currentMode = AppMode.normal;
          win.webContents.send(Channel.win.UPDATE_STATE, currentMode); // Send message to change UI (disable search bar)
        }
      })
      .catch((error) => {
        signal.removeEventListener("abort", handleAbort);
        resolve({ success: false, message: "Cannot connect to URL" });
        currentMode = AppMode.disabled;
        win.webContents.send(Channel.win.UPDATE_STATE, currentMode); // Send message to change UI (disable search bar)
      });
  });
}

async function changeUrlFinal(url: string) {
  if (abortController) abortController.abort();
  abortController = new AbortController();
  const signal = abortController.signal;

  const response = await changeUrlWithAbort(url, view, signal).catch((error) =>
    console.log("Aborted")
  );

  return response;
}

function handleOverlayUpdate() {
  if (overlayWin) {
    const [winX, winY] = win.getPosition();
    const viewBounds = view.getBounds();
    overlayWin.setBounds({
      x: winX + viewBounds.x,
      y: winY + viewBounds.y,
      width: viewBounds.width,
      height: viewBounds.height,
    });
    //console.log("Overlay bounds updated");
  }
}

// Update size and location of browser view
export function updateViewBounds() {
  if (win) {
    const bounds = win.getContentBounds();
    if (view) {
      const { x, y, width, height } = bounds;
      const newBounds = {
        x: x + leftPosition,
        y: y + 40,
        width: Math.floor(width - leftPosition),
        height: Math.floor(height - 40),
      };
      view.setBounds(newBounds);

      handleOverlayUpdate();
    }
  }
}

async function goToUrlReplay() {
  const isReplayMode = getCurrentMode() === AppMode.replay;
  const isAIMode = detectMode === DetectMode.AI;
  const isDOMMode = detectMode === DetectMode.DOM;

  if (
    isReplayMode &&
    ((isAIMode &&
      canvasTestCase &&
      canvasTestCase.events &&
      canvasTestCase.events.length > 0) ||
      (isDOMMode && testCase && testCase.events && testCase.events.length > 0))
  ) {
    const url = isAIMode ? canvasTestCase.url : testCase.url;
    await changeUrlFinal(url);
  }
}

export async function toggleReplay() {
  if (
    currentMode === AppMode.record ||
    currentMode === AppMode.disabled ||
    currentMode === AppMode.edit
  )
    return;

  if (
    view.webContents.getURL() === "" ||
    view.webContents.getURL() === BLANK_PAGE
  )
    return;

  // Return if there are no test steps or no test cases, since cannot replay
  toggleMode(AppMode.replay);
  win.webContents.send(Channel.win.UPDATE_STATE, currentMode, detectMode); // Send message to change UI (disable search bar)
  console.log("Current mode: ", currentMode);

  await goToUrlReplay();

  // If replay meets condition
  if (currentMode === AppMode.replay) {
    if (
      (detectMode === DetectMode.AI &&
        canvasTestCase &&
        canvasTestCase.events &&
        canvasTestCase.events.length > 0) ||
      (detectMode === DetectMode.DOM &&
        testCase &&
        testCase.events &&
        testCase.events.length > 0)
    ) {
      // Send the appropriate test case to process for replay.
      const replayTestCase =
        detectMode === DetectMode.AI ? canvasTestCase : testCase;
      view.webContents.send(
        Channel.view.replay.SEND_EVENTS,
        replayTestCase,
        detectMode
      );
      console.log("Test case sent");
    } else {
      // If the appropriate test case is empty or not available
      currentMode = AppMode.normal;
      console.log("There are no test cases.");
    }
  }

  if (detectMode === DetectMode.AI) {
    if (currentMode === AppMode.replay) {
      await createOnnxSession();
    } else {
      await releaseOnnxSession();
    }
  }

  controlOverlay();
  win.webContents.send(Channel.win.UPDATE_STATE, currentMode, detectMode); // Send message to change UI (disable search bar)
  view.webContents.send(
    Channel.view.replay.TOGGLE_REPLAY,
    currentMode,
    detectMode
  );
}

// Save test case
export async function saveTestCase() {
  const saveFolder = "./save/";
  const saveDialogResult = await dialog.showSaveDialog({
    title: "testCase",
    filters: [{ name: "JSON Save File", extensions: ["json"] }],
    defaultPath: saveFolder,
  });

  if (!saveDialogResult.canceled && saveDialogResult.filePath) {
    if (detectMode === DetectMode.DOM) {
      fs.writeFileSync(
        saveDialogResult.filePath,
        JSON.stringify({ testCase, mode: detectMode })
      );
    } else {
      fs.writeFileSync(
        saveDialogResult.filePath,
        serializeCanvasTestCase(canvasTestCase)
      );
    }
  } else {
    return;
  }
}

//JSON Helper function
function serializeCanvasTestCase(canvasTestCase: CanvasTestCase) {
  return JSON.stringify({
    canvasTestCase: {
      ...canvasTestCase,
      events: canvasTestCase.events.map((event) => ({
        ...event,
        buffer: event.buffer
          ? { type: "Buffer", data: event.buffer.toString("hex") }
          : null,
      })),
    },
    mode: detectMode,
  });
}

function deserializeCanvasTestCase(data: {
  canvasTestCase: {
    url: string;
    events: CanvasEvent[];
  };
  mode: string;
}): // {
//   canvasTestCase: {
//     url: string;
//     events: CanvasEvent[];
//   };
// }
any {
  return {
    canvasTestCase: {
      ...data.canvasTestCase,
      events: data.canvasTestCase.events.map((event: any) => ({
        ...event,
        buffer:
          event.buffer && event.buffer.type === "Buffer"
            ? Buffer.from(event.buffer.data, "hex")
            : null,
      })),
    },
  };
}

// Clear current test case and load test case
export async function loadTestCase() {
  const loadDialogResult = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "JSON Save File", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!loadDialogResult.canceled && loadDialogResult.filePaths) {
    const importedTestCase = JSON.parse(
      fs.readFileSync(loadDialogResult.filePaths[0]).toString()
    );

    console.log(importedTestCase);
    if (importedTestCase.mode === DetectMode.DOM) {
      testCase = initializeDOMTestCase();
      testCase.url = importedTestCase.testCase.url;
      testCase.events = importedTestCase.testCase.events;
      //Send test case to FE
      win.webContents.send(Channel.win.SEND_BULK_TEST_CASE, testCase.events);
      view.webContents.loadURL(testCase.url);
    } else {
      const importedData = deserializeCanvasTestCase(importedTestCase);
      canvasTestCase = initializeCanvasTestCase();
      canvasTestCase.url = importedData.canvasTestCase.url;
      canvasTestCase.events = importedData.canvasTestCase.events;
      //Send test case to FE
      win.webContents.send(
        Channel.win.SEND_BULK_CANVAS_TEST_CASE,
        canvasTestCase.events
      );
      view.webContents.loadURL(canvasTestCase.url);
    }

    if (importedTestCase) {
      setMode(AppMode.normal);
      win.webContents.send(Channel.win.UPDATE_STATE, currentMode);
    }
  } else {
    return;
  }
}

// function loadDataIntoTestCase() {}

// ------------------- HANDLING GROUP FUNCTIONS -------------------
// Handle UI events from React to Electron
export function handleUIEvents() {
  handleUrlChange();
  handleUpdateTestCase();
  handleClickRecord();
  handleClickReplay();
  handleClickEdit();
  updateTestSteps(win);
  handleResize();
  ipcSetDetectMode();
  handleUpdateCanvasTestCase();
  handleSetSimilarity();
  handleSaveFile();
  handleUploadFile();
}

// Function to register events (click, input, etc.) into left panel
export function handleRecordEvents(eventNames: string[]) {
  for (const eventName of eventNames) {
    ipcMain.on(eventName, (event, data) => {
      win.webContents.send(Channel.win.ADD_EVENT, data);
    });
  }
}

export function handleRecordCanvas() {
  handleRecordCanvasClick(win);
  handleRecordCanvasHover(win);
  handleRecordCanvasInput(win);
  handleRecordCanvasScroll(win);
}

export function handleViewEvents() {
  ipcGetMode();
  ipcGetDetectMode();
  testLogEvents();
  handleTestCaseEnded(win);
  handleNavigateInPage(view);
  handleNavigate(view);
  getCurrentIndex();
  turnOffOverlay();
  handleSwitchTab();
  updateEvent();
  // updateEventFromFrontend();
  handleGetBBoxes();
  handleScreenshotForReplay();
  handleFindCanvasReplayTarget();
}

// ------------------- IPC EVENT FUNCTIONS -------------------
function handleResize() {
  ipcMain.on(Channel.win.BEGIN_RESIZE, () => {
    view.resizable = true;
  });

  //on ipcMain, hide browserview
  ipcMain.on(Channel.win.END_RESIZE, (event, leftX) => {
    // console.log(leftPosition);
    leftPosition = leftX + 78 - 12;
    updateViewBounds();
    view.resizable = false;
  });
}

function handleUrlChange() {
  ipcMain.handle(Channel.win.URL_CHANGE, async (event, url) => {
    // Abort controller stuff
    url = handleUrl(url); // Assume this function properly formats the URL
    const response = await changeUrlFinal(url);
    return response;
  });
}

// Get the current index of the test case during replay
export function getCurrentIndex() {
  ipcMain.on(
    Channel.view.replay.GET_INDEX,
    async (event, index, replayCheck) => {
      currentEventIndex = index;
      navigationCheck = replayCheck;
      console.log("Current Index updated: ", currentEventIndex);
      console.log("Navigation check: ", navigationCheck);
    }
  );
}

export function handleNavigate(view: BrowserWindow) {
  view.webContents.on("did-finish-load", () => {
    if (getCurrentMode() === AppMode.replay) {
      console.log("Navigation finished during replay");
      //console.log("Current Index (from view): ", currentEventIndex);
      console.log("Navigation check (replay event started): ", navigationCheck);
      // Start replay again whenever the page is loaded during replay
      if (currentEventIndex >= 0 && navigationCheck) {
        const eventsToSend =
          detectMode === DetectMode.AI ? canvasTestCase : testCase;
        view.webContents.send(
          Channel.view.replay.SEND_EVENTS,
          eventsToSend,
          detectMode
        );
        console.log("Test case sent again");
        view.webContents.send(
          Channel.view.replay.SET_INDEX,
          currentEventIndex + 1,
          detectMode
        );
        console.log("Current Index sent: ", currentEventIndex + 1);
        view.webContents.send(
          Channel.view.replay.TOGGLE_REPLAY,
          currentMode,
          detectMode
        );
        console.log("Replay mode toggled again");
      }
    } else if (getCurrentMode() === AppMode.edit) {
      console.log("Navigation finished during edit");
      view.webContents.send(Channel.view.edit.TOGGLE_EDIT, currentMode);
    }
  });
}
