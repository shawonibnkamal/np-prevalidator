// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
}

// ================= start index.html functions =============================================

// Handler for selecting metadata
document.getElementById('selectMetaData').addEventListener('click', async (event) => {
    event.preventDefault();
    const meta = await window.api.selectMeta();
    replaceText('metadataOutput', "Meta selected: "+meta);
});

// Handler for selecting directory
document.getElementById('dataFolder').addEventListener('click', async (event) => {
    event.preventDefault();
    const directory = await window.api.selectDirectory();
    replaceText('directoryOutput', "Directory selected: "+directory);
});

// Handler for validate button
document.getElementById('validate').addEventListener('click', async (event) => {
    event.preventDefault();
    const validate = await window.api.validate();
    replaceText('validateOutput', validate);
});

// ================= end index.html functions =============================================