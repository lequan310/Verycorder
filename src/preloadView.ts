import { ipcRenderer } from 'electron';
import { record, stopRecording } from './Others/record';
import { replay, stopReplaying } from './Others/replay';

function onload(load: boolean) {
    ipcRenderer.invoke('get-mode').then((mode) => {
        switch (mode) {
            case 'record':
                load ? record() : stopRecording();
                break;
            case 'replay':
                load ? replay() : stopReplaying();
                break;
        }
    });
}

window.addEventListener('load', () => {
    onload(true);
});

window.addEventListener('beforeunload', () => {
    onload(false);
});

ipcRenderer.on('toggle-record', (event, recording) => {
    console.log("Recording: ", recording);
    recording ? record() : stopRecording();
});