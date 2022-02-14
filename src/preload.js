// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer, contextBridge } = require('electron')

const API = {
    selectMeta: () => ipcRenderer.invoke("selectMeta"),
    selectDirectory: () => ipcRenderer.invoke("selectDir"),
    selectSource: (source) => ipcRenderer.send("selectSource", source),
    validate: () => ipcRenderer.invoke("validate"),
    exportValidatedDataFiles: () => {ipcRenderer.send("exportValidatedDataFiles")},
    exportValidatedMetaFile: () => {ipcRenderer.send("exportValidatedMetaFile")},
    showValidationResult: (callback) => ipcRenderer.on("showValidationResult", (event, args) => {
      callback(args);
    }),
    exportUnmatchedMeta: () => {ipcRenderer.send("exportUnmatchedMeta")},
    exportUnmatchedDataFiles: () => {ipcRenderer.send("exportUnmatchedDataFiles")},
}

contextBridge.exposeInMainWorld("api", API);
