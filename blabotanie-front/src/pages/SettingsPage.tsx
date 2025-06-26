// @ts-ignore
import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

export default function SettingsPage() {
    const { t } = useTranslation();

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = e.target.value;
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
    };

    return (
        <div style={{ padding: '24px' }}>
            <h2>{t('settings.title')}</h2>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {t('settings.language')}:
                <select
                    defaultValue={i18n.language}
                    onChange={handleLanguageChange}
                >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                </select>
            </label>
        </div>
    );
}
