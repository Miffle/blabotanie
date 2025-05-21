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
