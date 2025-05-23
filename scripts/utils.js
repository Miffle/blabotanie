const API_URL = "http://193.233.113.180:8087";
const WS_URL = "http://193.233.113.180:8087/ws";
const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');
const { ipcRenderer } = require("electron");
let stompClient;
let currentCallStatus = null; // null, 'ringing', 'active'
const remote = require("@electron/remote");
const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
ipcRenderer.on("update_progress", (event, percent) => {
    document.getElementById("update-container").style.display = "block";
    document.getElementById("update-progress").value = percent;
    document.getElementById("update-percent").innerText = `${Math.floor(percent)}%`;
});



ipcRenderer.on("update_ready", () => {
    // Например, автоматически начать установку
    ipcRenderer.send("install_update");
});
function isAppFocused() {
    const win = remote.BrowserWindow.getAllWindows()[0];
    return win && win.isFocused();
}

function isWindowVisible() {
    const win = remote.BrowserWindow.getAllWindows()[0];
    return win && win.isVisible();
}