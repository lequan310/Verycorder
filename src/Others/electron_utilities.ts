import { BrowserView, BrowserWindow, ipcMain } from "electron";
import { handleUrl } from "./utilities";
import { TestCase } from "../Types/testCase";

let recording = false;
let replaying = false;
let testCase: TestCase;

function getCurrentMode() {
  return recording ? "record" : replaying ? "replay" : "normal";
}

export function toggleRecord(win: BrowserWindow) {
  const view = win.getBrowserView();
  if (
    view.webContents.getURL() === "" ||
    view.webContents.getURL() === "about:blank"
  ) {
    return;
  }
  recording = !recording;

  if (recording) {
    const { x, y, width, height } = view.getBounds();
    testCase = {
      url: view.webContents.getURL(),
      events: [],
      size: { width, height },
    };
  }

  view.webContents.send("toggle-record", recording); // Send message to attach event listeners
  win.webContents.send("toggle-record", recording); // Send message to change UI (disable search bar)
  console.log(`Recording: ${recording}`);
}

export function toggleReplay(): boolean {
  replaying = !replaying;
  return replaying;
}

// Load new URL on browser when user enter new URL via search bar
export function changeViewUrl(url: string, view: BrowserView) {
  if (url) {
    // Assume this function checks if the URL is properly formatted
    if (view) {
      return view.webContents
        .loadURL(url)
        .then(() => {
          // If loadURL succeeds
          return {
            success: true,
            message: "Success",
          };
        })
        .catch((error) => {
          // If loadURL fails
          view.webContents.loadURL("about:blank");
          return {
            success: false,
            message: "Cannot connect to URL",
          };
        });
    } else {
      // If there is no browser view available
      return {
        success: false,
        message: "Browser view error",
      };
    }
  } else {
    // If the URL is invalid
    console.log("failed");
    view.webContents.loadURL("about:blank");
    return {
      success: false,
      message: "Invalid URL",
    };
  }
}

// Update size and location of browser view
export function updateViewBounds(win: BrowserWindow) {
  if (win) {
    const bounds = win.getContentBounds();
    const view = win.getBrowserView();
    if (view) {
      const { x, y, width, height } = bounds;
      view.setBounds({
        x: Math.floor(width / 2),
        y: 70,
        width: Math.floor(width / 2 - 12),
        height: Math.floor(height - 70 - 12),
      });
    }
  }
}

export function handleUIEvents(win: BrowserWindow) {
  const view = win.getBrowserView();

  // Handle URL change in React
  ipcMain.handle("url-change", async (event, url) => {
    url = handleUrl(url); // Assume this function properly formats the URL
    return changeViewUrl(url, view);
  });

  ipcMain.on("update-test-case", (event, updatedEventList) => {
    testCase.events = updatedEventList;
    console.log(testCase);
  });

  ipcMain.on("toggle-record-click", (event, updatedEventList) => {
    toggleRecord(win);
  });
}

export function handleRecordEvents(win: BrowserWindow, eventNames: string[]) {
  for (const eventName of eventNames) {
    ipcMain.on(eventName, (event, data) => {
      //testCase.events.push(data);
      win.webContents.send("add-event", data);
      console.log(data);
    });
  }
}

export function handleViewEvents() {
  ipcMain.handle("get-mode", async () => {
    return getCurrentMode();
  });
}