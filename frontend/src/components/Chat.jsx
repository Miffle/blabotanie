import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import "../styles/chat.css";

export default function Chat({ friend }) {
  const {
    requestChatHistory,
    sendChatMessage,
    chatMessages,
    chatHistory: wsChatHistory,
    hasMore: wsHasMore,
    setHasMore: setWsHasMore,
    setCurrentChat
  } = useWebSocket();

  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const messagesBoxRef = useRef(null);
  const oldScrollHeightRef = useRef(0);
  const firstVisibleMessageRef = useRef(null);
  const username = localStorage.getItem("username");
  const ITEMS_PER_PAGE = 50;

  // Обновляем текущий открытый чат
  useEffect(() => {
    setCurrentChat(friend?.friendUsername || null);
    return () => setCurrentChat(null);
  }, [friend?.friendUsername, setCurrentChat]);

  // Только сообщения, относящиеся к текущему собеседнику
  const historyMessages = (wsChatHistory || []).filter(
    msg =>
      (msg.fromUser === friend?.friendUsername || msg.toUser === friend?.friendUsername)
  );

 const liveMessages = chatMessages;

  // Объединяем сообщения без дедупликации
  const allMessages = [...historyMessages, ...liveMessages];

  useEffect(() => {
    if (friend && friend.friendUsername) {
      setPage(0);
      setWsHasMore(true);
      requestChatHistory(friend.friendUsername, 0, ITEMS_PER_PAGE);
    }
    // eslint-disable-next-line
  }, [friend?.friendUsername]);

  useEffect(() => {
    if (wsChatHistory && wsChatHistory.length < ITEMS_PER_PAGE) {
      setWsHasMore(false);
    }
  }, [wsChatHistory, setWsHasMore]);

  const handleScroll = () => {
    if (!messagesBoxRef.current || loading || !wsHasMore) return;

    const { scrollTop } = messagesBoxRef.current;
    if (scrollTop === 0) {
      oldScrollHeightRef.current = messagesBoxRef.current.scrollHeight;
      const messages = messagesBoxRef.current.children;
      for (let i = 0; i < messages.length; i++) {
        const rect = messages[i].getBoundingClientRect();
        if (rect.top >= 0) {
          firstVisibleMessageRef.current = messages[i];
          break;
        }
      }
      
      setLoading(true);
      const nextPage = page + 1;
      setPage(nextPage);
      requestChatHistory(friend.friendUsername, nextPage, ITEMS_PER_PAGE);
    }
  };

  useLayoutEffect(() => {
    if (!messagesBoxRef.current) return;
  
    const box = messagesBoxRef.current;
  
    if (loading && firstVisibleMessageRef.current) {
      const oldTop = firstVisibleMessageRef.current.getBoundingClientRect().top;
  
      requestAnimationFrame(() => {
        const newTop = firstVisibleMessageRef.current.getBoundingClientRect().top;
        const scrollDiff = newTop - oldTop;
        box.scrollTop += scrollDiff;
      });
  
      setLoading(false);
    } else if (page === 0) {
      box.scrollTop = box.scrollHeight;
    }
  }, [allMessages, loading, page]);

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
      <div 
        className="chat-messages" 
        ref={messagesBoxRef}
        onScroll={handleScroll}
      >
        {loading && <div className="chat-loading">Загрузка...</div>}
        {!loading && friend && allMessages.length === 0 && (
          <div className="chat-empty">Нет сообщений</div>
        )}
        {friend && allMessages.map((msg, idx) => (
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
