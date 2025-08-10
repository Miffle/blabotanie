const {app, BrowserWindow, Menu, Tray} = require('electron');
const path = require('path');
const {autoUpdater} = require("electron-updater");
const {powerMonitor} = require("electron");
autoUpdater.autoDownload = true;
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow;
let deeplinkUrl = null;
let appIsQuitting = false; // Лучше использовать отдельную переменную для отслеживания состояния
app.setAppUserModelId("com.blabotanie.app"); // должен совпадать с appId из build
// Menu.setApplicationMenu(null);
let tray = null;
const isDev = !app.isPackaged;
if (!isDev) {
    Menu.setApplicationMenu(null);
} else {
    // Можно оставить стандартное меню или создать кастомное
    const template = [
        {
            label: 'Developer',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('blabotanie', process.execPath, [path.resolve(process.argv[1])])
    }
} else {
    app.setAsDefaultProtocolClient('blabotanie')
}
setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime();
    if (mainWindow) {
        mainWindow.webContents.send('user-idle-time', idleTime);
    }
}, 5000);

function createWindow() {
    require('@electron/remote/main').initialize();
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: true, // важно!
            preload: path.join(__dirname, 'preload.js'),

        },
        resizable: false,
//         frame: false,
        opacity:1,
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
        // titleBarStyle: 'hidden',
        show: false // Сначала окно не показываем
    });
    require("@electron/remote/main").enable(mainWindow.webContents);

    mainWindow.loadFile(path.join(__dirname, 'compiled-frontend', 'index.html'));
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (deeplinkUrl) {
            handleDeepLink(deeplinkUrl);
            deeplinkUrl = null;
        }
    });
}

if (process.platform === 'win32') {
    deeplinkUrl = process.argv.find(arg => arg.startsWith('blabotanie://'));
}
app.whenReady().then(() => {
    createWindow(); // сначала создать окно
    // Инициализация трея должна быть после создания окна
    tray = new Tray(path.join(__dirname, 'resources/icon/icon256.ico'));
    const settings = app.getLoginItemSettings();
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
            label: 'Запускать при старте системы',
            type: 'checkbox',
            checked: settings.openAtLogin,
            click: (menuItem) => {
                app.setLoginItemSettings({
                    openAtLogin: menuItem.checked,
                    path: process.execPath
                });
            }
        },
        {
            type: 'separator'
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
        appIsQuitting = true;
        autoUpdater.quitAndInstall();
    });
    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', (event, argv) => {
            if (process.platform === 'win32') {
                const url = argv.find(arg => arg.startsWith('blabotanie://'));
                if (url) {
                    handleDeepLink(url);
                }
            }

            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            }
        });
    }

});

function handleDeepLink(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'add-friend') {
            const username = parsed.searchParams.get('username');
            mainWindow.webContents.send('deeplink-add-friend', username);
        }
    } catch (e) {
        console.error('Ошибка при разборе deeplink:', e);
    }
}

app.on('window-all-closed', function () {
    //    if (process.platform !== 'darwin') app.quit();
});