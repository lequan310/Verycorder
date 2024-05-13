const { app, BrowserWindow, BrowserView, ipcMain, globalShortcut } = require("electron");
const path = require("node:path");
const { INJECTION_SCRIPT } = require('./injectionScript')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let win;
let view;

function isUrlValid(url) {
  return URL.canParse(url);
}

function handleUrlWithoutProtocol(url) {
  const isUrl = URL.canParse(url);
  if(!isUrl) {
    const urlWithoutHttp = new RegExp('^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9@:%._\+~#?&//=]*)?$', 'i');
    const isRawUrl = urlWithoutHttp.test(url);
    
    if(isRawUrl) {
      url = `http://` + url;
    }
  }
  return url;
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
  // view.webContents.loadURL('https://hsr.hakush.in');

  // Open console on launch, comment out if dont need
  view.webContents.openDevTools();

  // Inject javascript when navigate to a new web
  view.webContents.on("did-navigate", (event, url) => {
    // Execute JavaScript code in the context of the web page
    view.webContents.executeJavaScript(INJECTION_SCRIPT);
    win.webContents.send('update-url', url);
  });

  view.webContents.on("did-navigate-in-page", (event, url) => {
    win.webContents.send('update-url', url);
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
        console.log(`Window scroll:${target}`);
        return;
      }

      // Element scroll detected
      if (message.includes("Scrolled element:")) {
        // Log the console message to the main process console
        var target = message.replace("Scrolled element:", "");
        target = target.replace("Scroll amount:", "");
        var result = target.split("|");

        console.log(`Element scroll:${result[0]} Amount:${result[1]}\n`);
        return;
      }

      // Hover element detected
      if (message.includes("Hover element:")) {
        // Log the console message to the main process console
        var target = message.replace("Hover element:", "");
        console.log(`Hover element:${target}\n`);
        return;
      }

      // Input element detected
      if (message.includes("Input element:")) {
        // Log the console message to the main process console
        var target = message.replace("Input element:", "");
        target = target.replace("Value:", "");
        var result = target.split("|");
        console.log(`Input:${result[0]}Value:${result[1]}\n`);
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

  globalShortcut.register('CommandOrControl+Shift+J', () => {
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
  ipcMain.on('url-change', (event, url) => {
    url = handleUrlWithoutProtocol(url); // Assume this function properly formats the URL
    if (isUrlValid(url)) { // Assume this function checks if the URL is properly formatted
      if (view) {
        view.webContents.loadURL(url).then(() => {
          // If loadURL succeeds
          event.returnValue = {
            success: true,
            message: 'Success'
          };
        }).catch(error => {
          // If loadURL fails
          console.error(error);
          event.returnValue = {
            success: false,
            message: 'Cannot connect to URL'
          };
        });
      } else {
        // If there is no browser view available
        event.returnValue = {
          success: false,
          message: 'Browser view error'
        };
      }
    } else {
      // If the URL is invalid
      event.returnValue = {
        success: false,
        message: 'Invalid URL'
      };
    }
  });
});

app.on('will-quit', () => {
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