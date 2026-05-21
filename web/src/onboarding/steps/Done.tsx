import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getLocale } from "../../lib/i18n-core";
import { useI18n } from "../../lib/i18n";
import { clearDraft, useDraft } from "../../lib/store";

export function Done() {
  const { t } = useI18n();
  const draft = useDraft();

  useEffect(() => {
    invoke("cmd_set_personality", { name: draft.personality }).catch(() => {});
  }, [draft.personality]);

  async function openWorkspace() {
    try {
      await invoke("cmd_open_workspace");
    } catch (e) {
      console.error(e);
    }
  }

  async function openChat() {
    clearDraft();
    const loc = getLocale();
    try {
      await invoke("cmd_open_hermes_dashboard", { shellLocale: loc, path: null });
    } catch (e) {
      console.error(e);
      try {
        const port = await invoke<number | null>("cmd_get_hermes_port");
        if (port) {
          const u = new URL(`http://127.0.0.1:${port}/`);
          if (loc === "en" || loc === "zh") {
            u.searchParams.set("hermesdesk_lang", loc);
          }
          window.open(u.toString(), "_blank", "noopener,noreferrer");
        } else {
          window.location.replace("/");
        }
      } catch {
        window.location.replace("/");
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-4xl">{"\u{1F44B}"}</div>
        <h1 className="hd-page-title text-3xl">{t("done.title")}</h1>
        <p className="hd-lead">{t("done.lead")}</p>
      </div>

      <div className="hd-glass-subtle space-y-2 rounded-2xl p-5">
        <div className="text-sm font-medium text-[var(--kq-color-strong)]">{t("done.workspaceTitle")}</div>
        <p className="text-sm text-[var(--kq-color-muted)] dark:text-zinc-400">{t("done.workspaceBody")}</p>
        <button
          onClick={openWorkspace}
          className="hd-link text-sm underline underline-offset-4"
        >
          {t("done.openFolder")}
        </button>
      </div>

      <button
        onClick={() => void openChat()}
        className="kq-btn-primary w-full rounded-2xl px-6 py-4 text-lg font-medium transition hover:opacity-95"
      >
        {t("done.cta")}
      </button>
    </div>
  );
}
