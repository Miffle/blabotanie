// @ts-ignore
import React from 'react';
import "../styles/home.css"
import {useTranslation} from "react-i18next";

export default function HomePage() {
    const {t} = useTranslation();
    const username = localStorage.getItem("username") || "Гость";

    return (
        <div className="homepage">
            <div className="welcome-block">
                <h1 className="fade-in">{t("mainPage.hi", {username: username})}</h1>
                <p className="subtitle fade-in">{t("mainPage.whereAreYou")}</p>
            </div>
        </div>
    );
}
