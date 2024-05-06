const { app, BrowserWindow, BrowserView } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false
    },
  });

  const view = new BrowserView();
  win.setBrowserView(view);
  view.setBounds({ x: 500, y: 0, width: 960, height: 1080 });
  view.webContents.loadURL("https://youtube.com");

  // Open console on launch, comment out if dont need
  view.webContents.openDevTools()

  // Inject javascript for event listeners
  view.webContents.on("dom-ready", () => {
    console.log("Finish loading the web.");

    // Execute JavaScript code in the context of the web page
    view.webContents.executeJavaScript(`
      //------------------------------CLICK EVENTS-------------------------------
      document.addEventListener('click', (event) => {
        // Log the clicked element to the console
        console.log('Clicked element:', event.target);
      });

      //------------------------------SCROLL EVENTS-------------------------------
      let scrollTimer;

      // Window (whole web) scroll events
      window.addEventListener('scroll', function(event) {
        // Clear any existing timeout
        clearTimeout(scrollTimer);

        // Set a timeout to detect scroll end
        scrollTimer = setTimeout(function() {
          console.log('Window scrolled:', window.scrollX, window.scrollY);
        }, 250); // Adjust the delay as needed
      });

      // Select all elements on the page
      const allElements = document.querySelectorAll('*');

      // Smaller element scroll events (navbar, div, etc.)
      allElements.forEach(function(element) {
        element.addEventListener('scroll', function() {
          // Clear any existing timeout
          clearTimeout(scrollTimer);

          // Set a timeout to detect scroll end
          scrollTimer = setTimeout(function() {
            const scrollVerticalPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
            const scrollHorizontalPercentage = (element.scrollLeft / (element.scrollWidth - element.clientWidth)) * 100;
            console.log('Scrolled element:', element, ' | Scroll amount:', scrollHorizontalPercentage, ' ', scrollVerticalPercentage);
          }, 250); // Adjust the delay as needed
          });
      });
    `);
  });

  // Track the web page console and retrieve our custom output
  view.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      if (message.includes("Clicked element:")) {
        // Log the console message to the main process console
        var target = message.replace("Clicked element:", "");
        console.log(`Click: ${target} \n`);
      }

      if (message.includes("Window scrolled:")) {
        // Log the console message to the main process console
        var target = message.replace("Window scrolled:", "");
        console.log(`Window scroll: ${target} `);
      }

      if (message.includes("Scrolled element:")) {
        // Log the console message to the main process console
        var target = message.replace("Scrolled element:", "");
        target = target.replace("Scroll amount:", "");
        var result = target.split("|");

        console.log(`Element scroll: ${result[0]} Amount: ${result[1]}\n`);
      }
    }
  );


  // and load the index.html of the app.
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  win.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
