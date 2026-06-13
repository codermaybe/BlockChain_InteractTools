import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppSettingsProvider } from "./state/AppSettingsContext";
import { TaskLogProvider } from "./state/TaskLogContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppSettingsProvider>
      <TaskLogProvider>
        <App />
      </TaskLogProvider>
    </AppSettingsProvider>
  </React.StrictMode>
);
