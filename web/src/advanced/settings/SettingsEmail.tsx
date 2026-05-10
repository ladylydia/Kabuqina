import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/cn";

export type EmailEnvSnapshot = {
  configured: boolean;
  hasAddress?: boolean;
  hasPassword?: boolean;
  hasImapHost?: boolean;
  hasSmtpHost?: boolean;
  addressHint?: string | null;
};

const btnClass =
  "rounded-lg border border-zinc-300/90 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 active:scale-[0.98] active:bg-zinc-100/80 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-800/90";

const inputClass =
  "w-full rounded-lg border border-zinc-300/90 bg-white/90 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900/90";

export function SettingsEmailBlock({ className }: { className?: string }) {
  const { t } = useI18n();
  const [env, setEnv] = useState<EmailEnvSnapshot | null>(null);
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [removing, setRemoving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const snap = await invoke<EmailEnvSnapshot>("cmd_email_env_status");
      setEnv(snap);
    } catch {
      setEnv(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function saveConfig() {
    const addr = address.trim();
    const pass = password.trim();
    const imap = imapHost.trim();
    const smtp = smtpHost.trim();
    if (!addr || !pass || !imap || !smtp) return;
    setSaving(true);
    setError(null);
    try {
      await invoke("cmd_email_save_config", {
        address: addr,
        password: pass,
        imapHost: imap,
        smtpHost: smtp,
      });
      setShowForm(false);
      setAddress("");
      setPassword("");
      setImapHost("");
      setSmtpHost("");
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
      await invoke("cmd_email_env_remove");
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
            <p className="text-zinc-600 dark:text-zinc-400">{t("settings.emailNotConfigured")}</p>
          </div>
          <button type="button" className={btnClass} onClick={() => setShowForm(true)}>
            {t("settings.emailSetup")}
          </button>
        </>
      ) : null}

      {env?.configured && !showForm ? (
        <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/60 px-3 py-2.5 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/35">
          <p className="font-medium text-emerald-900 dark:text-emerald-100">{t("settings.emailAlreadyTitle")}</p>
          {env.addressHint ? (
            <p className="mt-1.5 font-mono text-xs text-emerald-950/90 dark:text-emerald-50/90">
              {t("settings.emailAddressHint", { hint: env.addressHint })}
            </p>
          ) : null}
        </div>
      ) : null}

      {env?.configured && !showForm ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btnClass} onClick={() => setShowForm(true)}>
            {t("settings.emailReconfigure")}
          </button>
          <button type="button" className={btnClass} onClick={() => void handleRemove()} disabled={removing}>
            {removing ? "…" : t("settings.emailRemoveConfig")}
          </button>
        </div>
      ) : null}

      {showForm ? (
        <div className="space-y-3 rounded-lg border border-sky-200/80 bg-sky-50/50 px-3 py-3 dark:border-sky-800/50 dark:bg-sky-950/25">
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("settings.emailFormLead")}
          </p>
          <input
            className={inputClass}
            type="text"
            value={address}
            placeholder={t("settings.emailAddressPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setAddress(e.target.value)}
          />
          <input
            className={inputClass}
            type="password"
            value={password}
            placeholder={t("settings.emailPasswordPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className={inputClass}
            type="text"
            value={imapHost}
            placeholder={t("settings.emailImapPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setImapHost(e.target.value)}
          />
          <input
            className={inputClass}
            type="text"
            value={smtpHost}
            placeholder={t("settings.emailSmtpPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setSmtpHost(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={btnClass}
              onClick={() => void saveConfig()}
              disabled={saving || !address.trim() || !password.trim() || !imapHost.trim() || !smtpHost.trim()}
            >
              {saving ? "…" : t("settings.emailFormSave")}
            </button>
            <button type="button" className={btnClass} onClick={() => { setShowForm(false); setError(null); setAddress(""); setPassword(""); setImapHost(""); setSmtpHost(""); }}>
              {t("settings.emailFormCancel")}
            </button>
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{t("settings.emailFormError", { msg: error })}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
