import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WindowTitleBar } from "./components/WindowTitleBar";
import { I18nProvider } from "./lib/i18n";
import { Wizard } from "./onboarding/Wizard";
import { Settings } from "./advanced/Settings";
import { Export } from "./advanced/Export";
import { Splash } from "./Splash";
import { ChatPage } from "./chat/ChatPage";
import { TelegramPage } from "./advanced/pages/TelegramPage";
import { FeishuPage } from "./advanced/pages/FeishuPage";
import { CapabilitiesPage } from "./advanced/pages/CapabilitiesPage";
import { QqPage } from "./advanced/pages/QqPage";
import { WeixinPage } from "./advanced/pages/WeixinPage";
import { DingTalkPage } from "./advanced/pages/DingTalkPage";
import { WeComPage } from "./advanced/pages/WeComPage";
import { EmailPage } from "./advanced/pages/EmailPage";
import { applyFontSize } from "./lib/ui-prefs";
import "./index.css";

applyFontSize();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <div className="flex h-full min-h-0 flex-col">
          <WindowTitleBar />
          <div className="min-h-0 flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/onboarding/*" element={<Wizard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/capabilities" element={<CapabilitiesPage />} />
              <Route path="/export" element={<Export />} />
              <Route path="/settings/telegram" element={<TelegramPage />} />
              <Route path="/settings/feishu" element={<FeishuPage />} />
              <Route path="/settings/qq" element={<QqPage />} />
              <Route path="/settings/weixin" element={<WeixinPage />} />
              <Route path="/settings/dingtalk" element={<DingTalkPage />} />
              <Route path="/settings/wecom" element={<WeComPage />} />
              <Route path="/settings/email" element={<EmailPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>
);
