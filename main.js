const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require("electron-updater");
const { dialog } = require("electron");
function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  // Проверка обновлений
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
      type: "info",
      title: "Доступно обновление",
      message: "Доступна новая версия. Она будет загружена автоматически.",
    });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog.showMessageBox({
      type: "info",
      title: "Обновление загружено",
      message: "Приложение будет перезапущено для установки обновления.",
    }).then(() => {
      autoUpdater.quitAndInstall();
    });
  });
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});