import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from "os";
import path from 'path';
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const { desktopCapturer } = require("electron");

const getSource = (mainWindow: BrowserWindow) => {
  desktopCapturer
    .getSources({ types: ["window", "screen"] })
    .then(async (sources) => {
      console.log(sources);
      mainWindow.webContents.send("GET_SOURCES", sources);
      for (const source of sources) {
        if (source.name === "Screen 1") {
          mainWindow.webContents.send("SET_SOURCE", source.id);
          return;
        }
      }
    });
};


let mainWindow: BrowserWindow | null = null;
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(app.getAppPath(), 'src/preload.ts'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });


    // Test actively push message to the Electron-Renderer
    mainWindow.webContents.on("did-finish-load", () => {
      getSource(mainWindow);
      mainWindow?.webContents.send("main-process-message", new Date().toLocaleString());
    });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    for (const source of sources) {
        mainWindow.webContents.send('SET_SOURCE', source.id)
        console.log("SOURCES", source.name);
    }
  })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
