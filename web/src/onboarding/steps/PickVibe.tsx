import { useNavigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n";
import { updateDraft, useDraft, type Personality } from "../../lib/store";

const VIBE_IDS: Personality[] = ["helpful", "friendly", "concise"];

export function PickVibe() {
  const { t } = useI18n();
  const nav = useNavigate();
  const draft = useDraft();

  function pick(p: Personality) {
    updateDraft({ personality: p });
    nav("/onboarding/done");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("vibe.title")}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t("vibe.lead")}</p>
      </div>
      <div className="space-y-3">
        {VIBE_IDS.map((id) => (
          <button
            key={id}
            onClick={() => pick(id)}
            className={
              "w-full text-left rounded-2xl border p-5 transition hover:border-zinc-400 dark:hover:border-zinc-500 " +
              (draft.personality === id
                ? "border-zinc-900 dark:border-zinc-200 ring-1 ring-zinc-900/10 dark:ring-zinc-100/10"
                : "border-zinc-200 dark:border-zinc-800")
            }
          >
            <div className="font-medium">{t(`vibe.${id}.title`)}</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t(`vibe.${id}.body`)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
