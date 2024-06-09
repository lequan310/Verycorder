import { ipcRenderer } from "electron";
import { Channel } from "./listenerConst";


export function replay() {
    console.log('Replay started');
    ipcRenderer.send(Channel.TEST_LOG, 'Replay started');
}

export function stopReplaying() {
    console.log('Replay stopped');
    ipcRenderer.send(Channel.TEST_LOG, 'Replay stopped');
}