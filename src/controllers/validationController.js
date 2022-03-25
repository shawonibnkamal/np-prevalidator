const {BrowserWindow, dialog} = require('electron');
const fs=require('fs');
const {parse} = require('csv-parse')
const archiver = require('archiver');
const path = require('path');
const csvtojson = require("csvtojson");
const {json2csv} = require('json-2-csv');
const { performance } = require('perf_hooks');

const header_fields = [
    "filename",
    "f_m",
    "institutioncode",
    "cataloguenumber",
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

let metaFilePath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/updated_metadata.csv"; // Directory of meta file csv
let directoryPath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/RankinData"; // Direction of data files folder

let filesMap = new Map(); // List of files from directory filename:path
let matchedFilesMap = new Map(); // List of raw data files match
let unmatchedFilesMap = new Map(); // List of raw data files unmatched
let meta = []; // List of all meta
let matchedMeta = []; // List of meta with filenames matched
let unmatchedMeta = []; // List of meta without filenames matched
let duplicateFilenamesInMeta = new Set(); // List of meta with duplicate filenames


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
  
    let missingColumns = [];
    
    for(var i =0;i<header_fields.length;i++){
      // check = meta_file_obj_arr[i].replace(/\s/g, "");
      if(!metaFileHeaderFields.includes(header_fields[i])){
        missingColumns.push(header_fields[i]);
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

// Handler after selecting validate button
exports.selectValidate = async (event, args) => {
    console.log("Select Validate");

    // Empty out arrayst
    meta = []; // List of all meta
    matchedMeta = []; // List of meta with filenames matched
    unmatchedMeta = []; // List of meta without filenames matched
    duplicateFilenamesInMeta = new Set(); // List of meta with duplicate filenames

    if (!metaFilePath || !directoryPath) {
        console.log("Files not selected");
        return "Files not selected";
    }
        
    // Read datafile names from directory
    filesMap = await getAllFiles(directoryPath);
    unmatchedFilesMap = new Map(filesMap);
    
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
                duplicateFilenamesInMeta.add(meta[i]['filename']);
            } else {
                matchedMeta.push(meta[i]);
                filesMap.set(meta[i]['filename'], [filesMapValue[0], true]);
                // Unmatched and matched hash maps
                matchedFilesMap.set(meta[i]['filename'], [filesMapValue[0], true]);
                unmatchedFilesMap.delete(meta[i]['filename']);
            }
            
        } else {
            // No matches found
            unmatchedMeta.push({filename: meta[i]['filename'], similar: ""});
        }
    }

    // Show results
    BrowserWindow.getFocusedWindow().loadFile('./views/html/result.html');
    BrowserWindow.getFocusedWindow().once('ready-to-show', () => {
        BrowserWindow.getFocusedWindow().webContents.send("showValidationResult", {
            numMatched: matchedMeta.length,
            missingHeaderFields: missingHeaderFields,
            missingFields: 0,
            unmatchedMeta: meta.length - matchedMeta.length,
            unmatchedFiles: filesMap.size - matchedMeta.length,
            duplicateFilenamesInMeta: duplicateFilenamesInMeta.size,
        })
    })
    
    return "Validating...";
}

// Handler after selecting export meta file button
exports.exportValidatedFiles = async (event, args) => {
    console.log("Export validated clicked")
    let metadatafile = await dialog.showSaveDialog({
        title: 'Input the meta data filename',
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
        fs.writeFileSync(path.join(metadatafile.filePath.toString()), csvOutput);
    });

    let rawdatafiles = await dialog.showSaveDialog({
        title: 'Input the raw data filename',
        defaultPath: path.join(__dirname, '/rawdataset.zip'),
        buttonLabel: 'Save',
        // Restricting the user to only Text Files.
        filters: [{
            name: 'Zip files',
            extensions: ['zip']
        }],
        properties: []
    });
    
    // Zip data files
    var stream = fs.createWriteStream(path.join(rawdatafiles.filePath.toString()));
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

// Controller for exporting duplicate filenames in meta
exports.exportDuplicateFilenamesInMeta = async (event, args) => {
    console.log("Export duplicate filename clicked")
    let file = await dialog.showSaveDialog({
        title: 'Select the File Path to save',
        defaultPath: path.join(__dirname, '/duplicate.csv'),
        buttonLabel: 'Save',
        // Restricting the user to only Text Files.
        filters: [{
            name: 'CSV File',
            extensions: ['csv']
        }],
        properties: []
    });

    let duplicateFilenamesInMetaArray = [];
    for (let [key, value] of duplicateFilenamesInMeta.entries()) {
        duplicateFilenamesInMetaArray.push({"filename": key})
    }

    // Download csv
    json2csv(duplicateFilenamesInMetaArray, (err, csvOutput) => {
        if (err) {
            throw err;
        }
    
        // write csvOutput to a file
        fs.writeFileSync(path.join(file.filePath.toString()), csvOutput);
    });
}

const compare = function(a, b) {
    if ( a.similarity < b.similarity ){
        return 1;
    }
    if ( a.similarity > b.similarity ){
        return -1;
    }
    return 0;
}

// Helper function: get list of unmatchedMeta
// -1 pagination means calculate similar files for all
// 0 pagination means calculate first page of 10 entries
// output can be of "string" and "array"
const getUnmatchedMetaHelper = function(pagination=-1, output="string") {
    // Show 10 entries only if pagination applied
    let start = 0
    let end = unmatchedMeta.length
    if (pagination >= 0) {
        start = 10 * pagination + 1;
        if (start > unmatchedMeta.length) {
            start = 0;
        }
        end = Math.min(start+10, unmatchedMeta.length);
    }

    for (let i = start; i < end; i++) {
        let unmatchedMetaFilename = unmatchedMeta[i]['filename'];
        let similarFilesList = [];
        filesMap.forEach((value, key, map) => {
            if (value[1] == false) {
                let similarity = similarStrings(unmatchedMetaFilename, key);
                if (similarity > 0.75) {
                    similarFilesList.push({filename: key, similarity: similarity});
                }
            }
        });
        similarFilesList.sort(compare);
        let similarFilesListLength = similarFilesList.length;
        if (similarFilesListLength > 7) {
            similarFilesListLength = 7;
        }
        if (output == "string") {
            unmatchedMeta[i]['similar'] = ``;
        } else {
            unmatchedMeta[i]['similar'] = [];
        }
        for (let j = 0; j < similarFilesListLength; j++) {
            if (output == "string") {
                unmatchedMeta[i]['similar'] += `${similarFilesList[j]['filename']}\n`;
            } else {
                unmatchedMeta[i]['similar'].push(similarFilesList[j]['filename']);
            }
        }
    }
    
    return {
        data: unmatchedMeta.slice(start, end),
        prev: (pagination != 0 && pagination != -1 )? pagination - 1 : false,
        next: end != unmatchedMeta.length ? pagination + 1 : false,
        current: pagination,
        total: Math.ceil(unmatchedMeta.length / 10)
    };
}

// Helper function: get list of unmatched raw data files
// -1 pagination means calculate similar files for all
// 0 pagination means calculate first page of 10 entries
// output can be of "string" and "array"
const getUnmatchedRawDataFilesHelper = function(pagination=-1, output="string") {
    let unmatchedFilesList = [];
    for (const [key, value] of unmatchedFilesMap.entries()) {
        if (value[1] == false) {
            unmatchedFilesList.push({
                filename: key,
                similar: ""
            });
        }
    }

    // Show 10 entries only if pagination applied
    let start = 0
    let end = unmatchedFilesList.length
    if (pagination >= 0) {
        start = 10 * pagination + 1;
        if (start > unmatchedFilesList.length) {
            start = 0;
        }
        end = Math.min(start+10, unmatchedFilesList.length);
    }

    for (let i = 0; i < unmatchedFilesList.length; i++) {
        let unmatchedFilename = unmatchedFilesList[i]['filename'];
        let similarMetaList = [];
        for (let j = 0; j < meta.length; j++) {
            let similarity = similarStrings(unmatchedFilename, meta[j]['filename']);
            if (similarity > 0.75) {
                similarMetaList.push({filename: meta[j]['filename'], similarity: similarity});
            }
        }
        similarMetaList.sort(compare);
        let similarMetaListLength = similarMetaList.length;
        if (similarMetaListLength > 7) {
            similarMetaListLength = 7;
        }
        if (output == "string") {
            unmatchedFilesList[i]['similar'] = ``;
        } else {
            unmatchedFilesList[i]['similar'] = [];
        }
        for (let j = 0; j < similarMetaListLength; j++) {
            if (output == "string") {
                unmatchedFilesList[i]['similar'] += `${similarMetaList[j]['filename']}\n`;
            } else {
                unmatchedFilesList[i]['similar'].push(similarMetaList[j]['filename']);
            }
        }
    }
    
    return {
        data: unmatchedFilesList.slice(start, end),
        prev: (pagination != 0 && pagination != -1 )? pagination - 1 : false,
        next: end != unmatchedMeta.length ? pagination + 1 : false,
        current: pagination,
        total: Math.ceil(unmatchedMeta.length / 10)
    };
}

// Export unmatched meta file with similar filenames
exports.exportUnmatchedMeta = async (event, args) => {
    let startTime = performance.now();
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

    let data = getUnmatchedMetaHelper().data;

    // Download csv
    json2csv(data, (err, csvOutput) => {
        if (err) {
            throw err;
        }
    
        // write csvOutput to a file
        fs.writeFileSync(path.join(file.filePath.toString()), csvOutput);

        let endTime = performance.now();
        console.log(`Finished exporting unmatched_metafile in ${endTime - startTime} milliseconds`);
    });
    
}

// Export unmatched data file with similar meta
exports.exportUnmatchedDataFiles = async (event, args) => {
    let startTime = performance.now();
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
    
    let data = getUnmatchedRawDataFilesHelper().data;

    // Download csv
    json2csv(data, (err, csvOutput) => {
        if (err) {
            throw err;
        }
    
        // write csvOutput to a file
        fs.writeFileSync(path.join(file.filePath.toString()), csvOutput);
        
        let endTime = performance.now();
        console.log(`Finished exporting unmatched_datafile in ${endTime - startTime} milliseconds`)
    });
    
}

// Get unmatched metadata json
// To be used in frontend of fix issues button
exports.fixUnmatchedMeta = async(event, args) => {
    console.log("Fix meta issues clicked!");
    let pagination = args;
    let data = getUnmatchedMetaHelper(pagination, "array");
    return data;
}

exports.fixUnmatchedDataFiles = async(event, args) => {
    console.log("Fix data files issues clicked!");
    let pagination = args;
    let data = getUnmatchedRawDataFilesHelper(pagination, "array");
    return data;
}