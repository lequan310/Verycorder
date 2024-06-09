import { ipcRenderer } from "electron";
import { Channel } from "./listenerConst";
import { TestCase } from "../Types/testCase";

let testCase : TestCase;

export function getTestCase(newTestCase: TestCase){
    testCase = newTestCase;
}

export function replay() {
    console.log('Replay started');
    ipcRenderer.send(Channel.TEST_LOG, 'Replay started');
    ipcRenderer.send(Channel.TEST_LOG, testCase);
}

export function stopReplaying() {
    console.log('Replay stopped');
    ipcRenderer.send(Channel.TEST_LOG, 'Replay stopped');
}