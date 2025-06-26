// @ts-ignore
import React from 'react';
import { useAuth } from '../context/AuthContext';
import "../styles/home.css"
import {useTranslation} from "react-i18next";

const tips = [
    "mainPage.chooseFriend",
    "mainPage.addFriend",
    "mainPage.notificationAboutRequests",
    "mainPage.dataSecured",
];

export default function HomePage() {
    const {t} = useTranslation();
    const username = localStorage.getItem("username") || "Гость";

    return (
        <div className="homepage">
            <div className="welcome-block">
                <h1 className="fade-in">{t("mainPage.hi", {username: username})}</h1>
                <p className="subtitle fade-in">{t("mainPage.whereAreYou")}</p>
            </div>

            <div className="tips-block fade-in">
                <h2>{t("mainPage.whatNext")}</h2>
                <ul>
                    {tips.map((text, idx) => (
                        <li key={idx}>{t(text)}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
