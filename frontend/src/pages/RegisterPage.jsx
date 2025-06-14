import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import "../styles/login.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      await register(username, password);
      navigate("/"); // После регистрации – на страницу входа
      window.location.reload();
    } catch (e) {
      setError("Ошибка регистрации");
    }
  };

  return (
    <div className="login-container">
      <div className="auth-form">
        <h1>Регистрация</h1>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Логин"
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
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Зарегистрироваться</button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <button 
          className="secondary-button" 
          onClick={() => navigate("/auth")}
        >
          Назад к входу
        </button>
      </div>
    </div>
  );
}
