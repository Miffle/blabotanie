import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import { useWebSocket } from "../context/WebSocketContext";

export default function Header({ incomingRequestsCount = 0 }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeCall, disconnectWebSocket } = useWebSocket();
  const logout = () => {
    disconnectWebSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    navigate("/auth");
  }

  return (
    <header className="header">
      <nav className="header__nav">
        <Link className={location.pathname === "/" ? "active" : ""} to="/">Blabotanie</Link>
        <Link className={location.pathname === "/friends" ? "active" : ""} to="/friends">
          👥 Друзья{incomingRequestsCount > 0 && <span className="badge">+{incomingRequestsCount}</span>}
        </Link>
        <Link className={location.pathname === "/calls" ? "active" : ""} to="/calls">📞 Звонки</Link>
        {activeCall && location.pathname !== "/call" && (
          <button className="current-call-btn" onClick={() => navigate("/call")}>Текущий звонок</button>
        )}
      </nav>
      <div className="header__user-block">
        <button className="profile-btn">{localStorage.getItem("username")}</button>
        <button className="logout" onClick={logout}>Выйти</button>
      </div>
    </header>
  );
}
