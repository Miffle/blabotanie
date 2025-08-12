import React from 'react';
import {useTranslation} from 'react-i18next';
import i18n from 'i18next';
import {useAudioDevices} from '../context/AudioDeviceContext';
import '../styles/settings.css'; // подключаем CSS
import {useDockSettings} from "../context/DockSettingsContext";
import {useAuth} from "../context/AuthContext";

export default function SettingsPage() {
    const {t} = useTranslation();
    const {autoHideDock, toggleDockBehavior} = useDockSettings();
    const {logout} = useAuth();
    const {
        inputDevices,
        outputDevices,
        selectedInputId,
        selectedOutputId,
        setInputId,
        setOutputId
    } = useAudioDevices();

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = e.target.value;
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
    };

    return (
        <div className="settings-container">
            <h2>{t('settings.title')}</h2>

            <div className="settings-row">
                <label className="settings-label">{t('settings.language')}:</label>
                <select
                    defaultValue={i18n.language}
                    onChange={handleLanguageChange}
                    className="settings-select"
                >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                </select>
            </div>

            <div className="settings-row">
                <label className="settings-label">{t('settings.microphone')}</label>
                <select
                    value={selectedInputId ?? ''}
                    onChange={e => setInputId(e.target.value)}
                    className="settings-select"
                >
                    {inputDevices.map(dev => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                            {dev.label || `Микрофон (${dev.deviceId})`}
                        </option>
                    ))}
                </select>
            </div>

            <div className="settings-row">
                <label className="settings-label">{t('settings.headphones')}</label>
                <select
                    value={selectedOutputId ?? ''}
                    onChange={e => setOutputId(e.target.value)}
                    className="settings-select"
                >
                    {outputDevices.map(dev => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                            {dev.label || `Динамик (${dev.deviceId})`}
                        </option>
                    ))}
                </select>
            </div>
            <div className="settings-row">
                <div>
                    <label className="settings-label">{t('settings.autoClosingPanel')}</label>
                    <input
                        type="checkbox"
                        checked={autoHideDock}
                        onChange={(e) => toggleDockBehavior(e.target.checked)}
                    />
                </div>
            </div>
            <div className="settings-row">
                <div>
                    <button className="dock__logout" onClick={logout}>{t("header.logout")}</button>
                </div>
            </div>
        </div>
    );
}
