import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import "../styles/login.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(username, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("username", data.username);
      navigate("/"); // переход на главную
      window.location.reload();
    } catch (e) {
      setError("Неверный логин или пароль");
    }
  };

  return (
    <div className="login-container">
      <div className="auth-form">
        <h1>Вход</h1>
        <form onSubmit={handleLogin}>
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
          <button type="submit">Войти</button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <button 
          className="secondary-button" 
          onClick={() => navigate("/register")}
        >
          Регистрация
        </button>
      </div>
    </div>
  );
}
