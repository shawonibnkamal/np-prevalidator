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

let filesMap = new Map(); // List of files from directory filename:path
let meta = []; // List of all meta
let matchedMeta = []; // List of meta with filenames matched
let unmatchedMeta = []; // List of meta without filenames matched
let duplicateFilenamesInMeta = []; // List of meta with duplicate filenames


// Handler after selecting meta button
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

// Handler after selecting files directory button
exports.selectDirectory = async (event, args) => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        properties: ['openDirectory']
    })
    directoryPath = result.filePaths[0];
    return directoryPath;
}

// Handler after changing source dropdown
exports.selectSource = async (event, args) => {
    dataSource = args;
}

// Helper function to get list of all files recursively
const getAllFiles = async function(dirPath, filesMap) {
    return new Promise((resolve, reject) => {
        files = fs.readdirSync(dirPath)

        filesMap = filesMap || new Map()
    
        files.forEach(function(file) {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                filesMap = getAllFiles(dirPath + "/" + file, filesMap)
            } else {
                filesMap.set(file, [path.join(dirPath, "/", file), false]); //[path, matchedWithMeta]
            }
        })
    
        resolve(filesMap)
    })
}

// Helper function to verify meta headers
const verifyMetaFileHeaderFields = function () {
    // verify if each column is existing
    let metaFileHeaderFields = Object.keys(meta[0]);
    
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

// Helper functions to check similar strings
const similarStrings = function(s1, s2) {
    function editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
      
        var costs = new Array();
        for (var i = 0; i <= s1.length; i++) {
          var lastValue = i;
          for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
              costs[j] = j;
            else {
              if (j > 0) {
                var newValue = costs[j - 1];
                if (s1.charAt(i - 1) != s2.charAt(j - 1))
                  newValue = Math.min(Math.min(newValue, lastValue),
                    costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
              }
            }
          }
          if (i > 0)
            costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }

    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}
console.log(similarStrings("potato", "Pot_ato"));

// Handler after selecting validate button
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

    // Get matchedMeta and unmatchedMeta
    for (let i=0; i < meta.length; i++) {
        if (filesMap.has(meta[i]['filename'])) {
            // Matched found
            let filesMapValue = filesMap.get(meta[i]['filename']);

            // Check for duplicates
            if (filesMapValue[1] == true) {
                duplicateFilenamesInMeta.push(meta[i]);
            } else {
                matchedMeta.push(meta[i]);
                filesMap.set(meta[i]['filename'], [filesMapValue[0], true]);
            }
            
        } else {
            // No matches found
            unmatchedMeta.push(meta[i]);
        }
    }

    for(let i=0; i < unmatchedMeta.length; i++) {
        
    }

    // Show results
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

// Handler after selecting export meta file button
exports.exportValidatedMetaFile = async (event, args) => {
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

// Handler after selecting export data file button
exports.exportValidatedDataFiles = async (event, args) => {
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
            console.log(filesMap.get(matchedMeta[i]['filename'])[0])
            archive.file(filesMap.get(matchedMeta[i]['filename'])[0], {name: matchedMeta[i]['filename']});
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

// Export unmatched meta file with similar filenames
exports.exportUnmatchedMeta = async (event, args) => {
    console.log("Export unmatched meta clicked")
    let file = await dialog.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, '/unmatched_metafile.csv'),
        buttonLabel: 'Save',
        // Restricting the user to only Text Files.
        filters: [{
            name: 'CSV File',
            extensions: ['csv']
        }],
        properties: []
    });
    

    // Download csv
    json2csv(unmatchedMeta, (err, csvOutput) => {
        if (err) {
            throw err;
        }
    
        // write csvOutput to a file
        fs.writeFileSync(path.join(file.filePath.toString()), csvOutput);
    });
}

// Export unmatched data file with similar meta
exports.exportUnmatchedDataFiles = async (event, args) => {
    console.log("Export unmatched meta clicked")
    let file = await dialog.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, '/unmatched_datafiles.csv'),
        buttonLabel: 'Save',
        // Restricting the user to only Text Files.
        filters: [{
            name: 'CSV File',
            extensions: ['csv']
        }],
        properties: []
    });
    
    let result = [];
    for (const [key, value] of filesMap.entries()) {
        if (value[1] == false) {
            result.push({
                filename: key
            });
        }
    }

    // Download csv
    json2csv(result, (err, csvOutput) => {
        if (err) {
            throw err;
        }
    
        // write csvOutput to a file
        fs.writeFileSync(path.join(file.filePath.toString()), csvOutput);
    });
}