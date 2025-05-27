import React from "react";

export default function IncomingCallInviteModal({ open, caller, onAccept, onReject }) {
  if (!open) return null;

  return (
    <div className="call-modal">
      <div className="call-modal-content">
        <div className="call-modal-title">Входящий звонок от {caller}</div>
        <div className="call-controls">
          <button className="call-control-btn accept-call" onClick={onAccept} style={{ fontSize: '1.5rem' }}>
            <i className="fas fa-phone" style={{ color: '#22c55e', fontSize: '2rem', marginRight: 8 }} /> Принять
          </button>
          <button className="call-control-btn end-call" onClick={onReject} style={{ fontSize: '1.5rem' }}>
            <i className="fas fa-phone-slash" style={{ color: '#dc2626', fontSize: '2rem', marginRight: 8 }} /> Отклонить
          </button>
        </div>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </div>
    </div>
  );
}
