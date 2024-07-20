import { app, BrowserWindow, globalShortcut } from "electron";
import {
  handleRecordEvents,
  toggleRecord,
  handleViewEvents,
  handleUIEvents,
  getView,
  getWin,
  createWindow,
  toggleReplay,
  getCurrentMode,
} from "./Others/electron_utilities";
import { handleReplayEvents } from "./Main/replay_functions";
import { Channel } from "./Others/listenerConst";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  const win = getWin();
  const view = getView();

  // May consider removing this feature in production
  globalShortcut.register("CommandOrControl+Shift+J", () => {
    view.webContents.toggleDevTools();
  });

  // Remove this after Phy finish his recording button :skull:
  globalShortcut.register("CommandOrControl+R", () => {
    toggleRecord();
  });

  // Remember to add UI for playback later
  globalShortcut.register("CommandOrControl+P", () => {
    toggleReplay();
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
