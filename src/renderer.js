// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
let customMessage = "Hello from the rendered";

let count = 0;

window.api.onCount((data) => {
    count = data;
    replaceText('count', count);
});

const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
}                 

document.getElementById('getUsage').addEventListener('click', async (event) => {
    event.preventDefault();
    const data = await  window.api.sendPromise("Hello get cpu usage");
    console.log(data); 
});

document.getElementById('sendMessage').addEventListener('click', (event) => {
    event.preventDefault();
    console.log("send message");
    window.api.sendMsg(customMessage);
    customMessage = "";
});

document.getElementById('dataFolder').addEventListener('click', async (event) => {
    event.preventDefault()
    const directory = await window.api.selectDirectory();
    replaceText('directoryOutput', "Directory selected: "+directory)
});

document.querySelector('#validateDataForm').addEventListener('submit', submitForm);

function submitForm(e){
    e.preventDefault();
    console.log("form submitted");
    const data = {
        dataFolder: document.querySelector('#dataFolder').value,
        metadata: document.querySelector('#metadata').value,
    }
    console.log(data);
    // console.log(ipcRenderer);
    // ipcRenderer.send('item:add', item);
}