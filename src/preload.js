// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer, contextBridge } = require('electron')

const API = {
    selectMeta: () => ipcRenderer.invoke("selectMeta"),
    selectDirectory: () => ipcRenderer.invoke("selectDir"),
    selectValidate: () => ipcRenderer.invoke("selectValidate"),
    goBack: () => ipcRenderer.invoke("goBack"),
    exportValidatedFiles: () => {ipcRenderer.send("exportValidatedFiles")},
    showValidationResult: (callback) => ipcRenderer.on("showValidationResult", (event, args) => {
      callback(args);
    }),
    exportUnmatchedMeta: () => {ipcRenderer.send("exportUnmatchedMeta")},
    exportUnmatchedDataFiles: () => {ipcRenderer.send("exportUnmatchedDataFiles")},
    exportDuplicateFilenamesInMeta: () => {ipcRenderer.send("exportDuplicateFilenamesInMeta")},
    getUnmatchedMeta: (pagination) => ipcRenderer.invoke("getUnmatchedMeta", pagination),
}

contextBridge.exposeInMainWorld("api", API);
