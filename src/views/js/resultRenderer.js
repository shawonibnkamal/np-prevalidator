// Show validation result
window.api.showValidationResult((data) => {
    console.log(data);
    let text = "";
    // Validation checks    
    text += `
    <h3>Validation checks</h3>
    <table class="table-striped">
    <thead>
    <th>Issues</th>
    <th>Actions</th>
    </thead>`

    text += `
    <tr>
        <td>
            ${data.missingHeaderFields.length > 0 ? 
            `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
            : 
            `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
            }

            <div> 
                <strong>Metadata Headers</strong>
                <div>   
                ${data.missingHeaderFields.length > 0 ? 
                    `Missing required headers: ` + data.missingHeaderFields 
                : 
                    `Metadata contains all the required headers.`
                }
                </div>
            </div>
        </td>
        <td>
        </td>
    </tr>
    `;

    text += `
    <tr>
        <td>
            ${data.missingFields.length > 0 ? 
            `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
            : 
            `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
            }

            <div> 
                <strong>Metadata Fields</strong>
                <div>   
                ${data.missingFields.length > 0 ? 
                    `Missing required fields in metadata: ` + data.missingFields 
                : 
                    `Metadata contains all the required fields.`
                }
                </div>
            </div>
        </td>
        <td>
            ${data.missingFields > 0 ?
                `
                <button class="btn btn-default"><span class="icon icon-export icon-text"></span> Export issues in csv</button>
                `
                :
                ``
            }
        </td>
    </tr>
    `;

    text += `
    <tr>
        <td>
            ${data.duplicateFilenamesInMeta > 0 ? 
            `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
            : 
            `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
            }
            <div> 
                <strong>Duplicate filenames in metadata</strong>
                <div>
                    ${data.duplicateFilenamesInMeta > 0 ?
                        `Number of duplicate filenames in metadata: ${data.duplicateFilenamesInMeta}`
                    :
                        `There are no duplicate filenames in metadata.`
                    }
                </div>
            </div>
        </td>
        <td> 
            ${data.duplicateFilenamesInMeta > 0 ?
                `
                <button id="exportDuplicateFilenamesInMeta" class="btn btn-default"><span class="icon icon-export icon-text"></span>  Export issues in csv</button>
                `
                :
                ``
            }
        </td>
    </tr>
    `;

    
    text += `
    <tr>
        <td>
            ${data.unmatchedMeta > 0 ? 
            `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
            : 
            `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
            }
            <div> 
                <strong>Metadata rows without matches</strong>
                <div>
                    ${data.unmatchedMeta > 0 ?
                        `Number of metadata rows without matches: ` + data.unmatchedMeta
                    :
                        `All metadata rows contains valid a filename.`
                    }
                </div>
            </div>
        </td>
        <td>
            ${data.unmatchedMeta > 0 ?
                `
                <button class="btn btn-default"><span class="icon icon-tools icon-text"></span> Fix issues</button>
                <button id="exportUnmatchedMeta" class="btn btn-default"><span class="icon icon-export icon-text"></span> Export issues in csv</button>
                `
                :
                ``
            }
        </td>
    </tr>
    `;
    

    text += `
    <tr>
        <td>
            ${data.unmatchedFiles > 0 ? 
            `<span class="icon icon-record color-red media-object pull-left font-20"></span>`
            : 
            `<span class="icon icon-record color-green media-object pull-left font-20"></span>`
            }
            <div> 
                <strong>Raw data files without matches</strong>
                <div>
                    ${data.unmatchedFiles > 0 ?
                        `Number of raw data files without matches: ${data.unmatchedFiles}<br>`
                    :
                        `All files has a valid match.`
                    }
                </div>
            </div>
        </td>
        <td>
            ${data.unmatchedFiles > 0 ?
                `
                <button class="btn btn-default"><span class="icon icon-tools icon-text"></span> Fix issues</button>
                <button id="exportUnmatchedDataFiles" class="btn btn-default"><span class="icon icon-export icon-text"></span> Export issues in csv</button>
                `
                :
                ``
            }
        </td>
    </tr>
    `;

    text += `</table>`;

    // Validated files
    text += `
    <br><br>
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
                <button id="exportValidatedFiles" class="btn btn-default"><span class="icon icon-export icon-text"></span> Export validated metadata and raw data files</button>
                `
                :
                `No matched files was found.`
                }
            </div>
        </li>
    </ul>
    `;
    const element = document.getElementById("resultMessage");
    element.innerHTML = text;

    buttonHandlers();
});

const buttonHandlers = function() {
    // Handler for exportValidatedMetaFile button
    let exportValidatedFiles = document.getElementById('exportValidatedFiles');
    if (exportValidatedFiles) {
        exportValidatedFiles.addEventListener('click', async (event) => {
            console.log("export meta clicked")
            event.preventDefault();
            window.api.exportValidatedFiles();
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