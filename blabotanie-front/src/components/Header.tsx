import {Link, useLocation} from 'react-router-dom';
import {useAuth} from "../context/AuthContext.js";
import "@/styles/Header.css";
import {useTranslation} from "react-i18next";
import { useDockSettings } from "../context/DockSettingsContext";

export default function Header({incomingRequestsCount = 0}) {
    const {t} = useTranslation();
    const {logout} = useAuth();
    const location = useLocation();
    const { autoHideDock } = useDockSettings();
    return (
        <div>
            {autoHideDock && <div className="trigger-zone" />}
            <div className={`dock ${!autoHideDock ? "fixed" : ""}`}>
                <nav className="dock__nav">
                    <Link to="/" className={location.pathname === "/" ? "active" : ""}>{t("header.main")}</Link>
                    <Link to="/friends" className={location.pathname === "/friends" ? "active" : ""}>
                        {t("header.friends")}{incomingRequestsCount > 0 && <span className="dot"/>}
                    </Link>
                    <Link to="/calls" className={location.pathname === "/calls" ? "active" : ""}>{t("header.calls")}</Link>
                    <Link to={`/profile/${localStorage.getItem("uuid")}`} className={location.pathname === `/profile/${localStorage.getItem("uuid")}` ? "active" : ""}>{t("header.profile")}</Link>
                    <Link to="/settings" className={location.pathname === "/settings" ? "active" : ""}>{t("header.settings")}</Link>
                    <button className="dock__logout" onClick={logout}>{t("header.logout")}</button>
                </nav>
            </div>
        </div>
    );
}
