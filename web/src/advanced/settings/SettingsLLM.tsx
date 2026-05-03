import { useI18n } from "../../lib/i18n";
import { Globe, KeyRound, LayoutDashboard } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Section } from "../../components/ui/Section";
import { Toggle } from "../../components/ui/Toggle";

interface Props {
  proxyDetected: string | null;
  proxyUseSystem: boolean;
  setProxyUseSystem: (v: boolean) => void;
  proxyCustom: string;
  setProxyCustom: (v: string) => void;
  proxySaving: boolean;
  onSaveProxy: () => void;
  onClearProxy: () => void;
  hasSecret: boolean | undefined;
  onClearKey: () => void;
  onOpenConsole: (subPath?: string | null) => void;
}

export function SettingsLLM({
  proxyDetected,
  proxyUseSystem,
  setProxyUseSystem,
  proxyCustom,
  setProxyCustom,
  proxySaving,
  onSaveProxy,
  onClearProxy,
  hasSecret,
  onClearKey,
  onOpenConsole,
}: Props) {
  const { t } = useI18n();

  return (
    <>
      <Section icon={Globe} title={t("settings.hermesTitle")}>
        <div>
          <button
            type="button"
            onClick={() => void onOpenConsole(null)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500 active:bg-sky-700 sm:w-auto dark:bg-sky-500 dark:hover:bg-sky-400 dark:active:bg-sky-600"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
            {t("settings.openConsole")}
          </button>
          {t("settings.openConsoleHint") && (
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
              {t("settings.openConsoleHint")}
            </p>
          )}
        </div>
      </Section>

      <Section icon={Globe} title={t("settings.proxyTitle")} desc={t("settings.proxyLead")}>
        <div className="w-full min-w-0 space-y-3">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {proxyDetected
                ? t("settings.proxyDetected", { url: proxyDetected })
                : t("settings.proxyNone")}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-zinc-700 dark:text-zinc-200">{t("settings.proxyUseSystem")}</span>
              <Toggle value={proxyUseSystem} onChange={(v) => setProxyUseSystem(v)} />
            </div>
            <div className="space-y-1">
              <span className="text-sm text-zinc-700 dark:text-zinc-200">{t("settings.proxyCustom")}</span>
              <input
                className="w-full rounded-lg border border-zinc-300/90 bg-white/90 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900/90"
                type="text"
                value={proxyCustom}
                placeholder="http://127.0.0.1:7890"
                onChange={(e) => setProxyCustom(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={() => void onSaveProxy()} disabled={proxySaving}>
                {proxySaving ? t("settings.proxySaving") : t("settings.proxySave")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onClearProxy();
                }}
              >
                {t("settings.proxyClear")}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
              {t("settings.proxyRestartHint")}
            </p>
          </div>
      </Section>

      <Section icon={KeyRound} title={t("settings.secPass")}>
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {hasSecret ? t("settings.passOn") : t("settings.passOff")}
          </p>
          <Button onClick={onClearKey} disabled={!hasSecret}>
            {t("settings.signOut")}
          </Button>
        </div>
      </Section>
    </>
  );
}
