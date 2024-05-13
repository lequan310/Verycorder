// Load new URL on browser when user enter new URL via search bar
function changeViewUrl(event, url, view) {
  if (url) {
    // Assume this function checks if the URL is properly formatted
    if (view) {
      return view.webContents.loadURL(url)
        .then(() => {
          // If loadURL succeeds
          return {
            success: true,
            message: "Success",
          };
        }).catch((error) => {
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
function updateViewBounds(win) {
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
}

function handleMessage(message) {
  if (message.includes("Clicked element:")) {
    printClickedElement(message);
    return;
  }

  // Window scroll detected
  if (message.includes("Window scrolled:")) {
    printWindowScroll(message);
    return;
  }

  // Element scroll detected
  if (message.includes("Scrolled element:")) {
    printScrolledElement(message);
    return;
  }

  // Hover element detected
  if (message.includes("Hover element:")) {
    printHoverElement(message);
    return;
  }

  // Input element detected
  if (message.includes("Input element:")) {
    printInputElement(message);
    return;
  }
}

function printClickedElement(message) {
  var target = message.replace("Clicked element:", "");
  target = target.replace("At coordinates:", "");
  var result = target.split("|");

  console.log(`Click:${result[0]}Coordinates:${result[1]}\n`);
}

function printWindowScroll(message) {
  var target = message.replace("Window scrolled:", "");

  console.log(`Window scroll:${target}`);
}

function printScrolledElement(message) {
  var target = message.replace("Scrolled element:", "");
  target = target.replace("Scroll amount:", "");
  var result = target.split("|");

  console.log(`Element scroll:${result[0]} Amount:${result[1]}\n`);
}

function printHoverElement(message) {
  var target = message.replace("Hover element:", "");

  console.log(`Hover element:${target}\n`);
}

function printInputElement(message) {
  var target = message.replace("Input element:", "");
  target = target.replace("Value:", "");
  var result = target.split("|");

  console.log(`Input:${result[0]}Value:${result[1]}\n`);
}

module.exports = {
  changeViewUrl,
  handleMessage,
  updateViewBounds,
};
