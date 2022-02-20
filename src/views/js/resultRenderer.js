// Show validation result
window.api.showValidationResult((data) => {
    console.log(data);
    let text = "";
    text += `
    <ul class="list-group">
        <h3><li class="list-group-header">Validated files</li></h3>
        <li class="list-group-item">
            ${data.numMatched > 0 ? 
            `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
            : 
            `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
            }
            <div class="form-group">
                ${data.numMatched > 0 ? 
                `Number of matched files/meta: ${data.numMatched}<br>
                <button id="exportValidatedMetaFile" class="btn btn-default">Export validated meta</button> 
                <button id="exportValidatedDataFiles" class="btn btn-default">Export validated datafiles</button>
                `
                :
                `No matched files was found.`
                }
            </div>
        </li>
    </ul>
    `;

    text += `<ul class="list-group">`;
    
    text += `<h3><li class="list-group-header">Validation checks</li></h3>`

    text += `
    <li class="list-group-item">
        ${data.missingHeaderFields.length > 0 ? 
        `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
        : 
        `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
        }

        <div class="media-body"> 
            <strong>Meta Headers</strong>
            <p>   
            ${data.missingHeaderFields.length > 0 ? 
                `Missing required header fields: ` + data.missingHeaderFields 
            : 
                `Metadata contains all the required headers.`
            }
            </p>
        </div>
    </li>
    `;

    
    text += `
    <li class="list-group-item">
        ${data.unmatchedMeta > 0 ? 
        `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
        : 
        `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
        }
        <div class="media-body"> 
            <strong>Meta without matches</strong>
            <p>
                ${data.unmatchedMeta > 0 ?
                    `Number of meta without matches: ` + data.unmatchedMeta + `<br>
                    <button id="exportUnmatchedMeta" class="btn btn-default">Export unmatched meta</button>`
                :
                    `All metarows contains valid a filename.`
                }
            </p>
        </div>
    </li>
    `;
    

    text += `
    <li class="list-group-item">
        ${data.unmatchedFiles > 0 ? 
        `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
        : 
        `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
        }
        <div class="media-body"> 
            <strong>Files without matches</strong>
            <p>
                ${data.unmatchedFiles > 0 ?
                    `Number of files without matches: ${data.unmatchedFiles}<br>
                    <button id="exportUnmatchedDataFiles" class="btn btn-default">Export unmatched files</button>`
                :
                    `All files has a valid match.`
                }
            </p>
        </div>
    </li>
    `;

    text += `
    <li class="list-group-item">
        ${data.duplicateFilenamesInMeta > 0 ? 
        `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
        : 
        `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
        }
        <div class="media-body"> 
            <strong>Duplicate filenames in meta</strong>
            <p>
                ${data.unmatchedFiles > 0 ?
                    `Number of duplicate filenames in meta: ${data.duplicateFilenamesInMeta}<br>
                    <button id="exportDuplicateFilenamesInMeta" class="btn btn-default">Export duplicate filenames in meta</button>`
                :
                    `There are no duplicate filenames in meta.`
                }
            </p>
        </div>
    </li>
    `;


    text += `</ul>`;
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

    // Handler for exportDuplicateFilenamesInMeta button
    let exportDuplicateFilenamesInMeta = document.getElementById('exportDuplicateFilenamesInMeta');
    if (exportDuplicateFilenamesInMeta) {
        exportDuplicateFilenamesInMeta.addEventListener('click', async (event) => {
            console.log("export clicked")
            event.preventDefault();
            window.api.exportDuplicateFilenamesInMeta();
        });
    }
}