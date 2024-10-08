import { app, BrowserWindow, globalShortcut, Menu, MenuItem } from "electron";
import {
  handleRecordEvents,
  handleRecordCanvas,
  handleViewEvents,
  handleUIEvents,
  getWin,
  createWindow,
  toggleRecord,
  toggleReplay,
  saveTestCase,
  loadTestCase,
} from "./Others/electronUtilities";
import { handleReplayEvents } from "./Main/replay_functions";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Set menu for local shortcuts
const menu = new Menu();
menu.append(
  new MenuItem({
    label: "Electron",
  })
);
menu.append(
  new MenuItem({
    label: "Action",
    submenu: [
      {
        label: "Record",
        accelerator: "CommandOrControl+R",
        click: toggleRecord,
      },
      {
        label: "Replay",
        accelerator: "CommandOrControl+P",
        click: toggleReplay,
      },
      {
        label: "Save",
        accelerator: "CommandOrControl+S",
        click: saveTestCase,
      },
      {
        label: "Load",
        accelerator: "CommandOrControl+L",
        click: loadTestCase,
      },
    ],
  })
);
menu.append(
  new MenuItem({
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" },
    ],
  })
);
Menu.setApplicationMenu(menu);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  const win = getWin();

  win.once("ready-to-show", () => {
    win.show();
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Handle IPC events for UI (React)
  handleUIEvents();
  // Handle view events
  handleViewEvents();
  // Handle record events
  handleRecordEvents([
    "click-event",
    "scroll-event",
    "hover-event",
    "input-event",
  ]);
  handleRecordCanvas();
  handleReplayEvents();
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
