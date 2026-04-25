import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { AppScaffold } from "./components/AppScaffold";
import { BrandMark } from "./components/BrandMark";
import { LanguageToggle } from "./components/LanguageToggle";
import { useI18n } from "./lib/i18n";
import { cn } from "./lib/cn";

/**
 * App entry: with saved API key go straight to chat; otherwise first-run onboarding.
 */
export function Splash() {
  const { t } = useI18n();
  const nav = useNavigate();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const has = await invoke<boolean>("cmd_has_secret");
        if (cancelled) return;
        if (!has) {
          nav("/onboarding/welcome", { replace: true });
          return;
        }
        nav("/chat", { replace: true });
      } catch {
        if (!cancelled) nav("/onboarding/welcome", { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nav]);

  return (
    <AppScaffold className="relative flex flex-col items-center justify-center">
      <div className="absolute right-[var(--hd-page-pad-x)] top-4 z-10">
        <LanguageToggle />
      </div>
      <div
        className={cn(
          "hd-glass w-full max-w-sm px-8 py-10 text-center",
          "sm:max-w-md sm:px-10"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <BrandMark size="lg" className="drop-shadow-sm" />
          <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("brand")}</div>
        </div>
        <p className="hd-hint mt-3 justify-center">
          <span aria-hidden>✨</span>
          {t("splash.waking")}
        </p>
        <div className="mx-auto mt-8 h-1 w-48 max-w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-zinc-400/90 dark:bg-zinc-500" />
        </div>
      </div>
    </AppScaffold>
  );
}
