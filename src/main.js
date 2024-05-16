const {
  app,
  BrowserWindow,
  BrowserView,
  ipcMain,
  globalShortcut,
} = require("electron");
const path = require("node:path");
const { RECORD_SCRIPT } = require("./Others/injectionScript");
const utilities = require("./Others/utilities");
const electron_utilities = require("./Others/electron_utilities");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let win;
let view;

// Function to create the web view to load webs
function createBrowserView() {
  view = new BrowserView();

  view.webContents.loadURL("about:blank"); // Inject javascript when navigate to a new web

  view.webContents.on("did-navigate", async (event, url) => {
    // Execute JavaScript code in isolated world to ensure no conflict with web code
    view.webContents.executeJavaScriptInIsolatedWorld(1, [{ code: RECORD_SCRIPT }])
    .then(() => console.log(`Open link: ${url}\n`))
    .catch((error) => console.log(error));
    win.webContents.send("update-url", url); // Update URL in search bar
  });

  view.webContents.on("did-navigate-in-page", async (event, url) => {
    win.webContents.send("update-url", url); // Update URL in search bar
  });

  // Track the web page console and retrieve our events
  view.webContents.on(
    "console-message",
    async (event, level, message, line, sourceId) => {
      electron_utilities.handleMessage(message); // Register events (soon)
    }
  );
}

// Function to create the desktop app and load UI, etc.
const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
    },
  });

  createBrowserView();
  win.setBrowserView(view);

  // Clear cache
  view.webContents.session.clearCache();
  // Maximize app on launch
  win.maximize();
  // Update view bounds for the app
  electron_utilities.updateViewBounds(win);
  // Disable menu bar
  win.setMenu(null);
  // and load the index.html of the app.
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // win.webContents.openDevTools();

  // Handle resize app
  win.on("resize", () => electron_utilities.updateViewBounds(win));
  // Handle window close
  win.on("closed", () => (win = null));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("CommandOrControl+Shift+J", () => {
    view.webContents.toggleDevTools();
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Handle URL change in React
  ipcMain.handle("url-change", async (event, url) => {
    url = utilities.handleUrl(url); // Assume this function properly formats the URL
    return electron_utilities.changeViewUrl(event, url, view);
  });
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
