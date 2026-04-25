import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { I18nProvider } from "./lib/i18n";
import { Wizard } from "./onboarding/Wizard";
import { Settings } from "./advanced/Settings";
import { Splash } from "./Splash";
import { ChatPage } from "./chat/ChatPage";
import { applyFontSize } from "./lib/ui-prefs";
import "./index.css";

applyFontSize();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding/*" element={<Wizard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>
);
