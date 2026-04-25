import { useI18n } from "../lib/i18n";
import type { SessionRow } from "./chat-api";
import { cn } from "../lib/cn";

export interface ChatSidebarProps {
  sessions: SessionRow[];
  activeSessionId: string | null;
  loading?: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  loading = false,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-zinc-200/90 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-900/20">
      <div className="p-3">
        <button
          type="button"
          onClick={() => onNewChat()}
          className="w-full rounded-xl border border-zinc-200/90 bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
        >
          {t("chat.newChat")}
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {loading && (
          <p className="px-2 py-2 text-xs text-zinc-400">{t("chat.loadingSessions")}</p>
        )}
        {!loading && sessions.length === 0 && (
          <p className="px-2 py-2 text-center text-xs leading-relaxed text-zinc-400">{t("chat.noSessions")}</p>
        )}
        {sessions.map((s) => {
          const label = (s.title && s.title.trim()) || s.preview || s.id.slice(0, 8);
          const active = s.id === activeSessionId;
          return (
            <div
              key={s.id}
              className={cn("group flex items-stretch overflow-hidden rounded-xl", active && "bg-zinc-100/90 dark:bg-zinc-800/50")}
            >
              <button
                type="button"
                onClick={() => onSelectSession(s.id)}
                title={label}
                className="min-w-0 flex-1 px-2.5 py-2.5 text-left"
              >
                <div
                  className={cn(
                    "truncate text-[13px] leading-snug",
                    active
                      ? "font-medium text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100"
                  )}
                >
                  {label}
                </div>
              </button>
              <button
                type="button"
                title={t("chat.delete")}
                onClick={(e) => onDeleteSession(s.id, e)}
                className="shrink-0 px-1.5 text-zinc-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
