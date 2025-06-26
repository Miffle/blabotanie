// @ts-ignore
import React from 'react';
import i18n from 'i18next';

export default function LanguageSwitcher() {
    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '12px',
            left: '12px',
            fontSize: '0.9rem',
            zIndex: 1000
        }}>
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    background: 'white',
                    fontSize: '0.9rem'
                }}
            >
                <option value="ru">Русский</option>
                <option value="en">English</option>
            </select>
        </div>
    );
}
