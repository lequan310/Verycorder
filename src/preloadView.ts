import { ipcRenderer } from 'electron';
import { record, stopRecording } from './Others/record';
import { replay, stopReplaying, getTestCase} from './Others/replay';
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

// Handle when toggle replay notification is received
ipcRenderer.on(Channel.TOGGLE_REPLAY, (event, replaying) => {
    replaying ? replay() : stopReplaying();
});

// Handle when test case is sent
ipcRenderer.on(Channel.SEND_EVENT, (event, testCase) => {
    getTestCase(testCase);
});
