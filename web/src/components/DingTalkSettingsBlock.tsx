import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/cn";
import { StatusBanner } from "./ui/StatusBanner";
import { PlatformButton } from "./ui/PlatformButton";

export type DingTalkEnvSnapshot = {
  configured: boolean;
  hasClientId?: boolean;
  hasClientSecret?: boolean;
  clientIdHint?: string | null;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300/90 bg-white/90 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900/90 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400/60 transition";

export function DingTalkSettingsBlock({ className }: { className?: string }) {
  const { t } = useI18n();
  const [env, setEnv] = useState<DingTalkEnvSnapshot | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [removing, setRemoving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const snap = await invoke<DingTalkEnvSnapshot>("cmd_dingtalk_env_status");
      setEnv(snap);
    } catch {
      setEnv(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function saveConfig() {
    const cid = clientId.trim();
    const csec = clientSecret.trim();
    if (!cid || !csec) return;
    setSaving(true);
    setError(null);
    try {
      await invoke("cmd_dingtalk_save_config", { clientId: cid, clientSecret: csec });
      await invoke<number>("cmd_restart_embedded_hermes");
      setShowForm(false);
      setClientId("");
      setClientSecret("");
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
      await invoke("cmd_dingtalk_env_remove");
      await invoke<number>("cmd_restart_embedded_hermes");
      setShowForm(false);
      void refresh();
    } catch {
      void refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className={cn("w-full min-w-0 space-y-3", className)}>
      {!env?.configured && !showForm ? (
        <>
          <StatusBanner variant="neutral" title={t("settings.dingtalkNotConfigured")} />
          <PlatformButton onClick={() => setShowForm(true)}>
            {t("settings.dingtalkSetup")}
          </PlatformButton>
        </>
      ) : null}

      {env?.configured && !showForm ? (
        <StatusBanner variant="success" title={t("settings.dingtalkAlreadyTitle")}>
          {env.clientIdHint ? (
            <p className="font-mono">{t("settings.dingtalkClientIdHint", { hint: env.clientIdHint })}</p>
          ) : null}
        </StatusBanner>
      ) : null}

      {env?.configured && !showForm ? (
        <div className="flex flex-wrap items-center gap-2">
          <PlatformButton onClick={() => setShowForm(true)}>
            {t("settings.dingtalkReconfigure")}
          </PlatformButton>
          <PlatformButton variant="danger" onClick={() => void handleRemove()} disabled={removing}>
            {removing ? "…" : t("settings.telegramRemoveConfig")}
          </PlatformButton>
        </div>
      ) : null}

      {showForm ? (
        <div className="space-y-3 rounded-lg border border-sky-200/80 bg-sky-50/50 px-3 py-3 dark:border-sky-800/50 dark:bg-sky-950/25">
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("settings.dingtalkFormLead")}
          </p>
          <input
            className={inputClass}
            type="text"
            value={clientId}
            placeholder={t("settings.dingtalkClientIdPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setClientId(e.target.value)}
          />
          <input
            className={inputClass}
            type="password"
            value={clientSecret}
            placeholder={t("settings.dingtalkClientSecretPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setClientSecret(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void saveConfig();
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <PlatformButton variant="primary" onClick={() => void saveConfig()} disabled={saving || !clientId.trim() || !clientSecret.trim()}>
              {saving ? "…" : t("settings.dingtalkFormSave")}
            </PlatformButton>
            <PlatformButton onClick={() => { setShowForm(false); setError(null); setClientId(""); setClientSecret(""); }}>
              {t("settings.dingtalkFormCancel")}
            </PlatformButton>
          </div>
          {error ? (
            <StatusBanner variant="error" title={t("settings.dingtalkFormError", { msg: error })} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
