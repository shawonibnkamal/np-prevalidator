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