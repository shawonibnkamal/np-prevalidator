const {BrowserWindow, dialog} = require('electron');
const fs=require('fs');
const dfd = require("danfojs-node");

let metaFilePath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/metadata.csv"; // Directory of meta file csv
let directoryPath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/RankinData"; // Direction of data files folder
let df_filenames;
let df_meta;

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
    if (!metaFilePath || !directoryPath) {
        console.log("Files not selected");
        return "Files not selected";
    }
        
    // Read datafile names from directory
    const files = await fs.promises.readdir(directoryPath);
    df_filenames = new dfd.Series(files, {columns: ["filename"]});
    df_filenames.print();

    // Read metafile csv
    df_meta = await dfd.readCSV(metaFilePath)
    console.log(df_meta.count({axis: 0}).iat(0)) // number of filenames (rows)
    df_meta.head().print();
    let df_meta_matched = df_meta.loc({ rows: files.includes(df_meta["FileName"]) });
    df_meta_matched.print();
    
    

    // Check filenames matched
    BrowserWindow.getFocusedWindow().loadFile('./views/result.html');
    return "Validating...";
}