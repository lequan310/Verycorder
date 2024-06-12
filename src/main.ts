import { app, BrowserWindow, BrowserView, globalShortcut } from 'electron';
import { handleRecordEvents, updateViewBounds, toggleRecord, toggleReplay, handleViewEvents, handleUIEvents, testLogEvents, clicker, scroller } from './Others/electron_utilities';
import { BLANK_PAGE, Channel } from './Others/listenerConst';

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const BROWSER_VIEW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let win: BrowserWindow;
let view: BrowserView;

// Function to create the web view to load webs
function createBrowserView() {
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

const createWindow = (): void => {
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
  updateViewBounds(win);
  // Disable menu bar
  win.setMenu(null);
  // and load the index.html of the app.
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  //win.webContents.openDevTools({ mode: "detach" });

  // Handle resize app
  win.on("resize", () => updateViewBounds(win));
  // Handle window close
  win.on("closed", () => { win = null; });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // May consider removing this feature in production
  globalShortcut.register("CommandOrControl+Shift+J", () => {
    view.webContents.toggleDevTools();
  });

  // Remove this after Phy finish his recording button :skull:
  globalShortcut.register("CommandOrControl+R", () => {
    toggleRecord(win);
  });

  // Remember to add UI for playback later
  globalShortcut.register("CommandOrControl+P", () => {

    toggleReplay(win);
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Handle IPC events for UI (React)
  handleUIEvents(win);
  // Handle view events
  handleViewEvents();
  // Handle record events
  handleRecordEvents(win, ["click-event", "scroll-event", "hover-event", "input-event"]);


  //Functions test for replaying
  testLogEvents();
  clicker();
  scroller();

  // Cai nay de test, chu scroll vs hover no detect nhieu qua
  //handleRecordEvents(win, ["click-event", "input-event"]);
  //handleRecordEvents(win, ["scroll-event", "hover-event"]);
});

app.on("will-quit", () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
