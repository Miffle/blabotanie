import React, { useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";

export default function IncomingCallInviteModal({ open, caller, onAccept, onReject }) {
  const { stopIncomingCall, incomingCallSound } = useWebSocket();

  useEffect(() => {
    if (open) {
      // Воспроизводим звук входящего звонка
      incomingCallSound.current.currentTime = 0;
      incomingCallSound.current.volume = 1.0;
      incomingCallSound.current.muted = false;
      incomingCallSound.current.loop = true;
      incomingCallSound.current.play().catch(err => {
        console.error('[Audio] Error playing incoming call sound:', err);
      });
    } else {
      stopIncomingCall();
    }
  }, [open, stopIncomingCall, incomingCallSound]);

  const handleAccept = () => {
    stopIncomingCall();
    onAccept();
  };

  const handleReject = () => {
    stopIncomingCall();
    onReject();
  };

  if (!open) return null;

  return (
    <div className="call-modal">
      <div className="call-modal-content">
        <div className="call-modal-title">Входящий звонок от {caller}</div>
        <div className="call-controls">
          <button className="call-control-btn accept-call" onClick={handleAccept} style={{ fontSize: '1.5rem' }}>
            <i className="fas fa-phone" style={{ color: '#22c55e', fontSize: '2rem', marginRight: 8 }} />
          </button>
          <button className="call-control-btn end-call" onClick={handleReject} style={{ fontSize: '1.5rem' }}>
            <i className="fas fa-phone-slash" style={{ fontSize: '2rem', marginRight: 8 }} />
          </button>
        </div>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </div>
    </div>
  );
}
