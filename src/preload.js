// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer, contextBridge } = require('electron')

const API = {
    selectMeta: () => ipcRenderer.invoke("selectMeta"),
    selectDirectory: () => ipcRenderer.invoke("selectDir"),
    selectSource: (source) => ipcRenderer.send("selectSource", source),
    validate: () => ipcRenderer.invoke("validate"),
    exportDataFiles: () => {ipcRenderer.send("exportDataFiles")},
    exportMetaFile: () => {ipcRenderer.send("exportMetaFile")},
    showValidationResult: (callback) => ipcRenderer.on("showValidationResult", (event, args) => {
      callback(args);
    }),
}

contextBridge.exposeInMainWorld("api", API);
