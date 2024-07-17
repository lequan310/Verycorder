import { ipcRenderer } from "electron";
import { Channel } from "../Others/listenerConst";
import { TestCase } from "../Types/testCase";
import { delay } from "../Others/utilities";
import { RecordedEvent } from "../Types/recordedEvent";

let testCase: TestCase;
let isReplaying = true; // Flag to control the replay

// Function to get the test case from main process
export function getTestCase(newTestCase: TestCase) {
    testCase = newTestCase;
}

// Modified replayManager to be async and controlled by isReplaying flag
async function replayManager() {
    //ipcRenderer.send(Channel.TEST_LOG, 'Replay manager started');
    for (const event of testCase.events) {
        if (!isReplaying) return; // Stop if isReplaying is false

        await delay(1500);

        //if (!isReplaying) return; // Stop if isReplaying is false
        //ipcRenderer.send(Channel.TEST_LOG, event);
        if (event.target.css && event.target.css !== 'window') {
            let element: Element | null = null;
            try {
                // Attempt to find the element based on the CSS selector
                element = document.querySelector(event.target.css);
                if (!element) throw new Error(`Element not found for selector: ${event.target.css}`);
            } catch (error) {
                // If element not found by CSS, attempt to find it based on XPath
                ipcRenderer.send(Channel.TEST_LOG, error.message);
                try {
                    const xpathResult = document.evaluate(event.target.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    if (xpathResult.singleNodeValue instanceof Element) {
                        element = xpathResult.singleNodeValue;
                        ipcRenderer.send(Channel.TEST_LOG, `Element found by xpath instead of CSS: ${element}`);
                    } else {
                        throw new Error(`Element not found for XPath: ${event.target.xpath}`);
                    }
                } catch (xpathError) {
                    ipcRenderer.send(Channel.TEST_LOG, xpathError.message);
                    return; // Exit the function if element is not found by both methods
                }
            }
            if (element) {
                const rect = element.getBoundingClientRect();
                // Log the element's bounding rectangle or use it as needed
                //ipcRenderer.send(Channel.TEST_LOG, `Element rect: ${JSON.stringify(rect)}`);

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
                    case 'scroll':
                        await scrollEvent(event, element);
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

async function inputEvent(event: RecordedEvent, rect: DOMRect) {
    const box = rect;
    const inputX = box.x + box.width / 2;
    const inputY = box.y + box.height / 2;
    //ipcRenderer.send(Channel.TEST_LOG, `Inputting on ${event.target}`);
    //ipcRenderer.send(Channel.TEST_LOG, `Inputting at ${inputX}, ${inputY}`);
    //ipcRenderer.send(Channel.TEST_LOG, `Inputting value: ${event.value}`);
    ipcRenderer.send(Channel.REPLAY_INPUT, { x: inputX, y: inputY, value: event.value });
}

async function hoverEvent(event: RecordedEvent, rect: DOMRect) {
    const box = rect;
    const hoverX = box.x + box.width / 2;
    const hoverY = box.y + box.height / 2;
    //ipcRenderer.send(Channel.TEST_LOG, `Hovering on ${event.target.css}`);
    //ipcRenderer.send(Channel.TEST_LOG, `Hovering at ${hoverX}, ${hoverY}`);
    ipcRenderer.send(Channel.REPLAY_HOVER, { x: hoverX, y: hoverY });
}

async function clickEvent(event: RecordedEvent, rect: DOMRect) {
    const box = rect;
    const clickX = box.x + box.width / 2;
    const clickY = box.y + box.height / 2;
    //ipcRenderer.send(Channel.TEST_LOG, `Clicking on ${event.target.css}`);
    //ipcRenderer.send(Channel.TEST_LOG, `Clicking at ${clickX}, ${clickY}`);
    ipcRenderer.send(Channel.REPLAY_CLICK, { x: clickX, y: clickY });

}

async function scrollEvent(event: RecordedEvent, element?: Element) {
    if (event.type == 'scroll') {
        //ipcRenderer.send(Channel.TEST_LOG, `Scrolling to ${event.value.x}, ${event.value.y}`);
        //ipcRenderer.send(Channel.TEST_LOG, `Scrolling from cursor position ${event.mousePosition.x}, ${event.mousePosition.y}`);

        // Get current position of the cursor
        const currentX = event.mousePosition.x;
        const currentY = event.mousePosition.y;

        // Get the destination scroll cooridnate
        const scrollY = event.value.y;
        const scrollX = event.value.x;

        // Get the current scroll coordinate
        // Initialize both to 0
        let currentScrollY = 0;
        let currentScrollX = 0;

        // If element is provided, get the scroll position of the element
        // If element is provided, the scroll action is performed on a specific element
        if (element) {
            currentScrollY = element.scrollTop;
            currentScrollX = element.scrollLeft;
        }
        // If element is not provided, get the scroll position of the window
        else {
            currentScrollX = window.scrollX;
            currentScrollY = window.scrollY;
        }

        // Calculate the distance to scroll using the provided destination and current scroll coordinates
        const deltaY = scrollY - currentScrollY;
        const deltaX = scrollX - currentScrollX;

        //ipcRenderer.send(Channel.TEST_LOG,'currentScrollX: ' + currentScrollX);
        //ipcRenderer.send(Channel.TEST_LOG,'scrollX: ' + scrollX);
        //ipcRenderer.send(Channel.TEST_LOG,'deltaX: ' + deltaX);

        //ipcRenderer.send(Channel.TEST_LOG,'currentScrollY: ' + currentScrollY);
        //ipcRenderer.send(Channel.TEST_LOG,'scrollY: ' + scrollY);
        //ipcRenderer.send(Channel.TEST_LOG,'deltaY: ' + deltaY);


        // Check for vertical scroll
        if (deltaY !== 0) {

            //ipcRenderer.send(Channel.TEST_LOG, `Scrolling vertically from ${currentScrollY} to ${scrollY}`);
            ipcRenderer.send(Channel.REPLAY_SCROLL, { type: 'vertical', deltaY, currentX, currentY });
        }
        // Check for horizontal scroll
        if (deltaX !== 0) {

            ipcRenderer.send(Channel.TEST_LOG, `Scrolling horizontally from ${currentScrollX} to ${scrollX}`);
            ipcRenderer.send(Channel.REPLAY_SCROLL, { type: 'horizontal', deltaX, currentX, currentY });
        }
    }
}

// Modified replay function to start replayManager asynchronously
export async function replay() {
    //ipcRenderer.send(Channel.TEST_LOG, 'Replay started');
    await replayManager();
    stopReplaying();
    ipcRenderer.send(Channel.TEST_LOG, 'Replay ended');
}

// Function to stop replaying
export function stopReplaying() {
    isReplaying = false;
    ipcRenderer.send(Channel.UPDATE_REPLAY, isReplaying);
    //ipcRenderer.send(Channel.TEST_LOG, 'Replay process is stopping soon');
}