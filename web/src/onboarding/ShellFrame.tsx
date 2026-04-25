import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppScaffold } from "../components/AppScaffold";
import { BrandMark } from "../components/BrandMark";
import { LanguageToggle } from "../components/LanguageToggle";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/cn";

const STEPS = ["welcome", "brain", "pass", "vibe", "done"] as const;

export function ShellFrame({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const loc = useLocation();
  const current = loc.pathname.split("/").pop() || "welcome";
  const idx = Math.max(0, STEPS.indexOf(current as (typeof STEPS)[number]));

  return (
    <AppScaffold className="flex h-full w-full flex-col">
      <header
        className={cn(
          "shrink-0 border-b border-zinc-200/60 bg-white/45 px-[var(--hd-page-pad-x)] py-3.5 backdrop-blur-md",
          "dark:border-zinc-800/60 dark:bg-zinc-950/40"
        )}
      >
        <div className="mx-auto flex max-w-[var(--hd-content-max)] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight">
            <BrandMark size="sm" />
            <span className="truncate">{t("brand")}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ProgressDots index={idx} total={STEPS.length} />
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[var(--hd-content-max)] space-y-[var(--hd-stack-gap)] px-[var(--hd-page-pad-x)] py-10 sm:py-12">
          {children}
        </div>
      </main>
    </AppScaffold>
  );
}

function ProgressDots({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={
            "h-1.5 rounded-full transition-all " +
            (i <= index
              ? "w-6 bg-zinc-800 dark:bg-zinc-200"
              : "w-1.5 bg-zinc-300 dark:bg-zinc-700")
          }
        />
      ))}
    </div>
  );
}
