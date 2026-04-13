import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppSettingsProvider } from "./lib/appSettings";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppSettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppSettingsProvider>
  </React.StrictMode>
);
