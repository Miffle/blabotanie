// components/FriendItem.jsx
import React from "react";
import { useWebSocket } from "../../context/WebSocketContext";

export default function FriendItem({ friend, onRemove, onSelect, selected, onCall }) {
  const { playOutgoingCall } = useWebSocket();

  const handleCall = (e) => {
    e.stopPropagation();
    if (friend.online && onCall) {
      playOutgoingCall();
      onCall();
    }
  };

  return (
    <div className={`friend-item${selected ? " selected" : ""}`} key={friend.friendId} onClick={onSelect}>
      <span>
        <span className={`status-dot ${friend.online ? "online" : "offline"}`}></span>
        <b>{friend.friendUsername}</b>
      </span>
      <div className="friend-actions">
        <button
          title="Звонок"
          disabled={!friend.online}
          onClick={handleCall}
        >
          <i className="fas fa-phone" />
        </button>
        <button title="Удалить" onClick={e => { e.stopPropagation(); onRemove(friend.friendId); }}><i className="fas fa-user-minus" /></button>
      </div>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    </div>
  );
}
