// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer, contextBridge } = require('electron')

const API = {
    selectMeta: () => ipcRenderer.invoke("selectMeta"),
    selectDirectory: () => ipcRenderer.invoke("selectDir"),
    validate: () => ipcRenderer.invoke("validate"),
    onCount: (callback) => ipcRenderer.on("count", (event, args) => {
      callback(args);
    }),
}

contextBridge.exposeInMainWorld("api", API);
