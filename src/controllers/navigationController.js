const {BrowserWindow} = require('electron');

exports.goBack = () => {
    console.log("Go Back");
    BrowserWindow.getFocusedWindow().loadFile('./views/html/index.html');
}