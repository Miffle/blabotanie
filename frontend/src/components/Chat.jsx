import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import "../styles/chat.css";

export default function Chat({ friend }) {
  const {
    requestChatHistory,
    chatHistory,
    sendChatMessage,
    chatMessages
  } = useWebSocket();

  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const messagesBoxRef = useRef(null);
  const username = localStorage.getItem("username");

  // Только сообщения, относящиеся к текущему собеседнику
  const historyMessages = (chatHistory || []).filter(
    msg =>
      (msg.fromUser === friend?.friendUsername || msg.toUser === friend?.friendUsername)
  );

  const liveMessages = chatMessages.filter(
    msg =>
      (msg.fromUser === friend?.friendUsername || msg.toUser === friend?.friendUsername)
  );

  const allMessages = [...historyMessages, ...liveMessages];

  useEffect(() => {
    if (friend && friend.friendUsername) {
      requestChatHistory(friend.friendUsername);
    }
    // eslint-disable-next-line
  }, [friend?.friendUsername]);

  useEffect(() => {
    setLoading(false);
  }, [chatHistory]);

  useLayoutEffect(() => {
    setTimeout(() => {
    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }},1);
  }, [allMessages.length, friend]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !friend) return;

    sendChatMessage(friend.friendUsername, input.trim());
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        {friend ? `Чат с ${friend.friendUsername}` : "Выберите собеседника"}
      </div>
      <div className="chat-messages" ref={messagesBoxRef}>
        {loading && <div className="chat-loading">Загрузка...</div>}
        {!loading && friend && allMessages.length === 0 && (
          <div className="chat-empty">Нет сообщений</div>
        )}
        {!loading && friend && allMessages.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.fromUser === username
                ? "chat-message chat-message-own"
                : "chat-message"
            }
          >
            {msg.message}
          </div>
        ))}
      </div>
      {friend && (
        <form className="chat-input-form" onSubmit={handleSend} autoComplete="off">
          <input
            className="chat-input"
            type="text"
            placeholder="Введите сообщение..."
            value={input}
            onChange={e => setInput(e.target.value)}
            autoComplete="off"
          />
          <button className="chat-send-btn" type="submit">Отправить</button>
        </form>
      )}
    </div>
  );
}
