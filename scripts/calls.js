let isMicMuted = false;
let isRemoteMuted = false;
let peerConnection;
let localStream;
let remoteStream;
let currentCallUser;

let pendingCandidates = [];

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
async function callFriend(friendUsername) {
    setButtonUnclickable(true)
    document.getElementById("call-status").innerText = "Ожидание ответа...";
    currentCallUser = friendUsername;
    localStream = await navigator.mediaDevices.getUserMedia({   audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        sampleRate: 44100,
        sampleSize: 16
    } });
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
    currentCallUser = data.initiator;
    callStartTime = new Date(data.startTime);
    document.getElementById("call-status").innerText = "Звонок активен";
    const modal = document.getElementById("incoming-call-modal");
    const nameElem = document.getElementById("caller-name-modal");
    nameElem.innerText = data.initiator;
    modal.style.display = "flex";

    const acceptBtn = document.getElementById("accept-call-btn");
    const rejectBtn = document.getElementById("reject-call-btn");

    acceptBtn.onclick = async () => {
        modal.style.display = "none";
        sounds.incoming.pause();
        sounds.incoming.currentTime = 0;
        await acceptCall(data);
    };

    rejectBtn.onclick = () => {
        modal.style.display = "none";
        sounds.incoming.pause();
        sounds.incoming.currentTime = 0;
        stompClient.publish({
            destination: "/app/call/reject",
            body: JSON.stringify({ recipientId: data.initiator })
        });
    };
}
    async function acceptCall(data) {
    setButtonUnclickable(true);
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    document.getElementById("localAudio").srcObject = localStream;

    peerConnection = createPeerConnection(currentCallUser, localStorage.getItem("username"));
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: data.sdp }));

    for (const candidate of pendingCandidates) {
        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (e) {
            console.error("Ошибка при добавлении ICE:", e);
        }
    }
    pendingCandidates = [];

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    showCallBlock(currentCallUser, false);

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
    const incomingModal = document.getElementById("incoming-call-modal");
    if (incomingModal) {
        incomingModal.style.display = "none";
        sounds.incoming.pause();
        sounds.incoming.currentTime = 0;
    }
    document.getElementById("call-status").innerText = "";
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