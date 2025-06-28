// @ts-ignore
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import "../styles/auth.css";
import {useTranslation} from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const {t} = useTranslation();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            setError("Пароли не совпадают");
            return;
        }

        try {
            await register(username, password);
            navigate('/');
        } catch (e) {
            setError('Ошибка регистрации');
        }
    };

    const handleBack = () => {
        navigate('/login');
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>{t("auth.register")}</h2>
                <input
                    placeholder={t("auth.username")}
                    value={username}
                    autoComplete={"off"}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    autoComplete={"off"}
                    placeholder={t("auth.password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    type="password"
                    autoComplete={"off"}
                    placeholder={t("auth.passwordConfirmation")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && <p className="auth-error">{error}</p>}
                <button onClick={handleRegister}>{t("auth.registerButton")}</button>
                <button className="secondary" onClick={handleBack}>{t("auth.back")}</button>
            </div>
            <LanguageSwitcher />
        </div>
    );
}
