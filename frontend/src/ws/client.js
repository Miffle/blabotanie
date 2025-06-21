import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import { isAuthenticated, refreshTokenIfNeeded } from "../api/auth";
import { WS_URL } from "../config";

export let stompClient = null;
let isConnecting = false;
let navigationCallback = null;

export const setNavigationCallback = (callback) => {
    navigationCallback = callback;
};

const isAuthPage = () => {
    return window.location.pathname === '/auth';
};

const handleAuthRedirect = () => {
    if (!isAuthPage() && navigationCallback) {
        localStorage.clear();
        navigationCallback();
    }
};

const createSockJS = () => {
    const token = localStorage.getItem("token");
    if(localStorage.getItem("token") !== null && localStorage.getItem("refreshToken")!==null){
    console.log("[SockJS] Creating connection with token:", token ? "present" : "missing");
    const sock = new SockJS(`${WS_URL}?access_token=${encodeURIComponent(token)}`);
    sock.onopen = () => {
        console.log("[SockJS] Connection opened");
    };
    
    sock.onerror = async (error) => {
        console.error("[SockJS] Error:", error);
        if (isConnecting) return;
        
        try {
            const refreshed = await refreshTokenIfNeeded();
            if (refreshed) {
                const newToken = localStorage.getItem("token");
                if (newToken) {
                    disconnectWebSocket();
                    await connectWebSocket();
                }
            } else {
                handleAuthRedirect();
            }
        } catch (e) {
            console.error("[SockJS] Error refreshing token:", e);
            handleAuthRedirect();
        }
    };

    return sock;
  }
};

export const connectWebSocket = async (onConnectCallback) => {

  if (isAuthPage()) {
    console.log("[WebSocket] Skipping connection on auth page");
    return;
  }

  if (stompClient && stompClient.active) {
    console.log("[WebSocket] Already connected");
    return;
  }

  if (isConnecting) {
    console.log("[WebSocket] Already connecting...");
    return;
  }

  isConnecting = true;
  console.log("[WebSocket] Starting connection...");

  try {
    // Проверяем токен и обновляем если нужно
    if (!isAuthenticated()) {
      const refreshed = await refreshTokenIfNeeded();
      if (!refreshed) {
        console.error("[WebSocket] Failed to get token!");
        localStorage.clear();
        handleAuthRedirect();
        return;
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("[WebSocket] No token!");
      handleAuthRedirect();
      return;
    }
 
  
    stompClient = new Client({
      webSocketFactory: () => createSockJS(),
      connectHeaders: { 
        Authorization: `Bearer ${token}`
      },
      debug: (msg) => console.log("[STOMP]", msg),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("[WebSocket] ✅ STOMP connected");
        isConnecting = false;
        onConnectCallback && onConnectCallback();
      },
      onStompError: async (frame) => {
        console.error("[WebSocket] STOMP error:", frame.headers['message']);
        if (frame.headers['message']?.includes('401') || frame.headers['message']?.includes('403')) {
          try {
            const refreshed = await refreshTokenIfNeeded();
            if (refreshed) {
              disconnectWebSocket();
              await connectWebSocket(onConnectCallback);
            } else {
              handleAuthRedirect();
            }
          } catch (e) {
            console.error("[WebSocket] Error refreshing token:", e);
            handleAuthRedirect();
          }
        }
      },
      onWebSocketError: async (event) => {
        console.error("[WebSocket] WebSocket error:", event);
        if (isConnecting) return;
        
        try {
          const refreshed = await refreshTokenIfNeeded();
          if (refreshed) {
            disconnectWebSocket();
            await connectWebSocket(onConnectCallback);
          } else {
            handleAuthRedirect();
          }
        } catch (e) {
          console.error("[WebSocket] Error refreshing token:", e);
          handleAuthRedirect();
        }
      },
      onWebSocketClose: async (event) => {
        console.log("[WebSocket] WebSocket closed:", event);
        
        if (!event.wasClean) {
          try {
            const refreshed = await refreshTokenIfNeeded();
            if (refreshed) {
              await connectWebSocket(onConnectCallback);
            } else {
              handleAuthRedirect();
            }
          } catch (e) {
            console.error("[WebSocket] Error refreshing token:", e);
            handleAuthRedirect();
          }
        }
      }
    });

    await stompClient.activate();
  } catch (error) {
    console.error("[WebSocket] Error connecting:", error);
    isConnecting = false;
    localStorage.clear();
    handleAuthRedirect();
  }
};

export const sendChatMessage = (friendUsername, friendUuid, message) => {
  if (!stompClient) return;
  var fromUserUsername = localStorage.getItem("username");
  var fromUserUuid= localStorage.getItem("uuid")
  stompClient.publish({
    destination: "/app/chat/message",
    body: JSON.stringify({
      fromUserUuid: fromUserUuid,
fromUserUsername: fromUserUsername,
toUserUuid: friendUuid,
toUserUsername: friendUsername,
       message 
      })
  });
};

export const requestChatHistory = (friendUuid,friendUsername, page, pageSize = 50) => {
  if (!stompClient) return;
  stompClient.publish({
    destination: "/app/chat/history",
    body: JSON.stringify({
      withUserUuid: friendUuid,
      withUserUsername: friendUsername,
        page,
        pageSize
    })
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
  isConnecting = false;
};
