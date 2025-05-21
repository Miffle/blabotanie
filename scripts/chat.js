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
document.getElementById("chat-input").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // чтобы не вставлялся перевод строки
        sendMessage(); // вызывается твоя функция отправки
    }
});
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
    const safeText = escapeHtml(msg.message);
    div.innerHTML = `<b>${sender}</b>: ${safeText}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
function updateUnreadIndicators() {
    Object.keys(unreadMessages).forEach(username => {
        const indicator = document.getElementById(`chat-indicator-${username}`);
        if (indicator) {
            indicator.innerText = unreadMessages[username] > 0 ? "✉️" : "";
        }
    });
}
