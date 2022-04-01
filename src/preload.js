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
    exportMissingFields: () => {ipcRenderer.send("exportMissingFields")},
    exportDuplicateFilenamesInMeta: () => {ipcRenderer.send("exportDuplicateFilenamesInMeta")},
    fixUnmatchedMeta: (pagination) => ipcRenderer.invoke("fixUnmatchedMeta", pagination),
    fixUnmatchedDataFiles: (pagination) => ipcRenderer.invoke("fixUnmatchedDataFiles", pagination),
    acceptSuggestion: (type, filename, similar) => ipcRenderer.invoke("acceptSuggestion", type, filename, similar),
    rejectSuggestion: (type, filename) => ipcRenderer.invoke("rejectSuggestion", type, filename),
    finishSuggestion: (type) => ipcRenderer.invoke("finishSuggestion", type)
}

contextBridge.exposeInMainWorld("api", API);
