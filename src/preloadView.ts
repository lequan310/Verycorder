import { ipcRenderer } from 'electron';
import { record, stopRecording } from './Others/record';
import { replay, stopReplaying } from './Others/replay';
import { Channel } from './Others/listenerConst';

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

// Handle when toggle record notification is received
ipcRenderer.on(Channel.TOGGLE_RECORD, (event, recording) => {
    recording ? record() : stopRecording();
});