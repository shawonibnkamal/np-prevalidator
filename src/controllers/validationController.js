const { BrowserWindow, dialog } = require("electron");
const fs = require("fs");
const archiver = require("archiver");
const path = require("path");
const { json2csv } = require("json-2-csv");
const { performance } = require("perf_hooks");
const { Heap } = require("heap-js");
const { stringSimilarity } = require("../helpers/stringSimilarity");
const Metadata = require("../models/Metadata.js");
const Rawdata = require("../models/Rawdata.js");

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
    "replicate",
];

let metaDirectory;
let rawdataDirectory;

let rawdataModel; // List of files from directory filename:path
let matchedRawdataModel; // List of raw data files match
let unmatchedRawdataModel; // List of raw data files unmatched
let metaModel; // List of all meta
let matchedMetaModel; // List of meta with filenames matched
let unmatchedMetaModel; // List of meta without filenames matched

// Handler after selecting meta button
exports.selectMeta = async (event, args) => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        properties: ["openFile"],
        filters: [{ name: "Custom File Type", extensions: ["csv"] }],
    });
    metaDirectory = result.filePaths[0];
    return metaDirectory;
};

// Handler after selecting files directory button
exports.selectDirectory = async (event, args) => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        properties: ["openDirectory"],
    });
    rawdataDirectory = result.filePaths[0];
    return rawdataDirectory;
};

// Handler for goBack in results page
exports.goBack = () => {
    console.log("Go Back");
    metaDirectory = null;
    rawdataDirectory = null;
    BrowserWindow.getFocusedWindow().loadFile("./views/html/index.html");
};

// Helper function to verify meta headers
const verifyMetaFileHeaderFields = async () => {
    // verify if each column is existing
    let metaList = metaModel.getAllValues();
    let metaFileHeaderFields = Object.keys(metaList[0]);

    for (let i = 0; i < metaFileHeaderFields.length; i++) {
        metaFileHeaderFields[i] = metaFileHeaderFields[i].toLowerCase().trim();
    }

    let missingColumns = [];

    for (let i = 0; i < header_fields.length; i++) {
        // check = meta_file_obj_arr[i].replace(/\s/g, "");
        if (!metaFileHeaderFields.includes(header_fields[i])) {
            missingColumns.push(header_fields[i]);
        }
    }

    return missingColumns;
};

// Helper function to check for empty metadata fields
const validateMetaFields = async () => {
    // verify if each column is existing
    let metaList = metaModel.getAllValues();
    let emptyFields = []

    for (let i = 0; i < metaList.length; i++) {
        let currEmptyFields = []
        for (let j = 0; j < header_fields.length; j++) {
            if (metaList[i][header_fields[j]] == "") {
                currEmptyFields.push(header_fields[j])
            }
        }
        if (currEmptyFields.length > 0) {
            emptyFields.push({filename: metaList[i].filename, missingFields: currEmptyFields.join(", ")})
        }
    }

    return emptyFields;
};



// Handler after selecting validate button
exports.selectValidate = async (event, args) => {
    console.log("Select Validate");

    try {
        if (!metaDirectory || !rawdataDirectory) {
            console.log("Files not selected");
            return "Files not selected";
        }

        rawdataModel = new Rawdata();
        rawdataModel.setFromDirectory(rawdataDirectory);
        matchedRawdataModel = new Rawdata();
        unmatchedRawdataModel = new Rawdata();
        unmatchedRawdataModel.setFromDirectory(rawdataDirectory);

        metaModel = new Metadata();
        await metaModel.setFromDirectory(metaDirectory);
        matchedMetaModel = new Metadata(); // List of meta with filenames matched
        unmatchedMetaModel = new Metadata(); // List of meta without filenames matched

        // Check if header files are present in meta
        let missingHeaderFields = await verifyMetaFileHeaderFields();

        let missingFields = await validateMetaFields();

        let metaList = metaModel.getAllValues();

        // Get matchedMeta and unmatchedMeta
        for (let i = 0; i < metaList.length; i++) {
            if (rawdataModel.has(metaList[i]["filename"])) {
                // Matched found
                let rawdataModelValue = rawdataModel.get(metaList[i]["filename"]);

                matchedMetaModel.set(metaList[i]["filename"], metaList[i]);
                // Unmatched and matched hash maps
                matchedRawdataModel.set(metaList[i]["filename"], {
                    filename: rawdataModelValue.filename,
                });
                unmatchedRawdataModel.delete(metaList[i]["filename"]);
            } else {
                // No matches found
                unmatchedMetaModel.set(metaList[i]["filename"], {
                    filename: metaList[i]["filename"],
                    similar: "",
                });
            }
        }

        // Show results
        BrowserWindow.getFocusedWindow().loadFile("./views/html/result.html");
        BrowserWindow.getFocusedWindow().once("ready-to-show", () => {
            BrowserWindow.getFocusedWindow().webContents.send(
                "showValidationResult",
                {
                    numMatched: matchedMetaModel.size(),
                    missingHeaderFields: missingHeaderFields,
                    missingFields: missingFields.length,
                    unmatchedMeta: metaModel.size() - matchedMetaModel.size(),
                    unmatchedFiles: rawdataModel.size() - matchedMetaModel.size(),
                    duplicateFilenamesInMeta: metaModel.getAllDuplicates().length,
                }
            );
        });

        return "Validating...";
    } catch (e) {
        console.error(e);
        return "An error occured!";
    }
};

// Handler after selecting export meta file button
exports.exportValidatedFiles = async (event, args) => {
    console.log("Export validated clicked");
    let metadatafile = await dialog.showSaveDialog({
        title: "Input the meta data filename",
        defaultPath: path.join(__dirname, "/metafile.csv"),
        buttonLabel: "Save",
        // Restricting the user to only Text Files.
        filters: [
            {
                name: "CSV File",
                extensions: ["csv"],
            },
        ],
        properties: [],
    });

    // Download csv
    let matchedMetaList = matchedMetaModel.getAllValues();
    json2csv(matchedMetaList, (err, csvOutput) => {
        if (err) {
            throw err;
        }

        // write csvOutput to a file
        fs.writeFileSync(path.join(metadatafile.filePath.toString()), csvOutput);
    });

    let rawdatafiles = await dialog.showSaveDialog({
        title: "Input the raw data filename",
        defaultPath: path.join(__dirname, "/rawdataset.zip"),
        buttonLabel: "Save",
        // Restricting the user to only Text Files.
        filters: [
            {
                name: "Zip files",
                extensions: ["zip"],
            },
        ],
        properties: [],
    });

    // Zip data files
    var stream = fs.createWriteStream(
        path.join(rawdatafiles.filePath.toString())
    );
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", function (err) {
        throw err;
    });

    await new Promise((resolve, reject) => {
        archive.pipe(stream);
        // append files
        for (let i = 0; i < matchedMetaList.length; i++) {
            archive.file(rawdataModel.get(matchedMetaList[i]["filename"]).filename, {
                name: matchedMetaList[i]["filename"],
            });
        }
        archive.on("error", (err) => {
            throw err;
        });
        archive.finalize();

        stream.on("close", function () {
            console.log(`zipped ${archive.pointer()} total bytes.`);
            resolve();
        });
    });
};

// Controller for exporting empty fields in meta
exports.exportMissingFields = async (event, args) => {
    let file = await dialog.showSaveDialog({
        title: "Select the File Path to save",
        defaultPath: path.join(__dirname, "/emptyFields.csv"),
        buttonLabel: "Save",
        // Restricting the user to only Text Files.
        filters: [
            {
                name: "CSV File",
                extensions: ["csv"],
            },
        ],
        properties: [],
    });

    let emptyFields = await validateMetaFields();

    json2csv(emptyFields, (err, csvOutput) => {
        if (err) {
            throw err;
        }

        // write csvOutput to a file
        fs.writeFileSync(path.join(file.filePath.toString()), csvOutput);
    });
}

// Controller for exporting duplicate filenames in meta
exports.exportDuplicateFilenamesInMeta = async (event, args) => {
    console.log("Export duplicate filename clicked");
    let file = await dialog.showSaveDialog({
        title: "Select the File Path to save",
        defaultPath: path.join(__dirname, "/duplicate.csv"),
        buttonLabel: "Save",
        // Restricting the user to only Text Files.
        filters: [
            {
                name: "CSV File",
                extensions: ["csv"],
            },
        ],
        properties: [],
    });

    let duplicatesList = metaModel.getAllDuplicates();
    let duplicatesJSON = [];
    for (let i = 0; i < duplicatesList.length; i++) {
        duplicatesJSON.push({ filename: duplicatesList[i] });
    }
    console.log(duplicatesJSON);
    // Download csv
    json2csv(duplicatesJSON, (err, csvOutput) => {
        if (err) {
            throw err;
        }

        // write csvOutput to a file
        fs.writeFileSync(path.join(file.filePath.toString()), csvOutput);
    });
};

// Helper function: get list of unmatchedMeta
// -1 pagination means calculate similar files for all
// 0 pagination means calculate first page of 10 entries
// output can be of "string" and "array"
const getUnmatchedMetaHelper = function (pagination = -1, output = "string") {
    let unmatchedMeta = unmatchedMetaModel.getAllValues();

    // Show 10 entries only if pagination applied
    let start = 0;
    let end = unmatchedMeta.length;
    if (pagination >= 0) {
        start = 10 * pagination;
        if (start > unmatchedMeta.length) {
            start = 0;
        }
        end = Math.min(start + 10, unmatchedMeta.length);
    }

    for (let i = start; i < end; i++) {
        let unmatchedMetaFilename = unmatchedMeta[i]["filename"];
        let similarFilesHeap = new Heap(function (a, b) {
            return b.similarity - a.similarity;
        });
        let unmatchedRawdataList = unmatchedRawdataModel.getAllKeys();
        for (let j = 0; j < unmatchedRawdataList.length; j++) {
            let similarity = stringSimilarity(
                unmatchedMetaFilename,
                unmatchedRawdataList[j]
            );
            similarFilesHeap.push({
                filename: unmatchedRawdataList[j],
                similarity: similarity,
            });
            if (similarFilesHeap.size() > 7) {
                similarFilesHeap.pop();
            }
        }

        similarFilesList = [];
        while (similarFilesHeap.size() != 0) {
            similarFilesList.push(similarFilesHeap.pop());
        }

        if (output == "string") {
            unmatchedMeta[i]["similar"] = ``;
        } else {
            unmatchedMeta[i]["similar"] = [];
        }
        for (let j = similarFilesList.length - 1; j > -1; j--) {
            if (output == "string") {
                unmatchedMeta[i]["similar"] += `${similarFilesList[j]["filename"]}\n`;
            } else {
                unmatchedMeta[i]["similar"].push(similarFilesList[j]["filename"]);
            }
        }
    }

    return {
        data: unmatchedMeta.slice(start, end),
        prev: pagination != 0 && pagination != -1 ? pagination - 1 : false,
        next: end != unmatchedMeta.length ? pagination + 1 : false,
        current: pagination,
        total: Math.ceil(unmatchedMeta.length / 10),
    };
};

// Helper function: get list of unmatched raw data files
// -1 pagination means calculate similar files for all
// 0 pagination means calculate first page of 10 entries
// output can be of "string" and "array"
const getUnmatchedRawDataFilesHelper = function (
    pagination = -1,
    output = "string"
) {
    let unmatchedFilesList = [];
    for (const key of unmatchedRawdataModel.getAllKeys()) {
        unmatchedFilesList.push({
            filename: key,
            similar: "",
        });
    }
    // Show 10 entries only if pagination applied
    let start = 0;
    let end = unmatchedFilesList.length;

    let unmatchedMetaList = unmatchedMetaModel.getAllValues();

    if (pagination >= 0) {
        start = 10 * pagination;
        if (start > unmatchedFilesList.length) {
            start = 0;
        }
        end = Math.min(start + 10, unmatchedFilesList.length);
    }

    for (let i = start; i < end; i++) {
        let unmatchedFilename = unmatchedFilesList[i]["filename"];
        let similarMetaHeap = new Heap(function (a, b) {
            return b.similarity - a.similarity;
        });
        for (let j = 0; j < unmatchedMetaList.length; j++) {
            let similarity = stringSimilarity(
                unmatchedFilename,
                unmatchedMetaList[j]["filename"]
            );
            similarMetaHeap.push({
                filename: unmatchedMetaList[j]["filename"],
                similarity: similarity,
            });
            if (similarMetaHeap.size() > 7) {
                similarMetaHeap.pop();
            }
        }
        similarMetaList = [];
        while (similarMetaHeap.size() != 0) {
            similarMetaList.push(similarMetaHeap.pop());
        }

        if (output == "string") {
            unmatchedFilesList[i]["similar"] = ``;
        } else {
            unmatchedFilesList[i]["similar"] = [];
        }
        for (let j = similarMetaList.length - 1; j > -1; j--) {
            if (output == "string") {
                unmatchedFilesList[i][
                    "similar"
                ] += `${similarMetaList[j]["filename"]}\n`;
            } else {
                unmatchedFilesList[i]["similar"].push(similarMetaList[j]["filename"]);
            }
        }
    }

    return {
        data: unmatchedFilesList.slice(start, end),
        prev: pagination != 0 && pagination != -1 ? pagination - 1 : false,
        next: end != unmatchedFilesList.length ? pagination + 1 : false,
        current: pagination,
        total: Math.ceil(unmatchedFilesList.length / 10),
    };
};

// Export unmatched meta file with similar filenames
exports.exportUnmatchedMeta = async (event, args) => {
    let startTime = performance.now();
    console.log("Export unmatched meta clicked");
    let file = await dialog.showSaveDialog({
        title: "Select the File Path to save",
        defaultPath: path.join(__dirname, "/unmatched_metafile.csv"),
        buttonLabel: "Save",
        // Restricting the user to only Text Files.
        filters: [
            {
                name: "CSV File",
                extensions: ["csv"],
            },
        ],
        properties: [],
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
        console.log(
            `Finished exporting unmatched_metafile in ${endTime - startTime
            } milliseconds`
        );
    });
};

// Export unmatched data file with similar meta
exports.exportUnmatchedDataFiles = async (event, args) => {
    let startTime = performance.now();
    console.log("Export unmatched meta clicked");
    let file = await dialog.showSaveDialog({
        title: "Select the File Path to save",
        defaultPath: path.join(__dirname, "/unmatched_datafiles.csv"),
        buttonLabel: "Save",
        // Restricting the user to only Text Files.
        filters: [
            {
                name: "CSV File",
                extensions: ["csv"],
            },
        ],
        properties: [],
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
        console.log(
            `Finished exporting unmatched_datafile in ${endTime - startTime
            } milliseconds`
        );
    });
};

// Get unmatched metadata json
// To be used in frontend of fix issues button
exports.fixUnmatchedMeta = async (event, args) => {
    console.log("Fix meta issues clicked!");
    let pagination = args;
    let data = getUnmatchedMetaHelper(pagination, "array");
    return data;
};

// Get unmatched raw data files json
// To be used in frontend of fix issues button
exports.fixUnmatchedDataFiles = async (event, args) => {
    console.log("Fix data files issues clicked!");
    let pagination = args;
    let data = getUnmatchedRawDataFilesHelper(pagination, "array");
    return data;
};

exports.acceptSuggestion = async (event, type, filename, similar) => {
    console.log("Accept suggestion", type, filename, similar);
    if (type == "meta") {
        // Change name in meta maps, remove from unmatchmedMetaMap and insert it to matchedMetaModel
        let metaModelValue = metaModel.get(filename);
        metaModelValue.filename = similar;

        unmatchedMetaModel.delete(filename);
        matchedMetaModel.set(similar, metaModelValue);
        metaModel.delete(filename);
        metaModel.set(similar, metaModelValue);

        // Remove file from unmatchedFileMap and insert it to matchedFileMap
        let rawdataModelValue = rawdataModel.get(similar);
        unmatchedRawdataModel.delete(similar);
        matchedRawdataModel.set(similar, rawdataModelValue);
    } else if (type == "rawdata") {
        // Remove from unmatchmedMetaMap and insert it to matchedMetaModel
        let metaModelValue = metaModel.get(similar);
        unmatchedMetaModel.delete(similar);
        matchedMetaModel.set(similar, metaModelValue);

        // Update filename, Remove file from unmatchedFileMap and insert it to matchedFileMap
        let rawdataModelValue = rawdataModel.get(filename);

        // Update path
        let oldPath = rawdataModelValue.filename;
        let newPath = oldPath.split("/");
        newPath = newPath.slice(0, newPath.length - 1).join("/");
        if (newPath.length !== 0) {
            newPath += "/";
        }
        newPath += similar;

        unmatchedRawdataModel.delete(filename);
        rawdataModel.delete(filename);
        rawdataModelValue.filename = newPath;
        rawdataModel.set(similar, rawdataModelValue);

        fs.rename(oldPath, newPath, function (err) {
            if (err) console.log("ERROR: " + err);
        });
    }

    return true;
};

exports.rejectSuggestion = async (event, type, filename) => {
    console.log("Reject suggestion", type, filename);

    if (type == "meta") {
        unmatchedMetaModel.delete(filename);
    } else if (type == "rawdata") {
        unmatchedRawdataModel.delete(filename);
    }

    return true;
};

exports.finishSuggestion = async (event, type) => {
    console.log("Finish suggestion", type);

    if (type == "meta") {
        let metaList = metaModel.getAllValues();
        json2csv(metaList, (err, csvOutput) => {
            if (err) {
                throw err;
            }

            // write csvOutput to a file
            fs.writeFile(path.join(metaModel.getDirectory()), csvOutput, (err) => {
                if (err) {
                    console.error(err);
                }
                exports.selectValidate();
            });
        });
    } else {
        exports.selectValidate();
    }

    return true;
};
