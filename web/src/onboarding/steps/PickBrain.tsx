import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n";
import { updateDraft, useDraft } from "../../lib/store";
import type { ProviderId } from "../../lib/providers";

export function PickBrain() {
  const { t } = useI18n();
  const nav = useNavigate();
  const draft = useDraft();

  useEffect(() => {
    if (!draft.setupMode) nav("/onboarding/mode", { replace: true });
  }, [draft.setupMode, nav]);

  if (!draft.setupMode) return null;

  function pick(providerId: ProviderId, customBaseUrl: string) {
    updateDraft({ providerId, customBaseUrl, customModel: "" });
    nav("/onboarding/pass");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="hd-page-title">{t("brain.title")}</h1>
        <p className="hd-lead max-w-prose">{t("brain.lead")}</p>
      </div>

      <div className="space-y-3">
        {/* DeepSeek (recommended) */}
        <button
          type="button"
          onClick={() => pick("deepseek", "")}
          className="hd-glass-subtle w-full rounded-[var(--radius-shell-lg)] p-5 text-left transition hover:border-zinc-300/90 dark:hover:border-zinc-600"
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-medium">DeepSeek</div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {t("brain.recommended")}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("brain.starter.title")}</p>
        </button>

        {/* Custom config */}
        <button
          type="button"
          onClick={() => pick("custom", "")}
          className="hd-glass-subtle w-full rounded-[var(--radius-shell-lg)] p-5 text-left transition hover:border-zinc-300/90 dark:hover:border-zinc-600"
        >
          <div className="font-medium">{t("brain.own.title")}</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("brain.own.body")}</p>
        </button>
      </div>
    </div>
  );
}
