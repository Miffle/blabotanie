// @ts-ignore
import React, {useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import '../styles/auth.css';
import {useTranslation} from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
    const {login} = useAuth();
    const navigate = useNavigate();
    const {t} = useTranslation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            await login(username, password);
            navigate('/');
        } catch (e) {
            setError('Неверный логин или пароль');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>
                    {t("auth.login")}
                </h2>
                <input
                    placeholder={t("auth.username")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder={t("auth.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="auth-error">{error}</p>}
                <button onClick={handleLogin}>
                    {t("auth.loginButton")}
                </button>
                <button className="secondary" onClick={() => navigate('/register')}>
                    {t("auth.registerButton")}
                </button>
            </div>
            <LanguageSwitcher/>
        </div>
    );
}
