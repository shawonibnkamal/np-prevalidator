const {BrowserWindow, dialog} = require('electron');
const fs=require('fs');

let metaFilePath; // Directory of meta file csv
let directoryPath; // Direction of data files folder

exports.selectMeta = async (event, args) => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        properties: ['openFile'],
        filters: [
        {name: 'Custom File Type', extensions: ['csv']}
        ]
    })
    metaFilePath = result.filePaths[0];
    return metaFilePath;
}

exports.selectDirectory = async (event, args) => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        properties: ['openDirectory']
    })
    directoryPath = result.filePaths[0];
    return directoryPath;
}

exports.selectValidate = async (event, args) => {
    console.log("validate pressed");
    if (metaFilePath && directoryPath) {
        fs.readdir(directoryPath, (err, files) => {
            files.forEach(file => {
                console.log(file);
            });
        });

        BrowserWindow.getFocusedWindow().loadFile('./views/result.html');
        return "Validating...";
    } else {
        console.log("Files not selected");
        return "Files not selected";
    }
}

