import { ipcRenderer } from "electron";
import { Channel } from "./listenerConst";
import { TestCase } from "../Types/testCase";
import { delay } from "./utilities";

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

        await delay(2000);
        ipcRenderer.send(Channel.TEST_LOG, event);
        if (event.target.css && event.target.css !== 'window') {
            // Find the element based on the css selector
            let element = document.querySelector(event.target.css);

            // If element not found, try to find it based on xpath
            if (!element) {
                const xpathResult = document.evaluate(event.target.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                if (xpathResult.singleNodeValue instanceof Element) {
                    element = xpathResult.singleNodeValue;
                }
            }
            if (element) {
                const rect = element.getBoundingClientRect();
                // Log the element's bounding rectangle or use it as needed
                ipcRenderer.send(Channel.TEST_LOG, `Element rect: ${JSON.stringify(rect)}`);
                
                // Depending on the event type, you might want to handle it differently
                // For example, for a click event, you might want to simulate a click based on the element's position
                switch (event.type) {
                    case 'click':
                        await clickEvent(event, rect); 
                        break;
                    case 'input':
                        await inputEvent(event, rect);
                        break;
                    case 'hover':
                        await hoverEvent(event, rect); 
                        break;
                    // Add cases for other event types if needed
                }
            } else {
                // Element not found, handle accordingly
                ipcRenderer.send(Channel.TEST_LOG, `Element not found for selector: ${event.target.css}`);
            }
        } else if (event.target.css == 'window') {
            // If event.target.css is not provided or invalid, and the event is a scroll event
            await scrollEvent(event);
        }

    }
}

async function inputEvent(event: any, rect: DOMRect) {
    const box = rect;
    const inputX = box.x + box.width / 2;
    const inputY = box.y + box.height / 2;
    ipcRenderer.send(Channel.TEST_LOG, `Inputting on ${event.target.css}`);
    ipcRenderer.send(Channel.TEST_LOG, `Inputting at ${inputX}, ${inputY}`);
    ipcRenderer.send(Channel.TEST_LOG, `Inputting value: ${event.value}`);
    ipcRenderer.send(Channel.REPLAY_INPUT, { x: inputX, y: inputY, value: event.value });
}

async function hoverEvent(event: any, rect: DOMRect) {
    const box = rect;
    const hoverX = box.x + box.width / 2;
    const hoverY = box.y + box.height / 2;
    ipcRenderer.send(Channel.TEST_LOG, `Hovering on ${event.target.css}`);
    ipcRenderer.send(Channel.TEST_LOG, `Hovering at ${hoverX}, ${hoverY}`);
    ipcRenderer.send(Channel.REPLAY_HOVER, { x: hoverX, y: hoverY });
}

async function clickEvent(event: any, rect: DOMRect) {
    const box = rect;
    const clickX = box.x + box.width / 2;
    const clickY = box.y + box.height / 2;
    ipcRenderer.send(Channel.TEST_LOG, `Clicking on ${event.target.css}`);
    ipcRenderer.send(Channel.TEST_LOG, `Clicking at ${clickX}, ${clickY}`);
    ipcRenderer.send(Channel.REPLAY_CLICK, { x: clickX, y: clickY });

}

async function scrollEvent(event: any) {
    const scrollY = event.value.y;
    const currentScrollY = window.scrollY;
    const deltaY = scrollY - currentScrollY;

    const scrollX = event.value.x;
    const currentScrollX = window.scrollX;
    const deltaX = scrollX - currentScrollX;

    // Check for vertical scroll
    if (deltaY !== 0) {
        
        ipcRenderer.send(Channel.TEST_LOG, `Scrolling vertically from ${currentScrollY} to ${scrollY}`);
        ipcRenderer.send(Channel.REPLAY_SCROLL, { type: 'vertical', deltaY });
    }
    // Check for horizontal scroll
    if (deltaX !== 0) {

        ipcRenderer.send(Channel.TEST_LOG, `Scrolling horizontally from ${currentScrollX} to ${scrollX}`);
        ipcRenderer.send(Channel.REPLAY_SCROLL, { type: 'horizontal', deltaX });
    }
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
