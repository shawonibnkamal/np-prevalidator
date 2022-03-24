const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const validationController = require("./controllers/validationController");
const navigationController = require("./controllers/navigationController");

let mainWindow; // BrowserWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 700,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      sandbox: true,
      autoHideMenuBar: true,
    },
  });

  // hide menu bar
  mainWindow.setMenuBarVisibility(false);

  // and load the index.html of the app.
  mainWindow.loadFile("./views/html/index.html");

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
  mainWindow = false;
});

// index.html controllers start ==================================
ipcMain.handle("selectMeta", validationController.selectMeta);
ipcMain.handle("selectDir", validationController.selectDirectory);
ipcMain.handle("selectValidate", validationController.selectValidate);

ipcMain.handle("goBack", navigationController.goBack);
ipcMain.on("exportValidatedFiles", validationController.exportValidatedFiles);
ipcMain.on("exportUnmatchedMeta", validationController.exportUnmatchedMeta);
ipcMain.on(
  "exportUnmatchedDataFiles",
  validationController.exportUnmatchedDataFiles
);
ipcMain.on(
  "exportDuplicateFilenamesInMeta",
  validationController.exportDuplicateFilenamesInMeta
);
ipcMain.handle(
  "getUnmatchedMeta",
  validationController.getUnmatchedMeta
);
// index.html controllers end ==================================
