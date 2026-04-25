import { useNavigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n";

export function Welcome() {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="hd-page-title">{t("welcome.title")}</h1>
        <p className="hd-lead max-w-prose">{t("welcome.lead")}</p>
      </div>

      <ul className="hd-glass-subtle space-y-3.5 p-5 text-zinc-700 dark:text-zinc-300">
        <li className="flex gap-3">
          <Bullet />
          <span className="text-[0.95rem] leading-relaxed">{t("welcome.li1")}</span>
        </li>
        <li className="flex gap-3">
          <Bullet />
          <span className="text-[0.95rem] leading-relaxed">{t("welcome.li2")}</span>
        </li>
        <li className="flex gap-3">
          <Bullet />
          <span className="text-[0.95rem] leading-relaxed">{t("welcome.li3")}</span>
        </li>
      </ul>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => nav("/onboarding/brain")}
          className="w-full rounded-[var(--radius-shell-lg)] bg-zinc-900 px-6 py-4 text-lg font-medium text-white transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {t("welcome.cta")}
        </button>
      </div>
    </div>
  );
}

function Bullet() {
  return (
    <span aria-hidden className="mt-1 inline-block h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
  );
}
