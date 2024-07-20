import { ipcRenderer } from 'electron';
import { record, stopRecording, hoverEditHandler } from './Main/record';
import { replay, stopReplaying, getTestCase, getNavigationStatus } from './Main/replay';
import { Channel } from './Others/listenerConst';

function onload(load: boolean) {
    ipcRenderer.invoke('get-mode').then((mode) => {
        if (mode === 'record') {
            load ? record() : stopRecording();
        }
    });
}

window.addEventListener('load', () => {
    //document.body.addEventListener('mouseenter', hoverEditHandler, true);
    onload(true);
});

window.addEventListener('beforeunload', () => {
    //document.body.removeEventListener('mouseenter', hoverEditHandler, true);
    onload(false);
});

// Handle when toggle record notification is received
ipcRenderer.on(Channel.TOGGLE_RECORD, (event, recording) => {
    recording ? record() : stopRecording();
});

// Handle when toggle replay notification is received
ipcRenderer.on(Channel.TOGGLE_REPLAY, (event, replaying) => {
    replaying ? replay() : stopReplaying();
});

// Handle when test case is sent
ipcRenderer.on(Channel.SEND_EVENT, (event, testCase) => {
    getTestCase(testCase);
});

ipcRenderer.on(Channel.UPDATE_NAVIGATE, (event, status) => {
    getNavigationStatus(status);
});



