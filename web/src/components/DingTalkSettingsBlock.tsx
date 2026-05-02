import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/cn";

export type DingTalkEnvSnapshot = {
  configured: boolean;
  hasClientId?: boolean;
  hasClientSecret?: boolean;
  clientIdHint?: string | null;
};

const btnClass =
  "rounded-lg border border-zinc-300/90 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 active:scale-[0.98] active:bg-zinc-100/80 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-800/90";

const inputClass =
  "w-full rounded-lg border border-zinc-300/90 bg-white/90 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900/90";

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
          <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 px-3 py-2.5 text-sm dark:border-zinc-700/80 dark:bg-zinc-900/40">
            <p className="text-zinc-600 dark:text-zinc-400">{t("settings.dingtalkNotConfigured")}</p>
          </div>
          <button type="button" className={btnClass} onClick={() => setShowForm(true)}>
            {t("settings.dingtalkSetup")}
          </button>
        </>
      ) : null}

      {env?.configured && !showForm ? (
        <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/60 px-3 py-2.5 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/35">
          <p className="font-medium text-emerald-900 dark:text-emerald-100">{t("settings.dingtalkAlreadyTitle")}</p>
          {env.clientIdHint ? (
            <p className="mt-1.5 font-mono text-xs text-emerald-950/90 dark:text-emerald-50/90">
              {t("settings.dingtalkClientIdHint", { hint: env.clientIdHint })}
            </p>
          ) : null}
        </div>
      ) : null}

      {env?.configured && !showForm ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnClass} onClick={() => setShowForm(true)}>
            {t("settings.dingtalkReconfigure")}
          </button>
          <button type="button" className={btnClass} onClick={() => void handleRemove()} disabled={removing}>
            {removing ? "…" : t("settings.telegramRemoveConfig")}
          </button>
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
            <button type="button" className={btnClass} onClick={() => void saveConfig()} disabled={saving || !clientId.trim() || !clientSecret.trim()}>
              {saving ? "…" : t("settings.dingtalkFormSave")}
            </button>
            <button type="button" className={btnClass} onClick={() => { setShowForm(false); setError(null); setClientId(""); setClientSecret(""); }}>
              {t("settings.dingtalkFormCancel")}
            </button>
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{t("settings.dingtalkFormError", { msg: error })}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
