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