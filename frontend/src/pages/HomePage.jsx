import React, { useEffect, useState } from "react";
import "../styles/home.css";

const tips = [
  {
    icon: "💬",
    text: "Чтобы начать чат, выберите друга в списке и напишите сообщение."
  },
  {
    icon: "📞",
    text: "Чтобы позвонить, нажмите на иконку телефона рядом с другом."
  },
  {
    icon: "➕",
    text: "Добавьте нового друга через форму поиска в разделе 'Друзья'."
  },
  {
    icon: "ℹ️",
    text: "Все звонки и сообщения защищены и доступны только вам и вашим друзьям."
  }
];

export default function HomePage() {
  const username = localStorage.getItem("username") || "Гость";
  // Здесь можно добавить реальный аватар, если появится поддержка
  const avatarUrl = null;
  const isOnline = true; // Можно заменить на реальный статус, если появится

  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`home-container home-appear${showContent ? " home-appear-active" : ""}`}>
      <div className="home-profile-block">
        <div className="home-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" />
          ) : (
            <span className="home-avatar-placeholder">{username[0].toUpperCase()}</span>
          )}
        </div>
        <div className="home-profile-info">
          <div className="home-username">Привет, <b>{username}</b>! 👋</div>
          <div className={`home-status ${isOnline ? "online" : "offline"}`}>
            {isOnline ? "Онлайн" : "Оффлайн"}
          </div>
        </div>
      </div>
      <div className="home-tips-block">
        <h2>Советы и подсказки</h2>
        <ul className="home-tips-list">
          {tips.map((tip, idx) => (
            <li key={idx} className="home-tip-item">
              <span className="home-tip-icon">{tip.icon}</span>
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 