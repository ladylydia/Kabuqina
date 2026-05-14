import { AlarmClock, Download, FileText, Image as ImageIcon, MessageCircle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import type { SessionRow } from "./chat-api";
import { cn } from "../lib/cn";
import { deriveSessionPresentation, type SessionIcon } from "./sessionPresentation";

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
  const { t, locale } = useI18n();
  const nav = useNavigate();
  const grouped = sessions.reduce<Array<{ group: string; rows: Array<{ session: SessionRow; label: string; icon: SessionIcon }> }>>(
    (acc, session) => {
      const presentation = deriveSessionPresentation(session, locale);
      let bucket = acc.find((item) => item.group === presentation.group);
      if (!bucket) {
        bucket = { group: presentation.group, rows: [] };
        acc.push(bucket);
      }
      bucket.rows.push({ session, label: presentation.label, icon: presentation.icon });
      return acc;
    },
    [],
  );
  const iconFor = (icon: SessionIcon) =>
    icon === "alarm" ? AlarmClock : icon === "file" ? FileText : icon === "image" ? ImageIcon : MessageCircle;

  return (
    <aside className="flex w-[272px] shrink-0 flex-col border-r border-zinc-200/90 bg-zinc-100/30 dark:border-zinc-700 dark:bg-zinc-900/30">
      <div className="border-b border-zinc-200/80 p-4 pb-3 dark:border-zinc-700/80">
        <button
          type="button"
          onClick={() => onNewChat()}
          className="inline-flex w-full items-center justify-start gap-2 rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] dark:bg-sky-500 dark:text-white dark:hover:bg-sky-600"
        >
          <span>{t("chat.newChat")}</span>
          <Plus className="h-4 w-4 shrink-0 stroke-[2.75]" aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 pt-2">
        {loading && (
          <p className="px-1.5 py-2 text-xs text-zinc-400 dark:text-zinc-500">{t("chat.loadingSessions")}</p>
        )}
        {!loading && sessions.length === 0 && (
          <p className="px-1.5 py-2 text-center text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
            {t("chat.noSessions")}
          </p>
        )}
        {grouped.map((group) => (
          <div key={group.group} className="pt-1">
            <p className="px-1.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {group.group}
            </p>
            {group.rows.map(({ session: s, label, icon }) => {
              const active = s.id === activeSessionId;
              const Icon = iconFor(icon);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "group flex items-stretch overflow-hidden rounded-lg",
                    active && "bg-zinc-200/60 dark:bg-zinc-800/60",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSession(s.id)}
                    title={label}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2.5 text-left"
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        active ? "text-sky-600 dark:text-sky-400" : "text-zinc-400 dark:text-zinc-500",
                      )}
                      strokeWidth={2.2}
                      aria-hidden
                    />
                    <div
                      className={cn(
                        "truncate text-[13px] leading-snug",
                        active
                          ? "font-medium text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100",
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
                    x
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="shrink-0 space-y-1.5 border-t border-zinc-200/80 bg-zinc-100/50 px-3 py-3 dark:border-zinc-700/80 dark:bg-zinc-900/50">
        <button
          type="button"
          data-action-priority="primary"
          onClick={() => nav("/settings/cron", { state: { cronBackTo: "/chat" } })}
          className={cn(
            "group inline-flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight",
            "border-zinc-200/90 bg-white/95 text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
            "transition-[border-color,background-color,color,box-shadow,transform] duration-150 ease-out",
            "hover:border-sky-300 hover:bg-sky-50 hover:text-sky-950 hover:shadow-[0_4px_14px_-4px_rgba(14,165,233,0.35)]",
            "active:scale-[0.99]",
            "dark:border-zinc-600 dark:bg-zinc-800/85 dark:text-zinc-100",
            "dark:hover:border-sky-500/60 dark:hover:bg-sky-950/45 dark:hover:text-sky-50 dark:hover:shadow-[0_4px_18px_-6px_rgba(56,189,248,0.22)]",
          )}
        >
          <AlarmClock
            className={cn(
              "h-[1.05rem] w-[1.05rem] shrink-0 text-zinc-500 transition-colors duration-150 ease-out",
              "group-hover:text-sky-600 dark:text-zinc-400 dark:group-hover:text-sky-400",
            )}
            strokeWidth={2.25}
            aria-hidden
          />
          <span className="block leading-snug">{t("cron.title")}</span>
        </button>
        <button
          type="button"
          data-action-priority="low"
          onClick={() => {
            nav("/export");
          }}
          className={cn(
            "group inline-flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium",
            "text-zinc-500 transition-[background-color,color,transform] duration-150 ease-out",
            "hover:bg-zinc-200/70 hover:text-zinc-800",
            "active:scale-[0.99]",
            "dark:text-zinc-500 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200",
          )}
        >
          <Download
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors duration-150 ease-out",
              "group-hover:text-zinc-600 dark:text-zinc-600 dark:group-hover:text-zinc-300",
            )}
            strokeWidth={2.1}
            aria-hidden
          />
          <span className="block leading-snug">{t("chat.exportButton")}</span>
        </button>
      </div>
    </aside>
  );
}
