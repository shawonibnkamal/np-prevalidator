// Show validation result
window.api.showValidationResult((data) => {
    console.log(data);
    let text = "";
    
    text += `
    <div class="form-group">    
        Number of matched files/meta: ${data.numMatched}<br>
        <button id="exportValidatedMetaFile" class="btn btn-default">Export validated meta</button> 
        <button id="exportValidatedDataFiles" class="btn btn-default">Export validated datafiles</button>
    </div>
    `;

    if (data.missingHeaderFields.length > 0) {
        text += `Missing required header fields: ${data.missingHeaderFields}<br>`;
    }

    if (data.unmatchedMeta > 0) {
        text += `
        <div class="form-group">
            Number of meta without matches: ${data.unmatchedMeta}<br>
            <button id="exportUnmatchedMeta" class="btn btn-default">Export unmatched meta</button>
        </div>
        `;
    }
    

    if (data.unmatchedFiles > 0) {
        text += `
        <div class="form-group">
            Number of files without matches: ${data.unmatchedFiles}<br>
            <button id="exportUnmatchedDataFiles" class="btn btn-default">Export unmatched files</button>
        </div>
        `;
    }

    const element = document.getElementById("resultMessage");
    element.innerHTML = text;

    buttonHandlers();
});

const buttonHandlers = function() {
    // Handler for exportValidatedMetaFile button
    let exportValidatedMetaFile = document.getElementById('exportValidatedMetaFile');
    if (exportValidatedMetaFile) {
        exportValidatedMetaFile.addEventListener('click', async (event) => {
            console.log("export meta clicked")
            event.preventDefault();
            window.api.exportValidatedMetaFile();
        });
    }

    // Handler for exportValidatedDataFiles button
    let exportValidatedDataFiles = document.getElementById('exportValidatedDataFiles');
    if (exportValidatedDataFiles) {
        exportValidatedDataFiles.addEventListener('click', async (event) => {
            console.log("export clicked")
            event.preventDefault();
            window.api.exportValidatedDataFiles();
        });
    }

    // Handler for exportUnmatchedMeta button
    let exportUnmatchedMeta = document.getElementById('exportUnmatchedMeta');
    if (exportUnmatchedMeta) {
        exportUnmatchedMeta.addEventListener('click', async (event) => {
            console.log("export meta clicked")
            event.preventDefault();
            window.api.exportUnmatchedMeta();
        });
    }

    // Handler for exportUnmatchedDataFiles button
    let exportUnmatchedDataFiles = document.getElementById('exportUnmatchedDataFiles');
    if (exportUnmatchedDataFiles) {
        exportUnmatchedDataFiles.addEventListener('click', async (event) => {
            console.log("export clicked")
            event.preventDefault();
            window.api.exportUnmatchedDataFiles();
        });
    }
}