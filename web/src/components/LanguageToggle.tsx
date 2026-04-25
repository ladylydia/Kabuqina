import { useI18n } from "../lib/i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      className={`inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden text-sm ${className}`}
      role="group"
      aria-label={t("lang.zh") + " / " + t("lang.en")}
    >
      <button
        type="button"
        onClick={() => setLocale("zh")}
        className={
          "px-2.5 py-1 transition " +
          (locale === "zh"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900")
        }
      >
        {t("lang.zh")}
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={
          "px-2.5 py-1 border-l border-zinc-200 dark:border-zinc-800 transition " +
          (locale === "en"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900")
        }
      >
        {t("lang.en")}
      </button>
    </div>
  );
}
