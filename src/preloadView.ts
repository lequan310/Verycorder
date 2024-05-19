import { ipcRenderer, contextBridge } from 'electron';

// Use window.api.function() to call function down here
contextBridge.exposeInIsolatedWorld(1111, 'renderer', {
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args)
});