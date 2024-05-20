import { ipcRenderer } from 'electron';
// import { record, stopRecording } from './Others/record';
// import { replay, stopReplaying } from './Others/replay';

let isRecording = false;
let isReplaying = false;

// ------------------- LOAD -------------------
window.addEventListener('load', () => {
    // if (isRecording) {
    //     record();
    // } else if (isReplaying) {
    //     replay();
    // }
    console.log("FIRST");

    // CUU VOI THIS IS NOT WORKING HOW
    ipcRenderer.on('update-url', (event, url) => {
        console.log(url);
    });

    console.log("second");
});