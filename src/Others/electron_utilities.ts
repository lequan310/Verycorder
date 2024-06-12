import { BrowserView, BrowserWindow, ipcMain } from "electron";
import { delay, handleUrl } from "./utilities";
import { TestCase } from "../Types/testCase";
import { ChangeUrlResult } from "../Types/urlResult";
import { BLANK_PAGE, Channel } from "./listenerConst";

let recording = false;
let replaying = false;
let testCase: TestCase;
let abortController: AbortController;

// For development of replay feature
let replayWindow: BrowserWindow;
let replayView: BrowserView;

function getCurrentMode() {
  return recording ? "record" : replaying ? "replay" : "normal";
}

export function toggleRecord(win: BrowserWindow) {
  if (replaying) return;
  const view = win.getBrowserView();
  if (view.webContents.getURL() === "" || view.webContents.getURL() === BLANK_PAGE) return;

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
  console.log(`Recording: ${recording}`);
}

export function toggleReplay(win: BrowserWindow) {
  if (recording) return;
  const view = win.getBrowserView();
  if (view.webContents.getURL() === "" || view.webContents.getURL() === BLANK_PAGE) return;

  replaying = !replaying;

  
  if (testCase && testCase.events && testCase.events.length > 0) {
    replayWindow = win;
    replayView = view;

    view.webContents.send(Channel.SEND_EVENT, testCase); // Send test case to process for replay.
    view.webContents.loadURL(testCase.url); // Load the URL to replay 
    view.webContents.send(Channel.TOGGLE_REPLAY, replaying); // Send message to toggle playback
    
    
    
    console.log('replaying : ', replaying);

    

  }
  else {
    //view.webContents.send(Channel.TOGGLE_REPLAY, replaying); // Send message to toggle playback
    console.log('There are no test cases.')
  }
}

// Handle URL change via search bar with abort controller
function changeUrlWithAbort(url: string, view: BrowserView, signal: AbortSignal): Promise<ChangeUrlResult> {
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
      reject(new Error('Aborted'));
      return;
    }

    const handleAbort = () => {
      reject(new Error('Aborted'));
    };

    signal.addEventListener('abort', handleAbort);

    view.webContents.loadURL(url)
      .then(() => {
        signal.removeEventListener('abort', handleAbort);
        resolve({ success: true, message: "Success" });
      })
      .catch((error) => {
        signal.removeEventListener('abort', handleAbort);
        resolve({ success: false, message: "Cannot connect to URL" });
      });
  });
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

// Handle UI events from React to Electron
export function handleUIEvents(win: BrowserWindow) {
  const view = win.getBrowserView();

  // Handle URL change in React
  ipcMain.handle(Channel.URL_CHANGE, async (event, url) => {
    // Abort controller stuff
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    url = handleUrl(url); // Assume this function properly formats the URL
    const response = await changeUrlWithAbort(url, view, signal).catch((error) => console.log("Aborted"));
    return response;
  });

  ipcMain.on(Channel.UPDATE_TEST_CASE, (event, updatedEventList) => {
    testCase.events = updatedEventList;
    console.log(testCase);
  });

  ipcMain.on(Channel.CLICK_RECORD, (event) => {
    toggleRecord(win);
  });
}

// Function to register events (click, input, etc.) into left panel
export function handleRecordEvents(win: BrowserWindow, eventNames: string[]) {
  for (const eventName of eventNames) {
    ipcMain.on(eventName, (event, data) => {
      //testCase.events.push(data);
      win.webContents.send(Channel.ADD_EVENT, data);
      //console.log(data);
    });
  }
}

export function handleViewEvents() {
  ipcMain.handle(Channel.GET_MODE, async (event) => {
    return getCurrentMode();
  });
}

export function testLogEvents() {
  ipcMain.on(Channel.TEST_LOG, (event, data) => {
    console.log(data);
  });
}

export function clicker() {
  ipcMain.on(Channel.REPLAY_CLICK, async (event, data) => {
    console.log('Clicker function called');

    // Preserve original CSS selector by adding a backslash next to each existing backslash
    if (typeof data === 'string') {
      data = data.replace(/\\/g, '\\\\');
    }
    console.log('Modified selector:', data);

    // Use executeJavaScript to select the element and log it
    replayView.webContents.executeJavaScript(`
      const element = document.querySelector("${data}");
      if (element) {
        console.log('Selected element:', element);
        element; // Return the element for logging in Electron's console
      } else {
        console.log('Element not found');
        null; // Indicate no element was found
      }
    `).then(element => {
      if (element) {
        console.log('Element found and logged in the page context:', data);
      } else {
        console.log('Element not found with selector:', data);
      }
    }).catch(error => {
      console.error('Error executing script:', error);
    });


    /*
    replayView.webContents.sendInputEvent({
      type: 'mouseDown',
      x: data.x,
      y: data.y,
      button: 'left',
      clickCount: 1
    });
    replayView.webContents.sendInputEvent({
      type: 'mouseUp',
      x: data.x,
      y: data.y,
      button: 'left',
      clickCount: 1
    });
    console.log('Clicked at ', data.x, data.y);
    */
  });
}


// Replay feature functions
export function scroller() {
  
  ipcMain.on(Channel.REPLAY_SCROLL, async (event, data) => {
    console.log('Scroller function called');

    // Execute JavaScript in the webContents to get the current scroll position
    const currentScrollY = await replayWindow.webContents.executeJavaScript('window.scrollY');

    // Calculate the deltaY as the difference between the target position and the current position
    const deltaY = (data - currentScrollY)*-1;

    // Send the mouseWheel event with the calculated deltaY to scroll
    replayView.webContents.sendInputEvent({
      type: 'mouseWheel',
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: deltaY, // Use the calculated deltaY
      canScroll: true
    });

    console.log('Scrolled to ', data);
  });
}