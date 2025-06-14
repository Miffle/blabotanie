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
          if (
            msg.fromUser !== localStorage.getItem("username") &&
            (msg.fromUser !== currentChatRef.current || !isAppVisible)
          ){
            incomingMessageSound.current.play();
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
          // Воспроизводим звук входящего звонка
          console.log('[Audio] Attempting to play incoming call sound');
          incomingCallSound.current.currentTime = 0;
          incomingCallSound.current.volume = 1.0; // Устанавливаем максимальную громкость
          incomingCallSound.current.muted = false; // Убеждаемся, что звук не отключен
          incomingCallSound.current.play()
            .then(() => {
              console.log('[Audio] Incoming call sound started successfully');
              console.log('[Audio] Sound state:', {
                volume: incomingCallSound.current.volume,
                muted: incomingCallSound.current.muted,
                paused: incomingCallSound.current.paused,
                currentTime: incomingCallSound.current.currentTime
              });
            })
            .catch(err => {
              console.error('[Audio] Error playing incoming call sound:', err);
              console.log('[Audio] Sound element state:', {
                readyState: incomingCallSound.current.readyState,
                error: incomingCallSound.current.error,
                src: incomingCallSound.current.src,
                volume: incomingCallSound.current.volume,
                muted: incomingCallSound.current.muted
              });
            });
        },
        onCallAnswer: (data) => { 
          console.log('[WS] call answer', data); 
          setCallAnswer(data);
          // Останавливаем звук исходящего звонка
          outgoingCallSound.current.pause();
          outgoingCallSound.current.currentTime = 0;
        },
        onIceCandidate: (data) => { 
          console.log('[WS] ice candidate', data); 
          setIceCandidate(data); 
        },
        onCallEnd: () => {
          console.log('[WS] call end');
          setCallEnd(true);
          setActiveCall(null);
          // Останавливаем все звуки звонков
          outgoingCallSound.current.pause();
          outgoingCallSound.current.currentTime = 0;
          incomingCallSound.current.pause();
          incomingCallSound.current.currentTime = 0;
        },
        onCallReject: () => {
          console.log('[WS] call reject');
          setCallReject(true);
          setActiveCall(null);
          // Останавливаем все звуки звонков
          outgoingCallSound.current.pause();
          outgoingCallSound.current.currentTime = 0;
          incomingCallSound.current.pause();
          incomingCallSound.current.currentTime = 0;
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
    outgoingCallSound.current.play();
  };

  const stopOutgoingCall = () => {
    outgoingCallSound.current.pause();
    outgoingCallSound.current.currentTime = 0;
  };

  const stopIncomingCall = () => {
    incomingCallSound.current.pause();
    incomingCallSound.current.currentTime = 0;
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
      incomingCallSound
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
