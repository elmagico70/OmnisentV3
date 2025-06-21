import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Forzar modo oscuro por defecto
document.documentElement.classList.add("dark");

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("No se encontró el elemento #root en el DOM.");
}