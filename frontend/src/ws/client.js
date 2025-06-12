import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";

export let stompClient = null;

export const connectWebSocket = (onConnectCallback) => {
  if (stompClient && stompClient.active) {
    // Уже подключено
    return;
  }
  const token = localStorage.getItem("token");
  if (!token) return console.error("Нет токена!");

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`http://193.233.113.180:8087/ws?access_token=${encodeURIComponent(token)}`),
    connectHeaders: { Authorization: `Bearer ${token}` },
    debug: (msg) => console.log("[STOMP]", msg),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("✅ STOMP connected");
      onConnectCallback && onConnectCallback();
    },
    onStompError: (frame) => {
      console.error("STOMP ошибка:", frame.headers['message']);
    },
  });

  stompClient.activate();
};

export const sendChatMessage = (toUser, message) => {
  if (!stompClient) return;
  stompClient.publish({
    destination: "/app/chat/message",
    body: JSON.stringify({ toUser, message })
  });
};

export const requestChatHistory = (withUser) => {
  if (!stompClient) return;
  stompClient.publish({
    destination: "/app/chat/history",
    body: JSON.stringify({ withUser })
  });
};

export const sendCallOffer = (initiator, called, sdp, startTime) => {
  if (!stompClient) return;
  stompClient.publish({
    destination: "/app/call/offer",
    body: JSON.stringify({ initiator, called, sdp, startTime })
  });
};

export const sendCallAnswer = (initiator, called, sdp) => {
  if (!stompClient) return;
  stompClient.publish({
    destination: "/app/call/answer",
    body: JSON.stringify({ initiator, called, sdp })
  });
};

export const sendIceCandidate = (initiator, called, candidate) => {
  if (!stompClient) return;
  stompClient.publish({
    destination: "/app/call/ice-candidate",
    body: JSON.stringify({
      initiator,
      called,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdp: candidate.candidate
    })
  });
};

export const sendCallEnd = (recipientId) => {
  if (!stompClient) return;
  stompClient.publish({
    destination: "/app/call/end",
    body: JSON.stringify({ recipientId })
  });
};

export const sendCallReject = (recipientId) => {
  if (!stompClient) return;
  stompClient.publish({
    destination: "/app/call/reject",
    body: JSON.stringify({ recipientId })
  });
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};
