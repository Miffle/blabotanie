import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  connectWebSocket,
  sendChatMessage,
  requestChatHistory,
  sendCallOffer,
  sendCallAnswer,
  sendIceCandidate,
  sendCallEnd,
  sendCallReject,
  disconnectWebSocket
} from "../ws/client";
import { subscribeToTopics } from "../ws/subscriptions";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [hasMore, setHasMore] = useState(true)
  const [presence, setPresence] = useState({});
  const [friendEvent, setFriendEvent] = useState({ type: null, ts: 0 });
  const [callOffer, setCallOffer] = useState(null);
  const [callAnswer, setCallAnswer] = useState(null);
  const [iceCandidate, setIceCandidate] = useState(null);
  const [callEnd, setCallEnd] = useState(false);
  const [callReject, setCallReject] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const currentChatRef = useRef(null);
  const [isAppVisible, setIsAppVisible] = useState(true);

  // Звуковые эффекты
  const outgoingCallSound = useRef(new Audio('sounds/outgoing-call.mp3'));
  const incomingMessageSound = useRef(new Audio('sounds/incoming-message.mp3'));
  const incomingCallSound = useRef(new Audio('sounds/incoming-call.mp3'));
  const isPlayingIncomingCall = useRef(false);
  const isPlayingOutgoingCall = useRef(false);

  // Настройка звуков
  useEffect(() => {
    // Проверяем возможность воспроизведения звука
    const checkAudio = async () => {
      try {
        console.log('[Audio] Testing incoming call sound...');
        console.log('[Audio] Sound file path:', incomingCallSound.current.src);
        console.log('[Audio] Initial state:', {
          readyState: incomingCallSound.current.readyState,
          error: incomingCallSound.current.error,
          duration: incomingCallSound.current.duration,
          volume: incomingCallSound.current.volume,
          muted: incomingCallSound.current.muted
        });

        await incomingCallSound.current.play();
        incomingCallSound.current.pause();
        incomingCallSound.current.currentTime = 0;
        console.log('[Audio] Sound playback test successful');
      } catch (err) {
        console.error('[Audio] Sound playback test failed:', err);
        console.log('[Audio] Sound state after error:', {
          readyState: incomingCallSound.current.readyState,
          error: incomingCallSound.current.error,
          duration: incomingCallSound.current.duration,
          volume: incomingCallSound.current.volume,
          muted: incomingCallSound.current.muted
        });
      }
    };

    outgoingCallSound.current.loop = true;
    incomingCallSound.current.loop = true;
    
    // Предварительная загрузка звуков
    incomingCallSound.current.load();
    outgoingCallSound.current.load();
    
    // Проверяем возможность воспроизведения
    checkAudio();
  }, []);
  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);
  // Отслеживание состояния приложения через Electron
  useEffect(() => {
    const { BrowserWindow } = window.require('@electron/remote');
    const mainWindow = BrowserWindow.getFocusedWindow();

    const handleShow = () => setIsAppVisible(true);
    const handleHide = () => setIsAppVisible(false);
    const handleMinimize = () => setIsAppVisible(false);
    const handleRestore = () => setIsAppVisible(true);

    mainWindow.on('show', handleShow);
    mainWindow.on('hide', handleHide);
    mainWindow.on('minimize', handleMinimize);
    mainWindow.on('restore', handleRestore);

    // Проверяем начальное состояние
    setIsAppVisible(!mainWindow.isMinimized());

    return () => {
      mainWindow.removeListener('show', handleShow);
      mainWindow.removeListener('hide', handleHide);
      mainWindow.removeListener('minimize', handleMinimize);
      mainWindow.removeListener('restore', handleRestore);
    };
  }, []);

  useEffect(() => {
    connectWebSocket(() => {
      subscribeToTopics({
        onChatMessage: (msg) => { 
          console.log('[WS] chat message', msg); 
          setChatMessages(m => [...m, msg]); 
          console.log(currentChat)
          // Воспроизводим звук входящего сообщения только если:
          // 1. Сообщение не от текущего пользователя
          // 2. Чат с отправителем не открыт или приложение не видимо
          const currentUsername = localStorage.getItem("username");
          if (
            msg.fromUser !== currentUsername &&
            (msg.fromUser !== currentChatRef.current || !isAppVisible)
          ){
            console.log('[Audio] Playing incoming message sound for message from:', msg.fromUser);
            incomingMessageSound.current.play().catch(err => {
              console.error('[Audio] Error playing incoming message sound:', err);
            });
          } else {
            console.log('[Audio] Skipping incoming message sound:', {
              fromUser: msg.fromUser,
              currentUsername,
              currentChat: currentChatRef.current,
              isAppVisible
            });
          }
        },
        onChatHistory: (response) => {
          console.log('[WS] chat history', response);
          const reversed = [...response.messages].reverse();
          setChatHistory(prev => {
            if (!response.messages || response.messages.length === 0) return prev;
            return [...reversed, ...prev];
          });
          setHasMore(response.hasMore);
        },
        onPresence: (status) => { 
          console.log('[WS] presence', status); 
          setPresence(status); 
        },
        onFriendEvent: (type) => {
          setFriendEvent({ type, ts: Date.now() });
        },
        onCallOffer: (data) => { 
          console.log('[WS] call offer', data); 
          setCallOffer(data);
          playIncomingCall();
        },
        onCallAnswer: (data) => { 
          console.log('[WS] call answer', data); 
          setCallAnswer(data);
          stopOutgoingCall();
        },
        onIceCandidate: (data) => { 
          console.log('[WS] ice candidate', data); 
          setIceCandidate(data); 
        },
        onCallEnd: () => {
          console.log('[WS] call end');
          setCallEnd(true);
          setActiveCall(null);
          stopOutgoingCall();
          stopIncomingCall();
        },
        onCallReject: () => {
          console.log('[WS] call reject');
          setCallReject(true);
          setActiveCall(null);
          stopOutgoingCall();
          stopIncomingCall();
        }
      });
    });
  }, [currentChat, isAppVisible]);

  const resetCallState = () => {
    setActiveCall(null);
    setCallOffer(null);
    setCallAnswer(null);
    setIceCandidate(null);
    setCallEnd(false);
    setCallReject(false);
  };

  // Функции для управления звуками
  const playOutgoingCall = () => {
    console.log('[Audio] Attempting to play outgoing call sound');
    console.log('[Audio] Sound state before play:', {
      readyState: outgoingCallSound.current.readyState,
      error: outgoingCallSound.current.error,
      duration: outgoingCallSound.current.duration,
      volume: outgoingCallSound.current.volume,
      muted: outgoingCallSound.current.muted,
      src: outgoingCallSound.current.src
    });

    if (!isPlayingOutgoingCall.current) {
      isPlayingOutgoingCall.current = true;
      outgoingCallSound.current.currentTime = 0;
      outgoingCallSound.current.volume = 1.0;
      outgoingCallSound.current.muted = false;
      outgoingCallSound.current.loop = true;
      outgoingCallSound.current.play()
        .then(() => {
          console.log('[Audio] Outgoing call sound started successfully');
          console.log('[Audio] Sound state after play:', {
            readyState: outgoingCallSound.current.readyState,
            error: outgoingCallSound.current.error,
            duration: outgoingCallSound.current.duration,
            volume: outgoingCallSound.current.volume,
            muted: outgoingCallSound.current.muted
          });
        })
        .catch(err => {
          console.error('[Audio] Error playing outgoing call sound:', err);
          console.log('[Audio] Sound state after error:', {
            readyState: outgoingCallSound.current.readyState,
            error: outgoingCallSound.current.error,
            duration: outgoingCallSound.current.duration,
            volume: outgoingCallSound.current.volume,
            muted: outgoingCallSound.current.muted
          });
          isPlayingOutgoingCall.current = false;
        });
    } else {
      console.log('[Audio] Outgoing call sound is already playing');
    }
  };

  const stopOutgoingCall = () => {
    console.log('[Audio] Attempting to stop outgoing call sound');
    if (isPlayingOutgoingCall.current) {
      outgoingCallSound.current.pause();
      outgoingCallSound.current.currentTime = 0;
      isPlayingOutgoingCall.current = false;
      console.log('[Audio] Outgoing call sound stopped successfully');
    } else {
      console.log('[Audio] Outgoing call sound is not playing');
    }
  };

  const playIncomingCall = () => {
    console.log('[Audio] Attempting to play incoming call sound');
    console.log('[Audio] Sound state before play:', {
      readyState: incomingCallSound.current.readyState,
      error: incomingCallSound.current.error,
      duration: incomingCallSound.current.duration,
      volume: incomingCallSound.current.volume,
      muted: incomingCallSound.current.muted,
      src: incomingCallSound.current.src
    });

    if (!isPlayingIncomingCall.current) {
      isPlayingIncomingCall.current = true;
      incomingCallSound.current.currentTime = 0;
      incomingCallSound.current.volume = 1.0;
      incomingCallSound.current.muted = false;
      incomingCallSound.current.loop = true;
      incomingCallSound.current.play()
        .then(() => {
          console.log('[Audio] Incoming call sound started successfully');
          console.log('[Audio] Sound state after play:', {
            readyState: incomingCallSound.current.readyState,
            error: incomingCallSound.current.error,
            duration: incomingCallSound.current.duration,
            volume: incomingCallSound.current.volume,
            muted: incomingCallSound.current.muted
          });
        })
        .catch(err => {
          console.error('[Audio] Error playing incoming call sound:', err);
          console.log('[Audio] Sound state after error:', {
            readyState: incomingCallSound.current.readyState,
            error: incomingCallSound.current.error,
            duration: incomingCallSound.current.duration,
            volume: incomingCallSound.current.volume,
            muted: incomingCallSound.current.muted
          });
          isPlayingIncomingCall.current = false;
        });
    } else {
      console.log('[Audio] Sound is already playing');
    }
  };

  const stopIncomingCall = () => {
    console.log('[Audio] Attempting to stop incoming call sound');
    if (isPlayingIncomingCall.current) {
      incomingCallSound.current.pause();
      incomingCallSound.current.currentTime = 0;
      isPlayingIncomingCall.current = false;
      console.log('[Audio] Incoming call sound stopped successfully');
    } else {
      console.log('[Audio] Sound is not playing');
    }
  };

  return (
    <WebSocketContext.Provider value={{
      sendChatMessage,
      requestChatHistory,
      sendCallOffer,
      sendCallAnswer,
      sendIceCandidate,
      sendCallEnd,
      sendCallReject,
      disconnectWebSocket,
      chatMessages,
      chatHistory,
      presence,
      hasMore,
      setHasMore,
      friendEvent,
      callOffer,
      callAnswer,
      iceCandidate,
      callEnd,
      callReject,
      activeCall,
      currentChat,
      setCurrentChat,
      setChatMessages,
      setChatHistory,
      setPresence,
      setFriendEvent,
      setCallOffer,
      setCallAnswer,
      setIceCandidate,
      setCallEnd,
      setCallReject,
      setActiveCall,
      resetCallState,
      playOutgoingCall,
      stopOutgoingCall,
      stopIncomingCall,
      playIncomingCall,
      incomingCallSound
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
