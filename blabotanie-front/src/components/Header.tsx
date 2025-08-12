import {Link, useLocation, useNavigate} from 'react-router-dom';
import "@/styles/Header.css";
import {useTranslation} from "react-i18next";
import {useDockSettings} from "../context/DockSettingsContext";
import {useHotkeys} from 'react-hotkeys-hook';

export default function Header({incomingRequestsCount = 0}) {
    const {t} = useTranslation();
    const location = useLocation();
    const uuid = localStorage.getItem("uuid");
    const {autoHideDock} = useDockSettings();
    const navigate = useNavigate();

    useHotkeys('ctrl+1', () => {
        navigate("/");
        console.log('Used hotkey, navigate to mainPage');
    });
    useHotkeys('ctrl+2', () => {
        navigate("/friends");
        console.log('Used hotkey, navigate to friendsPage');
    });
    useHotkeys('ctrl+3', () => {
        navigate("/calls");
        console.log('Used hotkey, navigate to callsPage');
    });
    useHotkeys('ctrl+4', () => {
        navigate(`/profile/${uuid}`);
        console.log('Used hotkey, navigate to profilePage');
    });
    useHotkeys('ctrl+5', () => {
        navigate("/settings");
        console.log('Used hotkey, navigate to settingsPage');
    });
    return (
        <div>
            {autoHideDock && <div className="trigger-zone"/>}
            <div className={`dock ${!autoHideDock ? "fixed" : ""}`}>
                <nav className="dock__nav">
                    <Link to="/" className={location.pathname === "/" ? "active" : ""}>{t("header.main")}</Link>
                    <Link to="/friends" className={location.pathname === "/friends" ? "active" : ""}>
                        {t("header.friends")}{incomingRequestsCount > 0 && <span className="dot"/>}
                    </Link>
                    <Link to="/calls"
                          className={location.pathname === "/calls" ? "active" : ""}>{t("header.calls")}</Link>
                    <Link to={`/profile/${uuid}`}
                          className={location.pathname === `/profile/${localStorage.getItem("uuid")}` ? "active" : ""}>{t("header.profile")}</Link>
                    <Link to="/settings"
                          className={location.pathname === "/settings" ? "active" : ""}>{t("header.settings")}</Link>
                </nav>
            </div>
        </div>
    );
}
