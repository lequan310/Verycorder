import { ipcRenderer } from 'electron';
import { record, stopRecording } from './Others/record';
import { replay, stopReplaying } from './Others/replay';

let isRecording = false;
let isReplaying = false;

// ------------------- LOAD -------------------
window.addEventListener('load', () => {
    if (isRecording) {
        record();
    } else if (isReplaying) {
        replay();
    }

    ipcRenderer.on('toggle-record', (event, recording) => {
        isRecording = recording;
        isRecording ? record() : stopRecording();
    });
});