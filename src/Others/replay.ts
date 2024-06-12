import { ipcRenderer } from "electron";
import { Channel } from "./listenerConst";
import { TestCase } from "../Types/testCase";


let testCase : TestCase;
let cssSelector: string;

// Function to get the test case from main process
export function getTestCase(newTestCase: TestCase){
    testCase = newTestCase;
}



// Function to loop through the events and allocate approriate function to replay them
export function replayManager() {
    ipcRenderer.send(Channel.TEST_LOG, 'Replay manager started');
    for (const event of testCase.events) {
        ipcRenderer.send(Channel.TEST_LOG, event);
        switch (event.type) {
            case 'click':
                clickEvent(event);
                break;
            case 'input':
                //await inputEvent(event);
                break;
            case 'hover':
                //await hoverEvent(event);
                break;
            case 'scroll':
                //scrollEvent(event);
                break
            
        }
        
    }
}

function clickEvent(event: any) {
    cssSelector = event.target.css;
    //ipcRenderer.send(Channel.REPLAY_CLICK, cssSelector);
    ipcRenderer.send(Channel.TEST_LOG, `Clicking on ${cssSelector}`);
    console.log(cssSelector);
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

}

function scrollEvent(event: any) {
    const scrollY = event.value.y;
    ipcRenderer.send(Channel.TEST_LOG, `Scrolling to ${scrollY}`);
    ipcRenderer.send(Channel.REPLAY_SCROLL, scrollY);
}

export function replay() {
    ipcRenderer.send(Channel.TEST_LOG, 'Replay started');
    replayManager();
    
}

export function stopReplaying() {
    ipcRenderer.send(Channel.TEST_LOG, 'Replay stopped');
}