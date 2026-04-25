import { useEffect, useRef } from "react";
import { useI18n } from "../lib/i18n";
import type { UiMsg } from "./chat-api";
import { ChatMessage } from "./ChatMessage";

interface ChatMessageListProps {
  messages: UiMsg[];
  sending?: boolean;
  sendErr?: string | null;
  onPromptClick?: (text: string) => void;
}

function TypingIndicator() {
  const { t } = useI18n();
  return (
    <div className="flex justify-start">
      <div className="max-w-[min(100%,42rem)] rounded-2xl border border-zinc-200/90 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
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

function EmptyState({ onPromptClick }: { onPromptClick?: (text: string) => void }) {
  const { t } = useI18n();
  const prompts = [
    t("chat.prompt1") || "帮我写一段代码",
    t("chat.prompt2") || "解释一下这个概念",
    t("chat.prompt3") || "总结一下文档内容",
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-lg text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {t("chat.emptyTitle") || "开启新对话"}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t("chat.emptySubtitle") || "你可以问我任何问题，我会尽力帮助你。"}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-2.5">
          {prompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPromptClick?.(p)}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:border-zinc-600"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatMessageList({
  messages,
  sending = false,
  sendErr,
  onPromptClick,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages, sending]);

  const isEmpty = messages.length === 0 && !sendErr;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
      {isEmpty ? (
        <EmptyState onPromptClick={onPromptClick} />
      ) : (
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-5">
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              text={m.text}
              model={m.model}
              timestamp={m.timestamp}
            />
          ))}
          {sending && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}
          {sendErr && (
            <div className="text-xs text-red-600 dark:text-red-400 px-1">
              {sendErr}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
