// preload.js
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        on: (channel, callback) => {
            ipcRenderer.on(channel, (_, ...args) => callback(...args));
        }
    }
});
