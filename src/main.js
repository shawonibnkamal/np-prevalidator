// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain} = require('electron')
const path = require('path')

let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  count = 0;
  setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.send("count", count++);
    }
  }, 1000);
  
  

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.handle("select-dirs", async (event, args) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  const directory = result.filePaths[0];
  console.log('directory selected', directory)
  return directory;
});


ipcMain.on("message", (event, args) => {
  console.log(args);
});

ipcMain.handle("promise-msg", async (event, args) => {
  console.log(args);
  return process.getCPUUsage();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
  mainWindow = false;
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
