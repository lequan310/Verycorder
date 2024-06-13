import { ipcRenderer } from "electron";
import { Channel } from "./listenerConst";
import { TestCase } from "../Types/testCase";

let testCase: TestCase;
let cssSelector: string;
let isReplaying = true; // Flag to control the replay

// Function to get the test case from main process
export function getTestCase(newTestCase: TestCase) {
    testCase = newTestCase;
}

// Modified replayManager to be async and controlled by isReplaying flag
async function replayManager() {
    ipcRenderer.send(Channel.TEST_LOG, 'Replay manager started');
    for (const event of testCase.events) {
        if (!isReplaying) return; // Stop if isReplaying is false

        // Await a 1 second delay before processing the next event
        await new Promise(resolve => setTimeout(resolve, 1000));
        ipcRenderer.send(Channel.TEST_LOG, event);
        switch (event.type) {
            case 'click':
                //await clickEvent(event);
                break;
            case 'input':
                //await inputEvent(event);
                break;
            case 'hover':
                //await hoverEvent(event);
                break;
            case 'scroll':
                await scrollEvent(event);
                break;
        }
    }
}

async function clickEvent(event: any) {
    cssSelector = event.target.css;
    ipcRenderer.send(Channel.TEST_LOG, `Clicking on ${cssSelector}`);
    ipcRenderer.send(Channel.REPLAY_CLICK, cssSelector);
    /*
    let element = document.querySelector(cssSelector);
    if (element) {
        ipcRenderer.send(Channel.TEST_LOG, 'Element found');
        if (element instanceof HTMLElement) { // Type assertion
            element.click(); // Now TypeScript knows `click` exists
            ipcRenderer.send(Channel.TEST_LOG, 'Clicked on element');
        } else {
            ipcRenderer.send(Channel.TEST_LOG, 'Element is not clickable');
        }
    } else {
        ipcRenderer.send(Channel.TEST_LOG, 'Element not found');
    }
    */
}

async function scrollEvent(event: any) {
    const scrollY = event.value.y;
    const currentScrollY = window.scrollY;

    ipcRenderer.send(Channel.TEST_LOG, `Scrolling from ${currentScrollY} to ${scrollY}`);
    ipcRenderer.send(Channel.REPLAY_SCROLL, {scrollY, currentScrollY});
}

// Modified replay function to start replayManager asynchronously
export async function replay() {
    ipcRenderer.send(Channel.TEST_LOG, 'Replay started');
    await replayManager();
}

// Function to stop replaying
export function stopReplaying() {
    isReplaying = false;
    ipcRenderer.send(Channel.TEST_LOG, 'Replay stopped');
}
