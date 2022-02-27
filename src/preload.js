// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer, contextBridge } = require('electron')

const API = {
    selectMeta: () => ipcRenderer.invoke("selectMeta"),
    selectDirectory: () => ipcRenderer.invoke("selectDir"),
    selectSource: (source) => ipcRenderer.send("selectSource", source),
    validate: () => ipcRenderer.invoke("validate"),
    exportValidatedFiles: () => {ipcRenderer.send("exportValidatedFiles")},
    showValidationResult: (callback) => ipcRenderer.on("showValidationResult", (event, args) => {
      callback(args);
    }),
    exportUnmatchedMeta: () => {ipcRenderer.send("exportUnmatchedMeta")},
    exportUnmatchedDataFiles: () => {ipcRenderer.send("exportUnmatchedDataFiles")},
    exportDuplicateFilenamesInMeta: () => {ipcRenderer.send("exportDuplicateFilenamesInMeta")}
}

contextBridge.exposeInMainWorld("api", API);
