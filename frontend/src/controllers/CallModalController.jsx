import React, { useState, useEffect } from "react";
import IncomingCallInviteModal from "../components/IncomingCallInviteModal";
import ActiveCallModal from "../components/ActiveCallModal";
import { useWebSocket } from "../context/WebSocketContext";
import { useNavigate } from "react-router-dom";

export default function CallModalController({ open, offer, caller, startTime, onClose }) {
  const [accepted, setAccepted] = useState(false);
  const { sendCallReject, setActiveCall, resetCallState } = useWebSocket();
  const navigate = useNavigate();

  // Локальные копии параметров звонка
  const [localOffer, setLocalOffer] = useState(offer);
  const [localCaller, setLocalCaller] = useState(caller);
  const [localStartTime, setLocalStartTime] = useState(startTime);

  // При открытии окна сохраняем параметры
  useEffect(() => {
    if (open) {
      setLocalOffer(offer);
      setLocalCaller(caller);
      setLocalStartTime(startTime);
    }
  }, [open, offer, caller, startTime]);

  const handleAccept = () => {
    setActiveCall({
      initiator: localOffer.initiator || localCaller, // если есть поле initiator
      called: localOffer.called || localCaller, // если есть поле called
      offer: localOffer,
      startTime: localStartTime,
    });
    setAccepted(true);
    navigate("/call");
  };

  const handleReject = () => {
    sendCallReject(localCaller);
    setAccepted(false);
    resetCallState();
    onClose();
  };

  const handleCallEnd = () => {
    setAccepted(false);
    resetCallState();
    onClose();
  };

  return (
    <>
      {!accepted && (
        <IncomingCallInviteModal
          open={open}
          caller={localCaller}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
      {accepted && (
        <ActiveCallModal
          open={open}
          friendUsername={localCaller}
          incoming={true}
          incomingOffer={localOffer}
          startTime={localStartTime}
          onClose={handleCallEnd}
        />
      )}
    </>
  );
}
