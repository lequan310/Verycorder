import { ipcRenderer, contextBridge } from 'electron';

// Use window.api.function() to call function down here
contextBridge.exposeInMainWorld('api', {
    send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
    sendSync: (channel: string, ...args: unknown[]) => ipcRenderer.sendSync(channel, ...args),
    on: (channel: string, func: (...args: unknown[]) => void) => {
        const subscription = (event: Electron.Event, ...args: unknown[]) => func(...args);
        ipcRenderer.on(channel, subscription);
        return () => {
            ipcRenderer.removeListener(channel, subscription);
        }
    },
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
});