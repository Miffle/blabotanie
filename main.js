const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');
const { autoUpdater } = require("electron-updater");
const { ipcMain } = require("electron");
const { dialog } = require("electron");
autoUpdater.autoDownload = true;
let mainWindow;
let appIsQuitting = false; // Лучше использовать отдельную переменную для отслеживания состояния


let tray = null;
function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false // Сначала окно не показываем
    });
    mainWindow.loadFile('index.html');
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    createWindow(); // сначала создать окно
    // Инициализация трея должна быть после создания окна
    tray = new Tray(path.join(__dirname, 'resources/icon/icon256.ico'));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Открыть',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Выход',
            click: () => {
                appIsQuitting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('blabotanie');
    tray.setContextMenu(contextMenu);

    // Обработчик двойного клика
    tray.on('double-click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });

    // Обработчик закрытия окна
    mainWindow.on('close', (event) => {
        if (!appIsQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
        return true;
    });

    // Обработчик перед завершением приложения
    app.on('before-quit', () => {
        appIsQuitting = true;
    });
    // потом обработчики
    autoUpdater.checkForUpdates();

    autoUpdater.on("download-progress", (progressObj) => {
        if (mainWindow) {
            mainWindow.webContents.send("update_progress", progressObj.percent);
        }
    });

    autoUpdater.on("update-downloaded", () => {
        if (mainWindow) {
            mainWindow.webContents.send("update_ready");
        }
    });

    // автозапуск
    app.setLoginItemSettings({
        openAtLogin: true,
        path: process.execPath,
    });
});
app.on('window-all-closed', function () {
    //    if (process.platform !== 'darwin') app.quit();
});