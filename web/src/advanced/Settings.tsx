import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { AppScaffold } from "../components/AppScaffold";
import { LanguageToggle } from "../components/LanguageToggle";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/cn";
import { type FontSizeOption, getStoredFontSize, setFontSize } from "../lib/ui-prefs";

interface Status {
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
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => getStoredFontSize());

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
    })().catch(console.error);
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
    setStatus((s) => (s ? { ...s, hasSecret: false } : s));
  }

  return (
    <AppScaffold className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 px-[var(--hd-page-pad-x)] py-10 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => nav("/chat")}
              className="mb-4 text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {t("settings.back")}
            </button>
            <h1 className="hd-page-title">{t("settings.title")}</h1>
          </div>
          <LanguageToggle className="shrink-0 self-end sm:self-start" />
        </div>

        <aside
          className="hd-glass-subtle space-y-3 p-5 sm:p-6"
          aria-label={t("settings.hermesTitle")}
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t("settings.hermesTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("settings.hermesDesc")}
          </p>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
            {t("settings.hermesPaths")}
          </p>
        </aside>

        <Section title={t("settings.fontTitle")} desc={t("settings.fontDesc")}>
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 gap-0.5 w-full sm:w-auto">
            {(
              [
                { id: "small" as const, label: t("settings.fontSmall") },
                { id: "medium" as const, label: t("settings.fontMedium") },
                { id: "large" as const, label: t("settings.fontLarge") },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setFontSize(id);
                  setFontSizeState(id);
                }}
                className={
                  "flex-1 sm:flex-initial rounded-md px-3 py-1.5 text-sm transition " +
                  (fontSize === id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          title={t("settings.secWorkspace")}
          desc={powerUser ? t("settings.secWorkspaceDescPower") : t("settings.secWorkspaceDescSimple")}
        >
          {powerUser ? (
            <>
              <code className="text-xs break-all">{status?.workspace ?? "\u2026"}</code>
              <Button onClick={() => invoke("cmd_open_workspace")}>{t("settings.openFolder")}</Button>
            </>
          ) : null}
        </Section>

        <Section
          title={t("settings.secPass")}
          desc={status?.hasSecret ? t("settings.passOn") : t("settings.passOff")}
        >
          <Button onClick={clearKey} disabled={!status?.hasSecret}>
            {t("settings.signOut")}
          </Button>
        </Section>

        <Section title={t("settings.powerTitle")} desc={t("settings.powerDesc")}>
          <Toggle value={powerUser} onChange={togglePowerUser} />
        </Section>

        <Section title={t("settings.recipeTitle")} desc={t("settings.recipeDesc")}>
          <Toggle value={showRecipeMarket} onChange={toggleRecipeMarket} />
        </Section>

        <Section title={t("settings.status")}>
          <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400 w-full">
            <li>
              {t("settings.pyRunning")}: {status?.pythonRunning ? t("settings.yes") : t("settings.no")}
            </li>
            <li>
              {t("settings.hasPass")}: {status?.hasSecret ? t("settings.yes") : t("settings.no")}
            </li>
          </ul>
        </Section>
      </div>
    </AppScaffold>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="hd-glass space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {desc && <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{desc}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-[var(--radius-shell)] border border-zinc-300/90 px-3 py-1.5 text-sm transition",
        "hover:bg-zinc-100/80 dark:border-zinc-700 dark:hover:bg-zinc-800/80",
        "disabled:opacity-50",
        className
      )}
    />
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={
        "relative inline-flex h-6 w-11 items-center rounded-full transition " +
        (value ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700")
      }
    >
      <span
        className={
          "inline-block h-4 w-4 transform rounded-full bg-white transition " +
          (value ? "translate-x-6" : "translate-x-1")
        }
      />
    </button>
  );
}
