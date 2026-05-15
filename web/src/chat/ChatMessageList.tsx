import { useEffect, useRef } from "react";
import { AlarmClock, FileText, Image as ImageIcon, PenLine } from "lucide-react";
import { useI18n } from "../lib/i18n";
import type { UiMsg } from "./chat-api";
import { AgentProgress } from "./AgentProgress";
import { ChatMessage } from "./ChatMessage";
import { cn } from "../lib/cn";
import type { AgentProgressState } from "./hooks/useAgentProgress";

interface ChatMessageListProps {
  messages: UiMsg[];
  sending?: boolean;
  sendErr?: string | null;
  progress?: AgentProgressState | null;
  onPickSuggestion?: (prompt: string) => void;
  onOrganizeDesktop?: () => void;
}

function TypingIndicator() {
  const { t } = useI18n();
  return (
    <div className="flex justify-start">
      <div className="max-w-[min(100%,42rem)] rounded-2xl rounded-tl-sm border border-zinc-200/80 bg-white/95 px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-zinc-700/80 dark:bg-zinc-800/90">
        <p className="mb-2 text-xs text-zinc-400 dark:text-zinc-500">
          {t("chat.typingStatus")}…
        </p>
        <div className="flex h-4 items-center gap-1" aria-hidden>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300 dark:bg-zinc-600" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300 dark:bg-zinc-600" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-300 dark:bg-zinc-600" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onPickSuggestion,
  onOrganizeDesktop,
}: {
  onPickSuggestion?: (prompt: string) => void;
  onOrganizeDesktop?: () => void;
}) {
  const { t, locale } = useI18n();
  const brand = t("brand");
  const wordmarkBase =
    locale === "zh" ? "/kabuqina_logo_chinese" : "/kabuqina_logo_english";
  const greeting = t("chat.greeting", { name: brand });
  const greetingParts = greeting.split(brand);
  const actions =
    locale === "zh"
      ? [
          { label: "提醒我休息", prompt: "提醒我 30 分钟后休息一下", icon: AlarmClock },
          { label: t("chat.organizeDesktopButton"), onClick: onOrganizeDesktop, icon: FileText },
          { label: "总结图片", prompt: "帮我看看这张图片里有什么", icon: ImageIcon },
          { label: "写消息", prompt: "帮我把这段话写得更自然：", icon: PenLine },
        ]
      : [
          { label: "Set a reminder", prompt: "Remind me to take a break in 30 minutes", icon: AlarmClock },
          { label: t("chat.organizeDesktopButton"), onClick: onOrganizeDesktop, icon: FileText },
          { label: "Summarize an image", prompt: "Help me understand what is in this image", icon: ImageIcon },
          { label: "Write a message", prompt: "Make this message sound more natural:", icon: PenLine },
        ];
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center px-6 py-8 sm:py-10">
      <div className="flex w-full max-w-xl translate-y-2 flex-col items-center text-center sm:translate-y-3">
        <div className="mb-5 flex flex-col items-center sm:mb-6">
          <picture className="block leading-none">
            <source type="image/avif" srcSet={`${wordmarkBase}.avif`} />
            <source type="image/webp" srcSet={`${wordmarkBase}.webp`} />
            <img
              src={`${wordmarkBase}.webp`}
              alt={brand}
              className="mx-auto block h-auto w-full max-w-[220px] object-contain object-center dark:opacity-95 sm:max-w-[260px]"
              width={260}
              height={80}
              decoding="async"
            />
          </picture>
          <p className="mt-4 text-sm tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {greetingParts[0]}
            <span className="font-medium text-sky-600 dark:text-sky-400">{brand}</span>
            {greetingParts[1]}
          </p>
        </div>
        <div
          className="mt-1 flex w-full flex-wrap justify-center gap-2"
          aria-label={t("chat.emptyActionsLabel")}
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  if ("onClick" in action && action.onClick) {
                    action.onClick();
                    return;
                  }
                  if ("prompt" in action && action.prompt) {
                    onPickSuggestion?.(action.prompt);
                  }
                }}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium",
                  "border-zinc-200 bg-white/85 text-zinc-700 shadow-sm transition",
                  "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900 active:scale-[0.99]",
                  "dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200",
                  "dark:hover:border-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2.1} aria-hidden />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ChatMessageList({
  messages,
  sending = false,
  sendErr,
  progress,
  onPickSuggestion,
  onOrganizeDesktop,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages, sending, progress?.nextSeq, progress?.status]);

  const isEmpty = messages.length === 0 && !sendErr;
  const pendingAssistant = messages.find((m) => m.id === "pending-assistant");
  const completedMessages = messages.filter((m) => m.id !== "pending-assistant");
  const pendingVisibleText = !!pendingAssistant?.text.trim().replace(/^[.…]+$/, "");

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto bg-zinc-50/80 dark:bg-[#0F172A]",
        isEmpty && "flex min-h-0 flex-col"
      )}
    >
      {isEmpty ? (
        <EmptyState onPickSuggestion={onPickSuggestion} onOrganizeDesktop={onOrganizeDesktop} />
      ) : (
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:space-y-6 sm:px-5">
          {completedMessages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              text={m.text}
              model={m.model}
              timestamp={m.timestamp}
              streaming={false}
            />
          ))}
          {progress?.running && (
            <div className="flex justify-start">
              <div className="min-w-0 flex-1 max-w-[min(100%,42rem)]">
                <AgentProgress progress={progress} />
              </div>
            </div>
          )}
          {pendingAssistant && (
            <ChatMessage
              key={pendingAssistant.id}
              role={pendingAssistant.role}
              text={pendingAssistant.text}
              model={pendingAssistant.model}
              timestamp={pendingAssistant.timestamp}
              streaming={sending}
            />
          )}
          {sending && !progress?.running && !pendingVisibleText && <TypingIndicator />}
          {sendErr && (
            <div className="hd-semantic-error rounded-lg px-3 py-2 text-sm">
              {sendErr}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
