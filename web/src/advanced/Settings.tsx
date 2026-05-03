import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { AppScaffold } from "../components/AppScaffold";
import { useI18n } from "../lib/i18n";
import { getLocale } from "../lib/i18n-core";
import { cmdGetHermesPort } from "../chat/chat-api";
import { useFontSize } from "../lib/ui-prefs";
import { clearAllowChatWithoutApi } from "../lib/apiKeyGate";
import { useGatewayStatus } from "../features/gateway/useGatewayStatus";
import { SettingsLLM } from "./settings/SettingsLLM";
import { SettingsGateway } from "./settings/SettingsGateway";
import { SettingsDisplay } from "./settings/SettingsDisplay";

type ProxyStatusResponse = {
  system: { url: string | null; enabled: boolean };
  settings: { useSystem: boolean; customUrl: string | null };
  effectiveUrl: string | null;
};

export interface Status {
  workspace: string;
  hasSecret: boolean;
  pythonRunning: boolean;
}

export function Settings() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [status, setStatus] = useState<Status | null>(null);
  const [powerUser, setPowerUser] = useState(false);
  const [showRecipeMarket, setShowRecipeMarket] = useState(false);
  const { size: fontSize, setSize: setFontSize } = useFontSize();
  const [autoStartGateway, setAutoStartGateway] = useState(true);
  const gatewayStatus = useGatewayStatus();

  // Proxy settings
  const [proxyDetected, setProxyDetected] = useState<string | null>(null);
  const [proxyUseSystem, setProxyUseSystem] = useState(false);
  const [proxyCustom, setProxyCustom] = useState("");
  const [proxySaving, setProxySaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [workspace, hasSecret, pyStat] = await Promise.all([
        invoke<string>("cmd_workspace_path"),
        invoke<boolean>("cmd_has_secret"),
        invoke<{ running: boolean }>("cmd_python_status"),
      ]);
      setStatus({ workspace, hasSecret, pythonRunning: pyStat.running });
      try {
        const v = await invoke<boolean>("cmd_get_power_user");
        setPowerUser(!!v);
      } catch {
        /* optional */
      }
      try {
        const m = await invoke<boolean>("cmd_get_show_recipe_market");
        setShowRecipeMarket(!!m);
      } catch {
        /* optional */
      }
      try {
        const ag = await invoke<boolean>("cmd_get_auto_start_gateway");
        setAutoStartGateway(!!ag);
      } catch {
        /* optional */
      }
      try {
        const ps = await invoke<ProxyStatusResponse>("cmd_proxy_status");
        setProxyDetected(ps.system.url);
        setProxyUseSystem(!!ps.settings.useSystem);
        setProxyCustom(ps.settings.customUrl ?? "");
      } catch {
        /* optional */
      }
    })().catch(console.error);
  }, []);

  async function toggleAutoStartGateway(next: boolean) {
    try {
      await invoke("cmd_set_auto_start_gateway", { enabled: next });
      setAutoStartGateway(next);
    } catch (e) {
      console.error(e);
    }
  }

  const saveProxy = useCallback(async () => {
    setProxySaving(true);
    try {
      const custom = proxyCustom.trim();
      await invoke("cmd_proxy_save", {
        useSystem: proxyUseSystem,
        customUrl: custom || null,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setProxySaving(false);
    }
  }, [proxyUseSystem, proxyCustom]);

  const clearProxy = useCallback(() => {
    setProxyUseSystem(false);
    setProxyCustom("");
    void saveProxy();
  }, [saveProxy]);

  const openHermesConsole = useCallback(async (subPath?: string | null) => {
    const loc = getLocale();
    const path =
      subPath && subPath.trim() && subPath.trim() !== "/"
        ? subPath.trim().startsWith("/")
          ? subPath.trim()
          : `/${subPath.trim()}`
        : null;
    try {
      await invoke("cmd_open_hermes_dashboard", { shellLocale: loc, path });
    } catch (e) {
      console.error(e);
      try {
        const port = await cmdGetHermesPort();
        if (port) {
          const u = new URL(`http://127.0.0.1:${port}/`);
          if (path) {
            u.pathname = path;
          }
          if (loc === "en" || loc === "zh") {
            u.searchParams.set("hermesdesk_lang", loc);
          }
          window.open(u.toString(), "_blank", "noopener,noreferrer");
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  async function toggleRecipeMarket(next: boolean) {
    try {
      await invoke("cmd_set_show_recipe_market", { enabled: next });
      setShowRecipeMarket(next);
    } catch (e) {
      console.error(e);
    }
  }

  async function togglePowerUser(next: boolean) {
    if (next) {
      const ok = await ask(t("settings.powerAsk"), {
        title: t("settings.powerAskTitle"),
        kind: "warning",
      });
      if (!ok) return;
    }
    try {
      await invoke("cmd_set_power_user", { enabled: next });
      setPowerUser(next);
    } catch (e) {
      console.error(e);
    }
  }

  async function clearKey() {
    const ok = await ask(t("settings.signOutAsk"), {
      title: t("settings.signOutTitle"),
      kind: "warning",
    });
    if (!ok) return;
    await invoke("cmd_clear_secret");
    clearAllowChatWithoutApi();
    setStatus((s) => (s ? { ...s, hasSecret: false } : s));
  }

  return (
    <AppScaffold className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-5 px-[var(--hd-page-pad-x)] py-8 sm:py-10">
        <div>
          <button
            type="button"
            onClick={() => nav("/chat")}
            className="mb-2 text-sm text-zinc-500 underline-offset-4 transition hover:text-zinc-800 active:scale-[0.99] dark:text-zinc-500 dark:hover:text-zinc-200"
          >
            {t("settings.back")}
          </button>
          <h1 className="hd-page-title">{t("settings.title")}</h1>
          {t("settings.pageLead") && (
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("settings.pageLead")}
            </p>
          )}
        </div>

        <SettingsLLM
          proxyDetected={proxyDetected}
          proxyUseSystem={proxyUseSystem}
          setProxyUseSystem={setProxyUseSystem}
          proxyCustom={proxyCustom}
          setProxyCustom={setProxyCustom}
          proxySaving={proxySaving}
          onSaveProxy={saveProxy}
          onClearProxy={clearProxy}
          hasSecret={status?.hasSecret}
          onClearKey={clearKey}
          onOpenConsole={openHermesConsole}
        />

        <SettingsGateway
          gatewayStatus={gatewayStatus}
          autoStartGateway={autoStartGateway}
          onToggleAutoStart={toggleAutoStartGateway}
          onOpenConsole={openHermesConsole}
          onStatusChange={setStatus}
          status={status}
        />

        <SettingsDisplay
          status={status}
          powerUser={powerUser}
          onTogglePowerUser={togglePowerUser}
          showRecipeMarket={showRecipeMarket}
          onToggleRecipeMarket={toggleRecipeMarket}
          fontSize={fontSize}
          onSetFontSize={setFontSize}
          gatewayRunning={gatewayStatus.running}
        />
      </div>
    </AppScaffold>
  );
}
