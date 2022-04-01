const csvtojson = require("csvtojson");

class Metadata {
    constructor(directory) {
        this._metaMap = new Map();
        this._duplicatesSet = new Set();
        this._directory = null;
    }

    async setFromDirectory(directory) {
        // directory = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/updated_metadata.csv";
        this._directory = directory;
        
        // Read meta from csv
        let metaList = await csvtojson().fromFile(directory)
        .preFileLine((fileLine,idx)=>{
            if (idx === 0 ) {
                return fileLine.toLowerCase(); // set header fields to lower case
            } else {
                return fileLine;
            }
        });


        for (let i=0; i < metaList.length; i++) {
            if (this._metaMap.has(metaList[i].filename)) {
                this._duplicatesSet.add(metaList[i].filename);
            } else {
                this._metaMap.set(metaList[i].filename, metaList[i]);
            }
        }
    }

    getAllKeys() {
        return Array.from(this._metaMap.keys());
    }

    getAllValues() {
        return Array.from(this._metaMap.values());
    }

    getAllDuplicates() {
        return Array.from(this._duplicatesSet.keys());
    }

    get(key) {
        return this._metaMap.get(key);
    }

    set(key, value) {
        this._metaMap.set(key, value);
    }

    has(key) {
        return this._metaMap.has(key);
    }

    delete(key) {
        this._metaMap.delete(key);
    }

    size() {
        return this._metaMap.size;
    }

    getDirectory() {
        return this._directory;
    }

}

module.exports = Metadata