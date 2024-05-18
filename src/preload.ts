import { ipcRenderer, contextBridge } from 'electron';

// Use window.api.function() to call function down here
contextBridge.exposeInMainWorld('api', {
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    sendSync: (channel: string, ...args: any[]) => ipcRenderer.sendSync(channel, ...args),
    on: (channel: string, func: any) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
});