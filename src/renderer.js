// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
document.getElementById('dataFolder').addEventListener('click', (event) => {
    event.preventDefault()
    window.postMessage({
        type: 'select-dirs'
    });
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