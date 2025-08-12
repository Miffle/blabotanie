// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './i18n';

window.global = window;

try {
    const rootEl = document.getElementById("root");
    if (!rootEl) throw new Error("#root element not found!");

    ReactDOM.createRoot(rootEl).render(
        <React.StrictMode>
            <App/>
        </React.StrictMode>
    );
} catch (e) {
    console.error("Render error:", e);
}