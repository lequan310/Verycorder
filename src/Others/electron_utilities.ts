import { BrowserView, BrowserWindow, ipcMain } from "electron";
import { handleUrl } from './utilities';

let recording: boolean = false;
let replaying: boolean = false;

function getCurrentMode() {
    return recording ? "record" : replaying ? "replay" : "normal";
}

export function toggleRecord(): boolean {
    recording = !recording;
    return recording;
}

export function toggleReplay(): boolean {
    replaying = !replaying;
    return replaying;
}

// Load new URL on browser when user enter new URL via search bar
export function changeViewUrl(url: string, view: BrowserView) {
    if (url) {
        // Assume this function checks if the URL is properly formatted
        if (view) {
            return view.webContents
                .loadURL(url)
                .then(() => {
                    // If loadURL succeeds
                    return {
                        success: true,
                        message: "Success",
                    };
                })
                .catch((error) => {
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

export function handleUIEvents(win: BrowserWindow) {
    const view = win.getBrowserView();
    // Handle URL change in React
    ipcMain.handle("url-change", async (event, url) => {
        url = handleUrl(url); // Assume this function properly formats the URL
        return changeViewUrl(url, view);
    });
}

export function handleRecordEvents() {
    // Click event detected
    ipcMain.on("click-event", (event, data) => {
        console.log(data);
        // Create object and pass to React (CODE BELOW PLEASE)
    });

    // Scroll event detected
    ipcMain.on("scroll-event", (event, data) => {
        console.log(data);
        // Create object and pass to React (CODE BELOW PLEASE)
    });

    // Hover event detected
    ipcMain.on("hover-event", (event, data) => {
        console.log(data);
        // Create object and pass to React (CODE BELOW PLEASE)
    });

    // Input event detected
    ipcMain.on("input-event", (event, data) => {
        console.log(data);
        // Create object and pass to React (CODE BELOW PLEASE)
    });
}

export function handleViewEvents() {
    ipcMain.handle("get-mode", async () => {
        return getCurrentMode();
    });
}

// CAN TAO FUNCTION DE TAO OBJECT ROI PASS DATA VAO REACT CHO MOI CAI
// IPCMAIN.ON O TREN THI TAO O DUOI NAY NHE :)

// function printClickedElement(message: string) {
//     let target = message.replace("Clicked element:", "");
//     target = target.replace("At coordinates:", "");
//     let result = target.split("|");

//     console.log(`Click:${result[0]}Coordinates:${result[1]}\n`);
// }

// function printWindowScroll(message: string) {
//     let target = message.replace("Window scrolled:", "");

//     console.log(`Window scroll:${target}`);
// }

// function printScrolledElement(message: string) {
//     let target = message.replace("Scrolled element:", "");
//     target = target.replace("Scroll amount:", "");
//     let result = target.split("|");

//     console.log(`Element scroll:${result[0]} Amount:${result[1]}\n`);
// }

// function printHoverElement(message: string) {
//     let target = message.replace("Hover element:", "");

//     console.log(`Hover element:${target}\n`);
// }

// function printInputElement(message: string) {
//     let target = message.replace("Input element:", "");
//     target = target.replace("Value:", "");
//     let result = target.split("|");

//     console.log(`Input:${result[0]}Value:${result[1]}\n`);
// }