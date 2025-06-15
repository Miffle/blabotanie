import React, { useEffect, useRef } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import Chat from "../components/Chat";
import CallWindow from "../components/CallWindow";
import "../styles/call-page.css";
import { useNavigate } from "react-router-dom";

export default function CallPage() {
  const { activeCall, setActiveCall, setCallOffer, stopOutgoingCall } = useWebSocket();
  const navigate = useNavigate();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!activeCall) {
      navigate("/");
    }
  }, [activeCall, navigate]);

  if (!activeCall) return null;

  const myUsername = localStorage.getItem("username");
  const otherUsername = myUsername === activeCall.initiator ? activeCall.called : activeCall.initiator;

  return (
    <div className="call-page-layout">
      <CallWindow
        activeCall={activeCall}
        onEnd={() => {
          setActiveCall(null);
          setCallOffer(null);
          stopOutgoingCall();
          navigate("/");
        }}
      />
      <div className="call-chat-block">
        <Chat friend={{ friendUsername: otherUsername }} />
      </div>
    </div>
  );
} 