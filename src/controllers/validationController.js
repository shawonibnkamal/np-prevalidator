const {BrowserWindow, dialog} = require('electron');
const fs=require('fs');
const archiver = require('archiver');
const path = require('path');
const csvtojson = require("csvtojson");
const {json2csv} = require('json-2-csv');
const { performance } = require('perf_hooks');
const Heap = require('heap');
const stringSimilarity = require('string-similarity');

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

// Directory of meta file csv
let metaFilePath;
// let metaFilePath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/updated_metadata.csv";

// Direction of data files folder
let directoryPath;
// let directoryPath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/RankinData"; 

let filesMap = new Map(); // List of files from directory filename:path
let matchedFilesMap = new Map(); // List of raw data files match
let unmatchedFilesMap = new Map(); // List of raw data files unmatched
let metaMap = new Map(); // List of all meta
let matchedMetaMap = new Map(); // List of meta with filenames matched
let unmatchedMetaMap = new Map(); // List of meta without filenames matched
let duplicateFilenamesInMeta = new Set(); // List of meta with duplicate filenames
let missingHeaderFields = [] // List of missing header fields

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

// Handler for goBack in results page
exports.goBack = () => {
    console.log("Go Back");
    metaFilePath = null;
    directoryPath = null;
    BrowserWindow.getFocusedWindow().loadFile('./views/html/index.html');
}

// Helper function to get list of all files recursively
const getAllFiles = function(dirPath, filesMap) {
    files = fs.readdirSync(dirPath)

    filesMap = filesMap || new Map();

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            filesMap = getAllFiles(dirPath + "/" + file, filesMap)
        } else {
            filesMap.set(file, {filename: path.join(dirPath, "/", file)}); //[path, matchedWithMeta]
        }
    })

    return filesMap;
}

// Helper function to verify meta headers
const verifyMetaFileHeaderFields = async () => {
    // verify if each column is existing   

    let metaFileHeaderFields = Object.keys(Array.from(metaMap.values())[0]);
    
    for (let i=0; i < metaFileHeaderFields.length; i++) {
        metaFileHeaderFields[i] = metaFileHeaderFields[i].toLowerCase().trim();
    }
  
    let missingColumns = [];
    
    for(let i =0;i<header_fields.length;i++){
      // check = meta_file_obj_arr[i].replace(/\s/g, "");
      if(!metaFileHeaderFields.includes(header_fields[i])){
        missingColumns.push(header_fields[i]);
      }
    }
    
    
    return missingColumns;
}

// Handler after selecting validate button
exports.selectValidate = async (event, args) => {
    console.log("Select Validate");

    // Empty out arrayst
    metaMap = new Map(); // List of all meta
    matchedMetaMap = new Map(); // List of meta with filenames matched
    unmatchedMetaMap = new Map(); // List of meta without filenames matched
    duplicateFilenamesInMeta = new Set(); // List of meta with duplicate filenames
    filesMap = null;
    matchedFilesMap = new Map();
    unmatchedFilesMap = null;

    if (!metaFilePath || !directoryPath) {
        console.log("Files not selected");
        return "Files not selected";
    }
        
    // Read datafile names from directory
    filesMap = getAllFiles(directoryPath);    
    unmatchedFilesMap = new Map(filesMap);
    

    // Read meta from csv
    let metaList = await csvtojson().fromFile(metaFilePath)
    .preFileLine((fileLine,idx)=>{
        if (idx === 0 ) {
            return fileLine.toLowerCase(); // set header fields to lower case
        } else {
            return fileLine;
        }
    });

    

    for (let i=0; i < metaList.length; i++) {
        metaMap.set(metaList[i].filename, metaList[i]);
    }

    // Check if header files are present in meta
    missingHeaderFields = await verifyMetaFileHeaderFields();

    

    // Get matchedMeta and unmatchedMeta
    for (let i=0; i < metaList.length; i++) {
        if (filesMap.has(metaList[i]['filename'])) {
            // Matched found
            let filesMapValue = filesMap.get(metaList[i]['filename']);

            // Check for duplicates
            if (matchedFilesMap.has(metaList[i]['filename'])) {
                duplicateFilenamesInMeta.add(metaList[i]['filename']);
            } else {
                matchedMetaMap.set(metaList[i]['filename'], metaList[i]);
                filesMap.set(metaList[i]['filename'], {filename: filesMapValue.filename});
                // Unmatched and matched hash maps
                matchedFilesMap.set(metaList[i]['filename'], {filename: filesMapValue.filename});
                unmatchedFilesMap.delete(metaList[i]['filename']);
            }
            
        } else {
            // No matches found
            unmatchedMetaMap.set(metaList[i]['filename'], {filename: metaList[i]['filename'], similar: ""});
        }
    }

    // Show results
    BrowserWindow.getFocusedWindow().loadFile('./views/html/result.html');
    BrowserWindow.getFocusedWindow().once('ready-to-show', () => {
        BrowserWindow.getFocusedWindow().webContents.send("showValidationResult", {
            numMatched: matchedMetaMap.size,
            missingHeaderFields: missingHeaderFields,
            missingFields: 0,
            unmatchedMeta: metaMap.size - matchedMetaMap.size,
            unmatchedFiles: filesMap.size - matchedMetaMap.size,
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
    let matchedMetaList = Array.from(matchedMetaMap.values());
    json2csv(matchedMetaList, (err, csvOutput) => {
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
        for(let i = 0; i < matchedMetaList.length; i++) {
            archive.file(filesMap.get(matchedMetaList[i]['filename']).filename, {name: matchedMetaList[i]['filename']});
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

// Helper function: get list of unmatchedMeta
// -1 pagination means calculate similar files for all
// 0 pagination means calculate first page of 10 entries
// output can be of "string" and "array"
const getUnmatchedMetaHelper = function(pagination=-1, output="string") {
    let unmatchedMeta = Array.from(unmatchedMetaMap.values());

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
        let similarFilesList = new Heap(function(a, b) {
            return a.similarity - b.similarity;
        });
        unmatchedFilesMap.forEach((value, key, map) => {
            let similarity = stringSimilarity.compareTwoStrings(unmatchedMetaFilename, key);
            similarFilesList.push({filename: key, similarity: similarity});
            if (similarFilesList.size() > 7) {
                similarFilesList.pop();
            }
        });
        similarFilesList = similarFilesList.toArray();
        if (output == "string") {
            unmatchedMeta[i]['similar'] = ``;
        } else {
            unmatchedMeta[i]['similar'] = [];
        }
        for (let j = similarFilesList.length-1; j > -1; j--) {
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
        unmatchedFilesList.push({
            filename: key,
            similar: ""
        });
    }
    // Show 10 entries only if pagination applied
    let start = 0
    let end = unmatchedFilesList.length

    let unmatchedMetaList = Array.from(unmatchedMetaMap.values());

    if (pagination >= 0) {
        start = 10 * pagination + 1;
        if (start > unmatchedFilesList.length) {
            start = 0;
        }
        end = Math.min(start+10, unmatchedFilesList.length);
    }

    for (let i = start; i < end; i++) {
        let unmatchedFilename = unmatchedFilesList[i]['filename'];
        let similarMetaList = new Heap(function(a, b) {
            return a.similarity - b.similarity;
        });
        for (let j = 0; j < unmatchedMetaList.length; j++) {
            let similarity = stringSimilarity.compareTwoStrings(unmatchedFilename, unmatchedMetaList[j]['filename']);
            similarMetaList.push({filename: unmatchedMetaList[j]['filename'], similarity: similarity});
            if (similarMetaList.size() > 7) {
                similarMetaList.pop();
            }
        }
        similarMetaList = similarMetaList.toArray();
        if (output == "string") {
            unmatchedFilesList[i]['similar'] = ``;
        } else {
            unmatchedFilesList[i]['similar'] = [];
        }
        for (let j = similarMetaList.length-1; j > -1 ; j--) {
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
        next: end != unmatchedFilesList.length ? pagination + 1 : false,
        current: pagination,
        total: Math.ceil(unmatchedFilesList.length / 10)
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

// Get unmatched raw data files json
// To be used in frontend of fix issues button
exports.fixUnmatchedDataFiles = async(event, args) => {
    console.log("Fix data files issues clicked!");
    let pagination = args;
    let data = getUnmatchedRawDataFilesHelper(pagination, "array");
    return data;
}

exports.acceptSuggestion = async(event, type, filename, similar) => {
    console.log("Accept suggestion", type, filename, similar);
    if (type == "meta") {
        // Change name in meta maps, remove from unmatchmedMetaMap and insert it to matchedMetaMap
        let metaMapValue = metaMap.get(filename);
        metaMapValue.filename = similar;

        unmatchedMetaMap.delete(filename);
        matchedMetaMap.set(similar, metaMapValue);
        metaMap.delete(filename);
        metaMap.set(similar, metaMapValue);

        // Remove file from unmatchedFileMap and insert it to matchedFileMap
        let filesMapValue = filesMap.get(similar);
        unmatchedFilesMap.delete(similar);
        matchedFilesMap.set(similar, filesMapValue);

    } else if (type == "rawdata") {
        // Remove from unmatchmedMetaMap and insert it to matchedMetaMap
        let metaMapValue = metaMap.get(similar);
        unmatchedMetaMap.delete(similar);
        matchedMetaMap.set(similar, metaMapValue);

        // Update filename, Remove file from unmatchedFileMap and insert it to matchedFileMap
        let filesMapValue = filesMap.get(filename);

        // Update path
        let oldPath = filesMapValue.filename;
        let newPath = oldPath.split("/");
        newPath = newPath.slice(0, newPath.length - 1).join("/")
        if (newPath.length !== 0) {
            newPath += "/";
        }
        newPath += similar;

        unmatchedFilesMap.delete(filename);
        filesMap.delete(filename);
        filesMapValue.filename = newPath;
        filesMap.set(similar, filesMapValue);

        fs.rename(oldPath, newPath, function(err) {
            if ( err ) console.log('ERROR: ' + err);
        });
    }

    return true;
}

exports.rejectSuggestion = async (event, type, filename) => {
    console.log("Reject suggestion", type, filename);

    if (type == "meta") {
        unmatchedMetaMap.delete(filename);

    } else if (type == "rawdata") {
        unmatchedFilesMap.delete(filename);

    }

    return true;
}

exports.finishSuggestion = async (event, type) => {

    console.log("Finish suggestion", type);

    if (type == "meta") {
        let metaList = Array.from(metaMap.values());
        json2csv(metaList, (err, csvOutput) => {
            if (err) {
                throw err;
            }
        
            // write csvOutput to a file
            fs.writeFile(path.join(metaFilePath), csvOutput, (err) => {
                if (err) {
                    console.error(err);
                }
                exports.selectValidate();
            });

        });
    } else {
        exports.selectValidate();
    }

    return true
}