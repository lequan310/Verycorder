import { BrowserView, BrowserWindow, ipcMain, webContents } from "electron";
import { handleUrl } from "./utilities";
import { TestCase } from "../Types/testCase";
import { ChangeUrlResult } from "../Types/urlResult";
import { BLANK_PAGE, Channel } from "./listenerConst";

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const BROWSER_VIEW_PRELOAD_WEBPACK_ENTRY: string;

let recording = false;
let replaying = false;
let testCase: TestCase;
let abortController: AbortController;
let leftPosition = 350 + 24;

let win: BrowserWindow;
let view: BrowserView;

// Getter for win
export function getWin(): BrowserWindow {
  return win;
}

// Getter for view
export function getView(): BrowserView {
  return view;
}

// Function to create the web view to load webs
export function createBrowserView() {
  view = new BrowserView({
    webPreferences: {
      preload: BROWSER_VIEW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  view.webContents.loadURL(BLANK_PAGE); // Load blank page on start

  view.webContents.on("did-navigate", async (event, url) => {
    if (url === BLANK_PAGE) return;
    win.webContents.send(Channel.UPDATE_URL, url); // Update URL in search bar
  });

  view.webContents.on("did-navigate-in-page", async (event, url) => {
    win.webContents.send(Channel.UPDATE_URL, url); // Update URL in search bar
  });
}

export const createWindow = (): void => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  createBrowserView();
  win.setBrowserView(view);

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

  // Handle resize app
  win.on("resize", () => updateViewBounds());
  // Handle window close
  win.on("closed", () => {
    win = null;
  });
};

export function getCurrentMode() {
  return recording ? "record" : replaying ? "replay" : "normal";
}

// Export for Ctrl + R to toggle record
export function toggleRecord() {
  if (replaying) return;
  if (
    view.webContents.getURL() === "" ||
    view.webContents.getURL() === BLANK_PAGE
  )
    return;

  recording = !recording;

  if (recording) {
    const { x, y, width, height } = view.getBounds();
    testCase = {
      url: view.webContents.getURL(),
      events: [],
      size: { width, height },
    };
  }

  view.webContents.send(Channel.TOGGLE_RECORD, recording); // Send message to attach event listeners
  win.webContents.send(Channel.TOGGLE_RECORD, recording); // Send message to change UI (disable search bar)
}

// Handle URL change via search bar with abort controller
function changeUrlWithAbort(
  url: string,
  view: BrowserView,
  signal: AbortSignal
): Promise<ChangeUrlResult> {
  if (!url) {
    // If the URL is invalid
    view.webContents.loadURL(BLANK_PAGE);
    return Promise.resolve({ success: false, message: "Invalid URL" });
  }

  if (!view) {
    // If there is no browser view available
    view.webContents.loadURL(BLANK_PAGE);
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
      })
      .catch((error) => {
        signal.removeEventListener("abort", handleAbort);
        resolve({ success: false, message: "Cannot connect to URL" });
      });
  });
}

// Update size and location of browser view
export function updateViewBounds() {
  if (win) {
    const bounds = win.getContentBounds();
    if (view) {
      const { x, y, width, height } = bounds;
      view.setBounds({
        x: leftPosition,
        y: 70,
        width: Math.floor(width - leftPosition - 12),
        height: Math.floor(height - 70 - 12),
      });
    }
  }
}

// Function to access the URL in the browser view, from another file
export function goToUrl() {
  if (
    getCurrentMode() === "replay" &&
    testCase &&
    testCase.events &&
    testCase.events.length > 0
  ) {
    const view = win.getBrowserView();
    console.log('Load URL: ' + testCase.url);
    view.webContents.loadURL(testCase.url);
    
  } else {
    console.log(
      "Cant load because current mode is ",
      getCurrentMode(),
      " or no test case"
    );
    console.log("Current test cases: ", testCase);
  }
}

export function toggleReplay() {
  if (recording) return;
  if (
    view.webContents.getURL() === "" ||
    view.webContents.getURL() === BLANK_PAGE
  )
    return;
  replaying = !replaying;
  goToUrl();

  setTimeout(() => {
    if (testCase && testCase.events && testCase.events.length > 0) {
      
      // Send test case to process for replay.
      view.webContents.send(Channel.SEND_EVENT, testCase);
      // Send message to toggle playback
      view.webContents.send(Channel.TOGGLE_REPLAY, replaying);
      console.log("Replaying : ", replaying);
    } else {
      //view.webContents.send(Channel.TOGGLE_REPLAY, replaying); // Send message to toggle playback
      win.webContents.send(Channel.TOGGLE_REPLAY, false);
      console.log("There are no test cases.");
    }
  }, 2000);
}

// ------------------- HANDLING GROUP FUNCTIONS -------------------
// Handle UI events from React to Electron
export function handleUIEvents() {
  handleUrlChange();
  handleUpdateTestCase();
  handleClickRecord();
  handleClickReplay();
  handleEndResize();
}

// Function to register events (click, input, etc.) into left panel
export function handleRecordEvents(eventNames: string[]) {
  for (const eventName of eventNames) {
    ipcMain.on(eventName, (event, data) => {
      win.webContents.send(Channel.ADD_EVENT, data);
    });
  }
}

export function handleViewEvents() {
  ipcGetMode();
  testLogEvents();
  updateReplay();
  updateReplayButton();
  updateUIReplay();
}

// ------------------- IPC EVENT FUNCTIONS -------------------
// Function to test log events
function testLogEvents() {
  ipcMain.on(Channel.TEST_LOG, (event, data) => {
    console.log(data);
  });
}

function ipcGetMode() {
  ipcMain.handle(Channel.GET_MODE, async (event) => {
    return getCurrentMode();
  });
}

// Function set replaying to false on command
function updateReplay() {
  ipcMain.on(Channel.UPDATE_REPLAY, (event, data) => {
    replaying = data;
    console.log("Replaying : ", replaying);
  });
}

function updateReplayButton() {
  ipcMain.on(Channel.TOGGLE_REPLAY, async (event, data) => {
    win.webContents.send(Channel.TOGGLE_REPLAY, data);
    console.log("----------------toggle_replay updateReplayButton" + data);
  });
}

function updateUIReplay() {
  ipcMain.on(Channel.NEXT_REPLAY, async (event, data) => {
    win.webContents.send(Channel.NEXT_REPLAY, data);
  });
}

// export function handleBeginResize(win: BrowserWindow) {
//   //on ipcMain, hide browserview
//   ipcMain.handle(Channel.BEGIN_RESIZE, (event) => {
//     // view.webContents.send(Channel.BEGIN_RESIZE);
//     const view = win.getBrowserView();
//     if (view) {
//       view.setBounds({ x: 0, y: 0, width: 0, height: 0 });
//     }
//     console.log("On Start Resize");
//   });
// }

function handleEndResize() {
  //on ipcMain, hide browserview
  ipcMain.on(Channel.END_RESIZE, (event, leftX) => {
    // console.log(leftPosition);
    if (win) {
      const bounds = win.getContentBounds();
      const view = win.getBrowserView();
      leftPosition = leftX + 24;
      if (view) {
        const { x, y, width, height } = bounds;
        view.setBounds({
          x: leftPosition,
          y: 70,
          width: Math.floor(width - leftPosition - 12),
          height: Math.floor(height - 70 - 12),
        });
      }
    }
    // console.log("On Start Resize");
  });
}

function handleUrlChange() {
  ipcMain.handle(Channel.URL_CHANGE, async (event, url) => {
    // Abort controller stuff
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    url = handleUrl(url); // Assume this function properly formats the URL
    const response = await changeUrlWithAbort(url, view, signal).catch(
      (error) => console.log("Aborted")
    );
    return response;
  });
}

function handleUpdateTestCase() {
  ipcMain.on(Channel.UPDATE_TEST_CASE, (event, updatedEventList) => {
    testCase.events = updatedEventList;
    console.log(testCase);
  });
}

function handleClickRecord() {
  ipcMain.handle(Channel.CLICK_RECORD, async (event) => {
    toggleRecord();
    return getCurrentMode();
  });
}

function handleClickReplay() {
  ipcMain.handle(Channel.TOGGLE_REPLAY, async (event) => {
    toggleReplay();
    return getCurrentMode();
  });
}
