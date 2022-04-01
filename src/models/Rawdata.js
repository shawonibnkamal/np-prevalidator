const csvtojson = require("csvtojson");
const fs = require("fs");
const path = require("path");

class Rawdata {
  constructor() {
    this._filesMap = new Map();
    this._directory = null;
  }

  // Set from directory
  setFromDirectory(directory) {
    // directory = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/RankinData";
    this._directory = directory;
    this._filesMap = this._getAllFiles(directory);
  }

  // Helper function to get list of all files recursively
  _getAllFiles(dirPath, filesMap) {
    let files = fs.readdirSync(dirPath);

    filesMap = filesMap || new Map();

    files.forEach(
      function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
          filesMap = this._getAllFiles(dirPath + "/" + file, filesMap);
        } else {
          filesMap.set(file, { filename: path.join(dirPath, "/", file) }); //[path, matchedWithMeta]
        }
      }.bind(this)
    );

    return filesMap;
  }

  getAllKeys() {
    return Array.from(this._filesMap.keys());
  }

  getAllValues() {
    return Array.from(this._filesMap.values());
  }

  get(key) {
    return this._filesMap.get(key);
  }

  set(key, value) {
    this._filesMap.set(key, value);
  }

  has(key) {
    return this._filesMap.has(key);
  }

  delete(key) {
    this._filesMap.delete(key);
  }

  size() {
    return this._filesMap.size;
  }

  getDirectory() {
    return this._directory;
  }
}

module.exports = Rawdata;
