// Handler for exportMetaFile button
document.getElementById('exportMetaFile').addEventListener('click', async (event) => {
    console.log("export meta clicked")
    event.preventDefault();
    window.api.exportMetaFile();
});

// Handler for exportDataFiles button
document.getElementById('exportDataFiles').addEventListener('click', async (event) => {
    console.log("export clicked")
    event.preventDefault();
    window.api.exportDataFiles();
});

// Show validation result
window.api.showValidationResult((data) => {
    console.log(data);
    let text = "";
    if (data.missingHeaderFields.length > 0) {
        text += `Missing required header fields: ${data.missingHeaderFields}<br>`;
    }
    text += `
        Number of matched files/meta: ${data.numMatched}<br>
        Number of files without matches: ${data.unmatchedFiles}<br>
        Number of meta without matches: ${data.unmatchedMeta}
    `;

    const element = document.getElementById("resultMessage");
    element.innerHTML = text;
});