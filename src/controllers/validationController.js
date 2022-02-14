const {BrowserWindow, dialog} = require('electron');
const fs=require('fs');
const {parse} = require('csv-parse')
const archiver = require('archiver');
const path = require('path');
const csvtojson = require("csvtojson");
const {json2csv} = require('json-2-csv');
const { match } = require('assert');

const reflectance_museum_header_fields = [
    "filename",
    "institutioncode",
    "cataloguenumber",
    "genus",
    "specificepithet",
    "patch",
    "lightangle1",
    "lightangle2",
    "probeangle1",
    "probeangle2",
    "replicate"
];
  
const reflectance_field_header_fields = [
    "filename",
    "uniqueid",
    "genus",
    "specificepithet",
    "patch",
    "lightangle1",
    "lightangle2",
    "probeangle1",
    "probeangle2",
    "replicate"
];

let metaFilePath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/metadata.csv"; // Directory of meta file csv
let directoryPath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/RankinData"; // Direction of data files folder
let dataSource = "field";
let meta = [];
let matchedMeta = []
let filesMap = new Map()

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

exports.selectSource = async (event, args) => {
    dataSource = args;
}

const getAllFiles = async function(dirPath, filesMap) {
    return new Promise((resolve, reject) => {
        files = fs.readdirSync(dirPath)

        filesMap = filesMap || new Map()
    
        files.forEach(function(file) {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                filesMap = getAllFiles(dirPath + "/" + file, filesMap)
            } else {
                filesMap.set(file, path.join(dirPath, "/", file));
            }
        })
    
        resolve(filesMap)
    })
}

const verifyMetaFileHeaderFields = function () {
    // verify if each column is existing
    let metaFileHeaderFields = Object.keys(meta[0]);
    console.log(metaFileHeaderFields);
    
    for (let i=0; i < metaFileHeaderFields.length; i++) {
        metaFileHeaderFields[i] = metaFileHeaderFields[i].toLowerCase().trim();
    }
    
    var reference_header_fields = dataSource.toLowerCase() == "field"? reflectance_field_header_fields : reflectance_museum_header_fields;
  
    let missingColumns = [];
    
    for(var i =0;i<reference_header_fields.length;i++){
      // check = meta_file_obj_arr[i].replace(/\s/g, "");
      if(!metaFileHeaderFields.includes(reference_header_fields[i])){
        missingColumns.push(reference_header_fields[i]);
      }
    }
    
    return missingColumns;
}

exports.selectValidate = async (event, args) => {
    console.log("validate pressed");
    if (!metaFilePath || !directoryPath) {
        console.log("Files not selected");
        return "Files not selected";
    }
        
    // Read datafile names from directory
    filesMap = await getAllFiles(directoryPath)
    // Read meta from csv
    meta = await csvtojson().fromFile(metaFilePath)
    .preFileLine((fileLine,idx)=>{
        if (idx === 0 ) {
            return fileLine.toLowerCase(); // set header fields to lower case
        } else {
            return fileLine;
        }
    });

    // Check if header files are present in meta
    let missingHeaderFields = verifyMetaFileHeaderFields();

    // Get matchedMeta
    for (let i=0; i < meta.length; i++) {
        if (filesMap.has(meta[i]['filename'])) {
            matchedMeta.push(meta[i])
        }
    }
    

    // Check filenames matched
    BrowserWindow.getFocusedWindow().loadFile('./views/html/result.html');
    BrowserWindow.getFocusedWindow().once('ready-to-show', () => {
        BrowserWindow.getFocusedWindow().webContents.send("showValidationResult", {
            missingHeaderFields: missingHeaderFields,
            numMatched: matchedMeta.length,
            unmatchedMeta: meta.length - matchedMeta.length,
            unmatchedFiles: filesMap.size - matchedMeta.length
        })
    })
    
    return "Validating...";
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
            console.log(filesMap.get(matchedMeta[i]['filename']))
            archive.file(filesMap.get(matchedMeta[i]['filename']), {name: matchedMeta[i]['filename']});
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
