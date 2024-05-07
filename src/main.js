const { app, BrowserWindow, BrowserView } = require("electron");
const path = require("node:path");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let win;
let click;

const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
    },
  });

  const view = new BrowserView();
  win.setBrowserView(view);
  updateViewBounds();
  // view.setBounds({ x: 960, y: 0, width: 960, height: 1080 });
  view.webContents.loadURL("https://www.youtube.com");

  // Open console on launch, comment out if dont need
  view.webContents.openDevTools();

  // Inject javascript for event listeners
  view.webContents.on("dom-ready", () => {
    console.log("Finish loading the web.");

    // Execute JavaScript code in the context of the web page
    view.webContents.executeJavaScript(`
      let target;
      let click = false;
      let clickTimer;
      let scrollTimer;

      // Select all elements on the page
      const allElements = document.querySelectorAll('*');

      //-------------------------------OBSERVERS---------------------------------

      // Observer to detect changes in element's attributes, child, and subtree
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (click) {
            console.log('Clicked element:', target);
            click = false;
          }
        });
      });
      const config = { attributes: true, childList: true, subtree: true };

      // Observer to detect changes in size of element
      const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {

        });
      });

      mutationObserver.observe(document, config);
      // allElements.forEach(element => {
      //   resizeObserver.observe(element);
      // });

      //------------------------------CLICK EVENTS-------------------------------

      function registerClick(event) {
        click = true;
        target = event.target;
        clickTimer = setTimeout(function() {
          click = false;
        }, 100);
      }

      document.addEventListener('click', (event) => {
        // Log the clicked element to the console
        //var parentElement = event.target.parentElement;

        // console.log('Clicked element:', event.target);
        registerClick(event);
      }, true);

      //------------------------------SCROLL EVENTS-------------------------------

      // Window (whole web) scroll events
      window.addEventListener('scroll', function(event) {
        // Clear any existing timeout
        clearTimeout(scrollTimer);

        // Set a timeout to detect scroll end
        scrollTimer = setTimeout(function() {
          console.log('Window scrolled:', window.scrollX, window.scrollY);
        }, 250); // Adjust the delay as needed
      });

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

      //------------------------------INPUT EVENTS-------------------------------

      

      //------------------------------HOVER EVENTS-------------------------------


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
        y: 0,
        width: Math.floor(width / 2),
        height: Math.floor(height),
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
