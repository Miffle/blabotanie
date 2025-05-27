// src/components/AuthForm.jsx
import { useState } from "react";

export default function AuthForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: авторизация через API
    console.log("Авторизация:", { username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <input
        type="text"
        placeholder="Имя пользователя"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Войти</button>
    </form>
  );
}
