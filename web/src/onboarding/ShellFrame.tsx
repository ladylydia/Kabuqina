import { ReactNode, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { AppScaffold } from "../components/AppScaffold";
import { useDraft } from "../lib/store";
import { cn } from "../lib/cn";
import { getIndexInFlow, getStepsForMode, slugFromPathname, type ShellWizardStepId } from "./flowConfig";

export function ShellFrame({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const draft = useDraft();

  const slug = useMemo((): ShellWizardStepId => slugFromPathname(loc.pathname), [loc.pathname]);
  const stepList = getStepsForMode(draft.setupMode);
  const idx = getIndexInFlow(slug, draft.setupMode);

  return (
    <AppScaffold className="flex h-full w-full flex-col">
      <header
        className={cn(
          "shrink-0 border-b border-zinc-200/60 bg-zinc-50/95 px-[var(--hd-page-pad-x)] py-3.5",
          "dark:border-zinc-800/60 dark:bg-zinc-950/95"
        )}
      >
        <div className="mx-auto flex max-w-[var(--hd-content-max)] items-center justify-end gap-3">
          <div className="flex shrink-0 items-center sm:gap-3">
            <ProgressDots index={idx} total={stepList.length} />
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
              ? "w-6 bg-sky-500 dark:bg-sky-400"
              : "w-1.5 bg-zinc-300 dark:bg-zinc-700")
          }
        />
      ))}
    </div>
  );
}
