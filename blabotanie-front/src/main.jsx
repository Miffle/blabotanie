// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import './i18n';

window.global = window;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
