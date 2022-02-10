const fs=require('fs');
const {parse} = require('csv-parse')
const archiver = require('archiver');
const path = require('path');

let metaFilePath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/metadata.csv"; // Directory of meta file csv
let directoryPath = "/Users/shawonibnkamal/Documents/Honours Project/Sample datasets/Sample dataset 2 birds/RankinData"; // Direction of data files folder
let matchedMeta = []

const readCSV = (path) => {
    return new Promise((resolve, reject) => {
        const data = []
        fs.createReadStream(path)
        .pipe(parse({ delimiter: ',' }))
        .on('data', (r) => {
            data.push(r);        
        })
        .on('end', () => {
            resolve(data)
        })
    });
}

const testFunction = async (event, args) => {
    if (!metaFilePath || !directoryPath) {
        console.log("Files not selected");
        return "Files not selected";
    }
        
    // Read datafile names from directory
    const files = await fs.promises.readdir(directoryPath)
    
    const meta = await readCSV(metaFilePath)
    const metaHeader = meta.shift()

    for (let i=0; i < meta.length; i++) {
        if (files.includes(meta[i][0])) {
            matchedMeta.push(meta[i])
        }
    }

    console.log(matchedMeta)
    exportFiles()
    //let df_meta_matched = df_meta.query(true);
    // df_meta_matched.print();
}

const exportFiles = async (event, args) => {
    
    // Zip data files
    var stream = fs.createWriteStream(path.join(__dirname, '/dataset.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', function(err) {
        throw err;
    });

    await new Promise((resolve, reject) => {
        archive.pipe(stream);
        // append files
        for(let i = 0; i < matchedMeta.length; i++) {
            archive.file(path.join(directoryPath, matchedMeta[i][0]), {name: matchedMeta[i][0]});
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

testFunction();