const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');
let callStartTime = null;
let callTimerInterval = null;
const API_URL = "http://193.233.113.180:8087";
const WS_URL = "http://193.233.113.180:8087/ws";
//const API_URL = "http://localhost:8087";
//const WS_URL = "http://localhost:8087/ws";

let stompClient;
let peerConnection;
let localStream;
let remoteStream;
let currentCallUser;
const iceServers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
let pendingCandidates = [];

const sounds = {
    incoming: new Audio("sounds/call.mp3"),
    newMessage: new Audio("sounds/newMessage.mp3")
    //    end: new Audio("assets/sounds/end-call.mp3")
};

// Проверяем токены при загрузке страницы
window.onload = () => {
    if (window.location.pathname.endsWith("index.html")) {

        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");

        if (token && refreshToken) {
            console.log("Токены найдены. Попытка обновить...");
            refreshTokenMethod(refreshToken).then(() => {
                playSound();  // Воспроизводим звук после успешного обновления токенов
            }).catch((err) => {
                console.error("Ошибка при обновлении токенов:", err);
            });
        } else {
            console.log("Токены не найдены. Перенаправляем на страницу авторизации.");
            // Можно включить здесь воспроизведение звука, если это необходимо
        }
    }
    else{
        const savedVolume = localStorage.getItem("notificationVolume");
        const slider = document.getElementById("notification-volume-slider");
        const volume = savedVolume !== null ? parseFloat(savedVolume) : 1;

        if (slider) {
            slider.value = volume;
            sounds.incoming.volume = volume;
            sounds.newMessage.volume = volume;

            slider.addEventListener("input", (e) => {
                const vol = parseFloat(e.target.value);
                localStorage.setItem("notificationVolume", vol);
                sounds.incoming.volume = vol;
                sounds.newMessage.volume = vol;
            });
        }
    }
};
window.addEventListener("beforeunload", () => {
    if (peerConnection && currentCallUser) {
        stompClient.publish({
            destination: "/app/call/end",
            body: JSON.stringify({ recipientId: currentCallUser })
        });
    }
});

let isMicMuted = false;
let isRemoteMuted = false;
document.getElementById("current-username").innerText = `👤 ${localStorage.getItem("username")}`;

function toggleMic() {
    if (!localStream) return;
    isMicMuted = !isMicMuted;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMicMuted;
    });
    document.getElementById("toggle-mic").innerText = isMicMuted ? "🎤 ❌" : "🎤 ✅";
}
document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    window.location.href = "index.html";
});

function toggleRemoteAudio() {
    const audio = document.getElementById("remoteAudio");
    if (!audio) return;
    isRemoteMuted = !isRemoteMuted;
    audio.muted = isRemoteMuted;
    document.getElementById("toggle-audio").innerText = isRemoteMuted ? "🔊 ❌" : "🔊 ✅";
}
// Функция для воспроизведения звука
function playSound() {
    sounds.incoming.play().then(() => {
        sounds.incoming.pause();
        sounds.incoming.currentTime = 0;
    }).catch((e) => {
        console.log("Автовоспроизведение пока недоступно:", e.message);
    });
}
function unlockAudio() {
    // "разрешить" воспроизведение, вызвав play() с паузой
    sounds.incoming.play().then(() => {
        sounds.incoming.pause();
        sounds.incoming.currentTime = 0;
    }).catch(err => {
        console.warn("Автозапуск звука заблокирован:", err);
    });

    // делаем один раз
    document.removeEventListener("click", unlockAudio);
}
document.addEventListener("click", unlockAudio);

let currentChatUser = null;
let unreadMessages = {};

function openChat(username) {
    currentChatUser = username;
    document.getElementById("chat-user").innerText = `Чат с ${username}`;
    document.getElementById("chat-box").style.display = "flex";

    unreadMessages[username] = 0;
    updateUnreadIndicators();
    fetchChatHistory(username); // запрос на сервер за сообщениями
}

function closeChat() {
    document.getElementById("chat-box").style.display = "none";
    currentChatUser = null;
}

// Метод для обновления токенов (если нужно)
async function refreshTokenMethod(refreshToken) {
    try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken: refreshToken }),
        });

        if (!res.ok) {
            throw new Error("Не удалось обновить токены.");
        }

        const data = await res.json();
        console.log("Токены обновлены успешно:", data);

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("username", data.username);
        window.location.href = "main.html";  // Переход на главную страницу

    } catch (e) {
        console.error("Ошибка при обновлении токенов:", e);
        //        window.location.href = "index.html";  // Перенаправляем на страницу авторизации
    }
}

// Логика авторизации
async function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass }),
        });

        if (!res.ok) throw new Error("Неверные данные");

        const data = await res.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("username", data.username);
        window.location.href = "main.html";  // Переход на главную страницу
    } catch (e) {
        console.log('Ошибка:', e.message);
        document.getElementById("login-error").innerText = "Ошибка: " + e.message;
    }
}
async function register(){
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    try{
        const res = await fetch(`${API_URL}/api/auth/register`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass }),
        });
        const data = await res.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("username", data.username);
        window.location.href = "main.html";  // Переход на главную страницу
    }catch (e){
        console.log('Ошибка:', e.message);
        document.getElementById("login-error").innerText = "Ошибка: " + e.message;
    }
}
// Подключение к WebSocket
function connectWebSocket() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("Токен не найден! Пожалуйста, авторизуйтесь.");
        return; // Прерываем выполнение, если токен не найден
    }

    // Подключение с заголовками для STOMP и WebSocket
    stompClient = new Client({
        webSocketFactory: () => new SockJS(WS_URL + "?access_token=" + token),
        connectHeaders: { Authorization: `Bearer ${token}` },
        debug: (str) => console.log(str),
        onConnect: () => {
            console.log("STOMP connected");
            subscribeToTopics();
        },
        onStompError: (frame) => console.error("Broker reported error: ", frame),
        onDisconnect: () => {
            if (peerConnection && currentCallUser) {
                autoEndCall();
            }
        }

    });
    stompClient.onMessage = (message) => {
        console.log("Получено сообщение:", message.body);
    };
    stompClient.activate();
}
document.getElementById("chat-input").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // чтобы не вставлялся перевод строки
        sendMessage(); // вызывается твоя функция отправки
    }
});
// Подписка на WebSocket темы
function subscribeToTopics() {
    stompClient.subscribe("/user/queue/chat", (message) => {
        const msg = JSON.parse(message.body);
        if(msg.fromUser !== currentChatUser && msg.fromUser !== localStorage.getItem("username")){
            sounds.newMessage.play()
        }
        if (msg.fromUser === currentChatUser) {
            renderMessage(msg);
        } else {
            unreadMessages[msg.fromUser] = (unreadMessages[msg.fromUser] || 0) + 1;
            updateUnreadIndicators();
        }
    });
    stompClient.subscribe("/user/queue/chat/history", (message) => {
        const msg = JSON.parse(message.body);
        const messages = msg.messages
        const chatBox = document.getElementById("chat-messages");
        chatBox.innerHTML = "";
        messages.forEach(renderMessage);

    });
    stompClient.subscribe("/user/queue/presence", message => {
        const data = JSON.parse(message.body);
        updateFriendStatus(data.username, data.online);
    });

    stompClient.subscribe("/user/queue/call/offer", async message => {
        const data = JSON.parse(message.body);
        await handleIncomingOffer(data);
    });

    stompClient.subscribe("/user/queue/call/answer", async message => {
        const data = JSON.parse(message.body);
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
        // После установки remoteDescription добавляем все накопленные кандидаты
        for (const candidate of pendingCandidates) {
            try {
                await peerConnection.addIceCandidate(candidate);
            } catch (e) {
                console.error("Ошибка при добавлении отложенного ICE-кандидата:", e);
            }
        }
        pendingCandidates = [];
    });
    stompClient.subscribe("/user/queue/friend", async message => {
        const data = JSON.parse(message.body);
        console.log(message.body);
        switch (data){
            case "incomingRequests":{
                fetchData("/api/friends/requests/incoming", "incoming-requests", renderIncomingRequest)
                    .then(items => updateSectionVisibility("incoming-requests", items));
                break;}
            case"outgoingRequests":{
                fetchData("/api/friends/requests/outgoing", "outgoing-requests", renderOutgoingRequest)
                    .then(items => updateSectionVisibility("outgoing-requests", items));
                break;}
            case"friendList":{
                fetchData("/api/friends/getAll", "friends-list", renderFriend);
                break;}
        }
    });

    stompClient.subscribe("/user/queue/call/ice-candidate", async message => {
        const data = JSON.parse(message.body);
        const candidate = new RTCIceCandidate({
            sdpMid: data.sdpMid,
            sdpMLineIndex: data.sdpMLineIndex,
            candidate: data.sdp
        });
        if (!peerConnection || !peerConnection.remoteDescription || !peerConnection.remoteDescription.type) {
            pendingCandidates.push(candidate);
            console.error("peerConnection не инициализирован или remoteDescription не установлена. Кандидат сохранён в буфер.");
            return;
        }
        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (e) {
            console.error("Ошибка при добавлении ICE-кандидата:", e);
        }
    });

    stompClient.subscribe("/user/queue/call/end-call", () => {
        autoEndCall();
    });
    stompClient.subscribe("/user/queue/call/reject-call", () => {
        autoEndCall();
    });
}

async function callFriend(friendUsername) {
    setButtonUnclickable(true)
    currentCallUser = friendUsername;
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    document.getElementById("localAudio").srcObject = localStream;

    peerConnection = createPeerConnection(localStorage.getItem("username"), friendUsername);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    showCallBlock(friendUsername, true)
    const startTime = new Date().toISOString();
    stompClient.publish({
        destination: "/app/call/offer",
        body: JSON.stringify({
            initiator: localStorage.getItem("username"),
            called: friendUsername,
            sdp: offer.sdp,
            startTime: startTime
        })
    });
}

function createPeerConnection(initiator, called) {
    const pc = new RTCPeerConnection(iceServers);
    if(called == null){
        called = localStorage.getItem("username")
    }
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            stompClient.publish({
                destination: "/app/call/ice-candidate",
                body: JSON.stringify({
                    initiator: initiator,
                    called: called,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdp: event.candidate.candidate
                })
            });
        }
    };

    pc.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            document.getElementById("remoteAudio").srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    return pc;
}
async function handleIncomingOffer(data) {
    sounds.incoming.play();
    if (!confirm(`Входящий звонок от ${data.initiator}. Принять?`)) {
        sounds.incoming.pause();
        sounds.incoming.currentTime = 0;
        stompClient.publish({
            destination: "/app/call/reject",
            body: JSON.stringify({ recipientId: data.initiator })
        });
        return;
    }
    sounds.incoming.pause();
    sounds.incoming.currentTime = 0;
    const startTime = new Date(data.startTime); // сохранить в переменную
    callStartTime = startTime;

    setButtonUnclickable(true)

    currentCallUser = data.initiator;
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    document.getElementById("localAudio").srcObject = localStream;

    peerConnection = createPeerConnection(currentCallUser, localStorage.getItem("username"));
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: data.sdp }));
    // После установки remoteDescription добавляем все накопленные кандидаты
    for (const candidate of pendingCandidates) {
        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (e) {
            console.error("Ошибка при добавлении отложенного ICE-кандидата:", e);
        }
    }
    pendingCandidates = [];
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    showCallBlock(data.initiator,false)
    stompClient.publish({
        destination: "/app/call/answer",
        body: JSON.stringify({
            initiator: data.initiator,
            called: localStorage.getItem("username"),
            sdp: answer.sdp
        })
    });
}
function setButtonUnclickable(disable) {
    const callButtons = document.querySelectorAll("button.call");
    callButtons.forEach(btn => {
        btn.disabled = disable;
    });
}
function showCallBlock(name, fromStart){
    document.getElementById("call-window").style.display = "block";
    document.getElementById("caller-name").innerText = name;
    if (fromStart){callStartTime = new Date();}
    updateCallTimer(); // сразу показать 00:00
    callTimerInterval = setInterval(updateCallTimer, 1000);
}
function updateCallTimer() {
    if (!callStartTime) return;

    const now = new Date();
    const totalSeconds = Math.floor((now - callStartTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const display =
    (hours > 0 ? String(hours).padStart(2, '0') + ':' : '') +
    String(mins).padStart(2, '0') + ':' +
    String(secs).padStart(2, '0');

    document.getElementById("call-timer").innerText = display;
}

async function selfEndCall() {
    stompClient.publish({
        destination:"/app/call/end",
        body: JSON.stringify({
            recipientId: currentCallUser
        })
    })
    autoEndCall()
}
async function autoEndCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;  // Очищаем peerConnection
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;  // Очищаем локальный поток
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;  // Очищаем удаленный поток
    }

    document.getElementById("remoteAudio").srcObject = null;
    document.getElementById("localAudio").srcObject = null;
    document.getElementById("call-window").style.display = "none"; // Скрываем окно звонка
    setButtonUnclickable(false)
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
        document.getElementById("call-timer").innerText = "00:00";
    }

    console.log("Звонок завершён");
}

function updateFriendStatus(friendUsername, isOnline) {
    const spanList = document.querySelectorAll("#friends-list span");
    spanList.forEach(span => {
        // Обновляем текст с состоянием онлайн/оффлайн
        if (span.innerText.includes(friendUsername)) {
            span.innerText = `${friendUsername} ${isOnline ? "🟢" : "⚪"}`;
        }
    });

    // Ищем div, который содержит span с именем пользователя
    const friendDiv = document.querySelector(`#friends-list div span[data-username="${friendUsername}"]`);
    if (friendDiv) {
        // Ищем кнопку "Позвонить"
        const button = friendDiv.closest("div").querySelector(".call");
        if (button) {
            if (isOnline) {
                button.disabled = false;  // Включаем кнопку "Позвонить", если друг онлайн
            } else {
                button.disabled = true;   // Отключаем кнопку "Позвонить", если друг не онлайн
            }
        }
    }
}


async function sendFriendRequest() {
    const username = document.getElementById("add-friend-username").value;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/friends/request`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientUsername: username }),
    });

    const msg = document.getElementById("add-friend-status");
    if (res.ok) {
        msg.innerText = "Заявка отправлена";
        msg.style.display = "block";
        setTimeout(() => {
            msg.style.display = "none";
            msg.innerText = "";
        }, 3000); // 3 секунды
    } else {
        msg.innerText = "Ошибка при отправке";
        msg.style.display = "block";
        setTimeout(() => {
            msg.style.display = "none";
            msg.innerText = "";
        }, 3000);
    }
    fetchData("/api/friends/requests/outgoing", "outgoing-requests", renderOutgoingRequest)
        .then(items => updateSectionVisibility("outgoing-requests", items));
}
const volumeSlider = document.getElementById("notification-volume-slider");
volumeSlider.addEventListener("input", () => {
    const volume = parseFloat(volumeSlider.value);
    sounds.incoming.volume = volume;
    sounds.newMessage.volume = volume;
    localStorage.setItem("notificationVolume", volume)});

function updateSectionVisibility(sectionId, items) {
    const section = document.getElementById(sectionId);
    const title = section.previousElementSibling;
    section.style.display = items.length > 0 ? "block" : "none";
    if (title && title.tagName === 'H2') {
        title.style.display = items.length > 0 ? "block" : "none";
    }
}
async function acceptRequest(id) {
    await fetch(`${API_URL}/api/friends/accept/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    fetchData("/api/friends/getAll", "friends-list", renderFriend);
    fetchData("/api/friends/requests/incoming", "incoming-requests", renderIncomingRequest)
        .then(items => updateSectionVisibility("incoming-requests", items));
}

async function declineRequest(id) {
    await fetch(`${API_URL}/api/friends/decline/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    fetchData("/api/friends/requests/incoming", "incoming-requests", renderIncomingRequest)
        .then(items => updateSectionVisibility("incoming-requests", items));
}

async function cancelRequest(id) {
    await fetch(`${API_URL}/api/friends/requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
}

async function removeFriend(id) {
    await fetch(`${API_URL}/api/friends/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    fetchData("/api/friends/getAll", "friends-list", renderFriend);
}
function updateUnreadIndicators() {
    Object.keys(unreadMessages).forEach(username => {
        const indicator = document.getElementById(`chat-indicator-${username}`);
        if (indicator) {
            indicator.innerText = unreadMessages[username] > 0 ? "✉️" : "";
        }
    });
}

function renderFriend(container, f) {
    console.log(f)
    const div = document.createElement("div");
    div.className = "friend-card"
    div.innerHTML = `
    <span data-username="${f.friendUsername}">${f.friendUsername} ${f.online ? "🟢" : "⚪"}</span>
    <div class="friend-actions">

        <button class="chat" onclick="openChat('${f.friendUsername}')">Чат <span id="chat-indicator-${f.friendUsername}" class="chat-indicator"></span></button>
        <button class="call" id="callButton" onclick="callFriend('${f.friendUsername}')">Позвонить</button>
        <button class="remove" onclick="removeFriend('${f.friendId}')">Удалить</button>
    </div>
`;    container.appendChild(div);
    updateFriendStatus(f.friendUsername, f.online);
}

function renderIncomingRequest(container, r) {
    const div = document.createElement("div");
    div.className = "friend-card"
    div.innerHTML = `
    <span>От: ${r.senderUsername}</span>
    <div class="request-actions">
        <button class="accept" onclick="acceptRequest('${r.id}')">Принять</button>
        <button class="decline" onclick="declineRequest('${r.id}')">Отклонить</button>
    </div>
`;
    container.appendChild(div);
}

function renderOutgoingRequest(container, r) {
    const div = document.createElement("div");
    div.className = "friend-card"
    div.innerHTML = `
    <span>Кому: ${r.recipientUsername}</span>
    <div class="request-actions">
        <button class="cancel" onclick="cancelRequest('${r.id}')">Отменить</button>
    </div>
`;
    container.appendChild(div);
}

async function fetchData(url, containerId, renderer) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    data.forEach(renderer.bind(null, container));
    return data;
}

if (window.location.pathname.endsWith("main.html")) {
    connectWebSocket();
    fetchData("/api/friends/getAll", "friends-list", renderFriend);
    fetchData("/api/friends/requests/incoming", "incoming-requests", renderIncomingRequest)
        .then(items => updateSectionVisibility("incoming-requests", items));
    fetchData("/api/friends/requests/outgoing", "outgoing-requests", renderOutgoingRequest)
        .then(items => updateSectionVisibility("outgoing-requests", items));
}
function sendMessage() {
    const input = document.getElementById("chat-input");
    const msg = input.value.trim();
    if (!msg || !currentChatUser) return;

    stompClient.publish({
        destination: "/app/chat/message",
        body: JSON.stringify({
            toUser: currentChatUser,
            message: msg
        })
    });
    renderMessage({ fromUser: localStorage.getItem("username"), message: msg })
    input.value = "";
}

async function fetchChatHistory(friendUsername) {
    stompClient.publish({
        destination: "/app/chat/history",
        body: JSON.stringify({
            withUser: friendUsername
        })
    });

}

function renderMessage(msg) {
    const chatBox = document.getElementById("chat-messages");
    const div = document.createElement("div");
    const fromMe = msg.fromUser === localStorage.getItem("username");
    div.className = fromMe ? "message sent" : "message received";
    const sender = fromMe ? "Вы" : msg.fromUser;
    div.innerHTML = `<b>${sender}</b>: ${msg.message}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}



