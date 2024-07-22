import {
  BrowserView,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  webContents,
} from "electron";
import { handleUrl } from "./utilities";
import { TestCase } from "../Types/testCase";
import { ChangeUrlResult } from "../Types/urlResult";
import { BLANK_PAGE, Channel } from "./listenerConst";
import { AppMode } from "../Types/appMode";
import { RecordedEvent } from "../Types/recordedEvent";
import {
  handleClickRecord,
  handleClickReplay,
  handleNavigate,
  handleNavigateInPage,
  handleUpdateTestCase,
  updateTestSteps,
  ipcGetMode,
  testLogEvents,
  handleTestCaseEnded,
} from "./ipcFunctions";

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const BROWSER_VIEW_PRELOAD_WEBPACK_ENTRY: string;

let currentMode = AppMode.disabled;
let testCase: TestCase;
let abortController: AbortController;
let leftPosition = 350;

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
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#fafafc",
      symbolColor: "#28282B",
    },
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
  win.webContents.openDevTools({ mode: "detach" });

  // Handle resize app
  win.on("resize", () => updateViewBounds());
  // Handle window close
  win.on("closed", () => {
    win = null;
  });
};

export function getCurrentMode() {
  return currentMode;
}

export function setMode(mode: AppMode) {
  currentMode = mode;
}

// Toggle record/replay mode vs normal mode
function toggleMode(mode: AppMode) {
  if (mode === AppMode.record) {
    currentMode =
      currentMode === AppMode.record ? AppMode.normal : AppMode.record;
  } else if (mode === AppMode.replay) {
    currentMode =
      currentMode === AppMode.replay ? AppMode.normal : AppMode.replay;
  }
}

export function updateTestEventList(eventList: RecordedEvent[]) {
  testCase.events = eventList;
}

// Export for Ctrl + R to toggle record
export function toggleRecord() {
  if (currentMode === AppMode.replay || currentMode === AppMode.disabled)
    return;

  if (
    view.webContents.getURL() === "" ||
    view.webContents.getURL() === BLANK_PAGE
  )
    return;

  toggleMode(AppMode.record);
  view.webContents.send(Channel.TOGGLE_RECORD, currentMode); // Send message to attach event listeners
  win.webContents.send(Channel.UPDATE_STATE, currentMode); // Send message to change UI (disable search bar)
  console.log("Current mode: ", currentMode);

  if (currentMode === AppMode.record) {
    const { x, y, width, height } = view.getBounds();
    testCase = {
      url: view.webContents.getURL(),
      events: [],
      size: { width, height },
    };
  }
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
    currentMode = AppMode.disabled;
    win.webContents.send(Channel.UPDATE_STATE, currentMode);
    return Promise.resolve({ success: false, message: "Invalid URL" });
  }

  if (!view) {
    // If there is no browser view available
    view.webContents.loadURL(BLANK_PAGE);
    currentMode = AppMode.disabled;
    win.webContents.send(Channel.UPDATE_STATE, currentMode);
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
          win.webContents.send(Channel.UPDATE_STATE, currentMode); // Send message to change UI (disable search bar)
        }
      })
      .catch((error) => {
        signal.removeEventListener("abort", handleAbort);
        resolve({ success: false, message: "Cannot connect to URL" });
        currentMode = AppMode.disabled;
        win.webContents.send(Channel.UPDATE_STATE, currentMode); // Send message to change UI (disable search bar)
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

// Update size and location of browser view
export function updateViewBounds() {
  if (win) {
    const bounds = win.getContentBounds();
    if (view) {
      const { x, y, width, height } = bounds;
      view.setBounds({
        x: leftPosition - 27,
        y: 40,
        width: Math.floor(width - leftPosition + 28),
        height: Math.floor(height - 40),
      });
    }
  }
}

async function goToUrlReplay() {
  if (
    getCurrentMode() === AppMode.replay &&
    testCase &&
    testCase.events &&
    testCase.events.length > 0
  ) {
    await changeUrlFinal(testCase.url);
  }
}

export async function toggleReplay() {
  if (currentMode === AppMode.record || currentMode === AppMode.disabled)
    return;

  if (
    view.webContents.getURL() === "" ||
    view.webContents.getURL() === BLANK_PAGE
  )
    return;

  // Return if there are no test steps or no test cases, since cannot replay
  toggleMode(AppMode.replay);
  win.webContents.send(Channel.UPDATE_STATE, currentMode); // Send message to change UI (disable search bar)
  console.log("Current mode: ", currentMode);

  await goToUrlReplay();

  // If replay meets condition
  if (
    currentMode === AppMode.replay &&
    testCase &&
    testCase.events &&
    testCase.events.length > 0
  ) {
    // Send test case to process for replay.
    view.webContents.send(Channel.SEND_EVENT, testCase);
    console.log("Test case sent");
  } else if (currentMode === AppMode.replay) {
    // If test case is empty or not available
    currentMode = AppMode.normal;
    console.log("There are no test cases.");
  }
  win.webContents.send(Channel.UPDATE_STATE, currentMode); // Send message to change UI (disable search bar)
  view.webContents.send(Channel.TOGGLE_REPLAY, currentMode);
}

// ------------------- HANDLING GROUP FUNCTIONS -------------------
// Handle UI events from React to Electron
export function handleUIEvents() {
  handleUrlChange();
  handleUpdateTestCase();
  handleClickRecord();
  handleClickReplay();
  updateTestSteps(win);
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
  handleTestCaseEnded(win);
  handleNavigateInPage(view);
  handleNavigate(view);
}

// ------------------- IPC EVENT FUNCTIONS -------------------
function handleEndResize() {
  //on ipcMain, hide browserview
  ipcMain.on(Channel.END_RESIZE, (event, leftX) => {
    // console.log(leftPosition);
    if (win) {
      const bounds = win.getContentBounds();
      const view = win.getBrowserView();
      leftPosition = leftX + 72;
      if (view) {
        const { x, y, width, height } = bounds;
        view.setBounds({
          x: leftPosition,
          y: 40,
          width: Math.floor(width - leftPosition),
          height: Math.floor(height - 40),
        });
      }
    }
    // console.log("On Start Resize");
  });
}

function handleUrlChange() {
  ipcMain.handle(Channel.URL_CHANGE, async (event, url) => {
    // Abort controller stuff
    url = handleUrl(url); // Assume this function properly formats the URL
    const response = await changeUrlFinal(url);
    return response;
  });
}
