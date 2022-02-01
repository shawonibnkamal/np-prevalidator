// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { ipcRenderer, contextBridge } = require('electron')

const API = {

    sendMsg: (msg) => ipcRenderer.send("message", msg),
    selectDirectory: () => ipcRenderer.invoke("select-dirs"),
    onCount: (callback) => ipcRenderer.on("count", (event, args) => {
      callback(args);
    }),
    sendPromise: (msg) => ipcRenderer.invoke("promise-msg", msg),
}

contextBridge.exposeInMainWorld("api", API);

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})
