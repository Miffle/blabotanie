const API_URL = "http://193.233.113.180:8087";
const WS_URL = "http://193.233.113.180:8087/ws";
const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');
let stompClient;
const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}