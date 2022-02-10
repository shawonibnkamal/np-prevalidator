const {BrowserWindow, dialog} = require('electron');
const fs=require('fs');
const {parse} = require('csv-parse')
const archiver = require('archiver');
const path = require('path');
const csv = require("csvtojson");
const {json2csv} = require('json-2-csv');

let metaFilePath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/metadata.csv"; // Directory of meta file csv
let directoryPath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/RankinData"; // Direction of data files folder
let matchedMeta = []

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
    const files = await fs.promises.readdir(directoryPath)
    
    const meta = await csv().fromFile(metaFilePath);

    for (let i=0; i < meta.length; i++) {
        if (files.includes(meta[i]['FileName'])) {
            matchedMeta.push(meta[i])
        }
    }

    console.log(matchedMeta)
    
    

    // Check filenames matched
    BrowserWindow.getFocusedWindow().loadFile('./views/html/result.html');
    return "Validating...";
}

exports.exportDataFiles = async (event, args) => {
    console.log("Export clicked")
    let file = await dialog.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, '/dataset.zip'),
        buttonLabel: 'Save',
        // Restricting the user to only Text Files.
        filters: [{
            name: 'Zip files',
            extensions: ['zip']
        }],
        properties: []
    });
    
    // Zip data files
    var stream = fs.createWriteStream(path.join(file.filePath.toString()));
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', function(err) {
        throw err;
    });

    await new Promise((resolve, reject) => {
        archive.pipe(stream);
        // append files
        for(let i = 0; i < matchedMeta.length; i++) {
            archive.file(path.join(directoryPath, matchedMeta[i]['FileName']), {name: matchedMeta[i]['FileName']});
        }
        archive.on('error', err => {throw err;});
        archive.finalize();

        stream
        .on('close', function() {
        console.log(`zipped ${archive.pointer()} total bytes.`);
        resolve();
        });
    });
}

exports.exportMetaFile = async (event, args) => {
    console.log("Export meta clicked")
    let file = await dialog.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, '/metafile.csv'),
        buttonLabel: 'Save',
        // Restricting the user to only Text Files.
        filters: [{
            name: 'CSV File',
            extensions: ['csv']
        }],
        properties: []
    });
    
    // Download csv
    json2csv(matchedMeta, (err, csvOutput) => {
        if (err) {
            throw err;
        }
    
        // write csvOutput to a file
        fs.writeFileSync(path.join(file.filePath.toString()), csvOutput);
    });
}