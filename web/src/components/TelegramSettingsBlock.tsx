import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/cn";
import { StatusBanner } from "./ui/StatusBanner";
import { PlatformButton } from "./ui/PlatformButton";

export type TelegramEnvSnapshot = {
  configured: boolean;
  hasBotToken?: boolean;
  orphanTelegramConfig?: boolean;
  tokenHint?: string | null;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300/90 bg-white/90 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900/90 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400/60 transition";

export function TelegramSettingsBlock({ className }: { className?: string }) {
  const { t } = useI18n();
  const [env, setEnv] = useState<TelegramEnvSnapshot | null>(null);
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [removing, setRemoving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const snap = await invoke<TelegramEnvSnapshot>("cmd_telegram_env_status");
      setEnv(snap);
    } catch {
      setEnv(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function saveToken() {
    const val = token.trim();
    if (!val) return;
    setSaving(true);
    setError(null);
    try {
      await invoke("cmd_telegram_save_token", { token: val });
      await invoke<number>("cmd_restart_embedded_hermes");
      setShowForm(false);
      setToken("");
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    const ok = await ask(t("settings.removeConfigAsk"), {
      title: t("settings.removeConfigAskTitle"),
      kind: "warning",
    });
    if (!ok) return;
    setRemoving(true);
    try {
      await invoke("cmd_telegram_remove_config");
      await invoke<number>("cmd_restart_embedded_hermes");
      setShowForm(false);
      void refresh();
    } catch {
      // Silently refresh on error too — env file may have been partially cleared
      void refresh();
    } finally {
      setRemoving(false);
    }
  }

  const partial = env && !env.configured && (env.orphanTelegramConfig ?? false);

  return (
    <div className={cn("w-full min-w-0 space-y-3", className)}>
      {!env?.configured && !showForm ? (
        <>
          <StatusBanner variant="neutral" title={t("settings.telegramNotConfigured")} />
          <PlatformButton onClick={() => setShowForm(true)}>
            {t("settings.telegramSetup")}
          </PlatformButton>
        </>
      ) : null}

      {partial && !showForm ? (
        <StatusBanner variant="warning" title={t("settings.telegramPartialTitle")}>
          {t("settings.telegramPartialLead")}
        </StatusBanner>
      ) : null}

      {env?.configured && !showForm ? (
        <StatusBanner variant="success" title={t("settings.telegramAlreadyTitle")}>
          {env.tokenHint ? (
            <p className="font-mono">{t("settings.telegramTokenHint", { hint: env.tokenHint })}</p>
          ) : null}
        </StatusBanner>
      ) : null}

      {env?.configured && !showForm ? (
        <div className="flex flex-wrap items-center gap-2">
          <PlatformButton onClick={() => setShowForm(true)}>
            {t("settings.telegramReconfigure")}
          </PlatformButton>
          <PlatformButton variant="danger" onClick={() => void handleRemove()} disabled={removing}>
            {removing ? "…" : t("settings.telegramRemoveConfig")}
          </PlatformButton>
        </div>
      ) : null}

      {showForm ? (
        <div className="space-y-3 rounded-lg border border-sky-200/80 bg-sky-50/50 px-3 py-3 dark:border-sky-800/50 dark:bg-sky-950/25">
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("settings.telegramFormLead")}
          </p>
          <input
            className={inputClass}
            type="password"
            value={token}
            placeholder={t("settings.telegramFormPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void saveToken();
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <PlatformButton variant="primary" onClick={() => void saveToken()} disabled={saving || !token.trim()}>
              {saving ? t("settings.telegramFormSaving") : t("settings.telegramFormSave")}
            </PlatformButton>
            <PlatformButton onClick={() => { setShowForm(false); setError(null); setToken(""); }}>
              {t("settings.telegramFormCancel")}
            </PlatformButton>
          </div>
          {error ? (
            <StatusBanner variant="error" title={t("settings.telegramFormError", { msg: error })} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
