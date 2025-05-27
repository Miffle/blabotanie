import { createContext, useContext, useEffect, useState } from "react";
import {
  connectWebSocket,
  sendChatMessage,
  requestChatHistory,
  sendCallOffer,
  sendCallAnswer,
  sendIceCandidate,
  sendCallEnd,
  sendCallReject
} from "../ws/client";
import { subscribeToTopics } from "../ws/subscriptions";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [presence, setPresence] = useState({});
  const [friendEvent, setFriendEvent] = useState({ type: null, ts: 0 });
  const [callOffer, setCallOffer] = useState(null);
  const [callAnswer, setCallAnswer] = useState(null);
  const [iceCandidate, setIceCandidate] = useState(null);
  const [callEnd, setCallEnd] = useState(false);
  const [callReject, setCallReject] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    connectWebSocket(() => {
      subscribeToTopics({
        onChatMessage: (msg) => { 
          console.log('[WS] chat message', msg); 
          setChatMessages(m => [...m, msg]); 
        },
        onChatHistory: (messages) => { 
          console.log('[WS] chat history', messages); 
          setChatHistory(messages); 
        },
        onPresence: (status) => { 
          console.log('[WS] presence', status); 
          setPresence(status); 
        },
        onFriendEvent: (type) => {
          setFriendEvent({ type, ts: Date.now() });
        },
        onCallOffer: (data) => { console.log('[WS] call offer', data); setCallOffer(data); },
        onCallAnswer: (data) => { console.log('[WS] call answer', data); setCallAnswer(data); },
        onIceCandidate: (data) => { console.log('[WS] ice candidate', data); setIceCandidate(data); },
        onCallEnd: () => {
          console.log('[WS] call end');
          setCallEnd(true);
          setActiveCall(null);
        },
        onCallReject: () => {
          console.log('[WS] call reject');
          setCallReject(true);
          setActiveCall(null);
        }
      });
    });
  }, []);

  return (
    <WebSocketContext.Provider value={{
      sendChatMessage,
      requestChatHistory,
      sendCallOffer,
      sendCallAnswer,
      sendIceCandidate,
      sendCallEnd,
      sendCallReject,
      chatMessages,
      chatHistory,
      presence,
      friendEvent,
      callOffer,
      callAnswer,
      iceCandidate,
      callEnd,
      callReject,
      activeCall,
      setChatMessages,
      setChatHistory,
      setPresence,
      setFriendEvent,
      setCallOffer,
      setCallAnswer,
      setIceCandidate,
      setCallEnd,
      setCallReject,
      setActiveCall
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
