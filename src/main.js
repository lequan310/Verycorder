const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");
const path = require("node:path");
const { INJECTION_SCRIPT } = require('./injectionScript')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let win;
let view;

function isUrlValid(str) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', // fragment locator
    'i'
  );
  return pattern.test(str);
}

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

  view = new BrowserView();
  win.setBrowserView(view);
  view.webContents.loadURL('https://hsr.hakush.in');

  // Open console on launch, comment out if dont need
  //view.webContents.openDevTools();

  // Inject javascript when navigate to a new web
  view.webContents.on("did-navigate", (event, url) => {
    // Execute JavaScript code in the context of the web page
    view.webContents.executeJavaScript(INJECTION_SCRIPT);
  });

  // Track the web page console and retrieve our events
  view.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      // Click element detected
      if (message.includes("Clicked element:")) {
        // Log the console message to the main process console
        var target = message.replace("Clicked element:", "");
        target = target.replace("At coordinates:", "");
        var result = target.split("|");
        console.log(`Click:${result[0]}Coordinates:${result[1]}\n`);
        return;
      }

      // Window scroll detected
      if (message.includes("Window scrolled:")) {
        // Log the console message to the main process console
        var target = message.replace("Window scrolled:", "");
        console.log(`Window scroll: ${target} `);
        return;
      }

      // Element scroll detected
      if (message.includes("Scrolled element:")) {
        // Log the console message to the main process console
        var target = message.replace("Scrolled element:", "");
        target = target.replace("Scroll amount:", "");
        var result = target.split("|");

        console.log(`Element scroll: ${result[0]} Amount: ${result[1]}\n`);
        return;
      }

      // Hover element detected
      if (message.includes("Hover element:")) {
        // Log the console message to the main process console
        var target = message.replace("Hover element:", "");
        console.log(`Hover element: ${target} `);
        return;
      }
    }
  );

  // Clear cache
  win.webContents.session.clearCache();
  // Maximize app on launch
  win.maximize();
  // Update view bounds for the app
  updateViewBounds();
  // Disable menu bar
  win.setMenu(null);
  // and load the index.html of the app.
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // win.webContents.openDevTools();

  win.on("resize", updateViewBounds);

  win.on("closed", () => {
    win = null;
  });
};

const updateViewBounds = () => {
  if (win) {
    const bounds = win.getContentBounds();
    const view = win.getBrowserView();
    if (view) {
      const { x, y, width, height } = bounds;
      view.setBounds({
        x: Math.floor(width / 2),
        y: 60,
        width: Math.floor(width / 2),
        height: Math.floor(height - 60),
      });
    }
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Handle URL change in React
  ipcMain.on('url-change', (event, arg) => {
    // Check if URL is valid
    if (isUrlValid(arg)) {
      // Load URL
      if (view) {
        view.webContents.loadURL(arg);
        event.returnValue = {
          success: true,
          message: 'Success'
        };

        return;
      }

      // Browser view error
      event.returnValue = {
        success: false,
        message: 'Browser view error'
      };
    } else {
      // Invalid URL
      event.returnValue = {
        success: false,
        message: 'Invalid URL'
      };
    }
  })
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
