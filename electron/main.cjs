const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron");
const path = require("node:path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    frame: false,

    // Automatically hide menu bar
    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const sendMaximizedState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window:maximized-changed", mainWindow.isMaximized());
    }
  };

  mainWindow.on("maximize", sendMaximizedState);
  mainWindow.on("unmaximize", sendMaximizedState);

  // Completely remove the application menu
  Menu.setApplicationMenu(null);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  } else {
    mainWindow.loadURL(
      process.env.VITE_DEV_SERVER_URL || "http://localhost:5173"
    );
  }
}

app.whenReady().then(() => {
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:download-installer", async (event, { url }) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (!targetWindow) return { status: "error", message: "The application window is unavailable." };

    let source;
    try {
      source = new URL(url);
      if (!['https:', 'http:'].includes(source.protocol)) throw new Error("Unsupported protocol");
    } catch {
      return { status: "error", message: "The installer download address is invalid." };
    }

    try {
      targetWindow.webContents.downloadURL(source.toString());
      return { status: "started" };
    } catch (error) {
      return { status: "error", message: error instanceof Error ? error.message : "The installer could not be downloaded." };
    }
  });
  ipcMain.handle("app:show-downloaded-installer", (_event, filePath) => shell.showItemInFolder(filePath));
  ipcMain.handle("window:minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.handle("window:toggle-maximize", (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (!targetWindow) return false;

    if (targetWindow.isMaximized()) targetWindow.unmaximize();
    else targetWindow.maximize();

    return targetWindow.isMaximized();
  });
  ipcMain.handle("window:is-maximized", (event) =>
    BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  );
  ipcMain.handle("window:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  app.on("web-contents-created", (_event, contents) => {
    contents.session.on("will-download", (_downloadEvent, item, webContents) => {
      const savePath = path.join(app.getPath("downloads"), item.getFilename());
      item.setSavePath(savePath);
      webContents.send("app:installer-download-progress", {
        state: "progressing",
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
      });
      item.on("updated", (_event, state) => {
        webContents.send("app:installer-download-progress", {
          state,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
        });
      });
      item.once("done", (_event, state) => {
        webContents.send("app:installer-download-progress", {
          state,
          filePath: state === "completed" ? savePath : undefined,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
        });
      });
    });
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
