import { ipcRenderer } from "electron";
import { Channel } from "./listenerConst";
import { TestCase } from "../Types/testCase";


let testCase : TestCase;
let testUrl: string;

// Function to get the test case from main process
export function getTestCase(newTestCase: TestCase){
    testCase = newTestCase;
}



// Function to loop through the events and allocate approriate function to replay them
export function replayManager() {
    ipcRenderer.send(Channel.TEST_LOG, 'Replay manager started');
    for (const event of testCase.events) {
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
                ipcRenderer.send(Channel.TEST_LOG, event);
                scrollEvent(event);
                break
            
        }
        
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