import { useCallback, useState } from "react";
import {
  cmdGetSessionMessages,
  cmdGetSessions,
  type MessageRow,
  type SessionRow,
  type UiMsg,
} from "../chat-api";

const LAST_SESSION_KEY = "hermesdesk.shell.chat.lastSessionId";

function contentToString(content: unknown): string {
  if (content == null) {
    return "";
  }
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === "string") {
          return c;
        }
        if (c && typeof c === "object" && "text" in c) {
          return String((c as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof content === "object" && "text" in (content as object)) {
    return String((content as { text?: unknown }).text);
  }
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

function rowsToUiMessages(rows: MessageRow[], sessionModel: string): UiMsg[] {
  const out: UiMsg[] = [];
  let n = 0;
  const mdl = sessionModel.trim();
  for (const m of rows) {
    const role = m.role;
    if (role === "session_meta" || role === "tool") {
      continue;
    }
    if (role !== "user" && role !== "assistant" && role !== "system") {
      continue;
    }
    const text = contentToString(m.content).trim();
    if (!text && role !== "assistant") {
      continue;
    }
    if (role === "system") {
      out.push({
        id: `s-${n++}`,
        role: "assistant",
        text: `_(system)_\n${text || "—"}`,
        timestamp: typeof m.timestamp === "number" ? m.timestamp : undefined,
        model: mdl || undefined,
      });
      continue;
    }
    out.push({
      id: `m-${n++}`,
      role: role as "user" | "assistant",
      text: text || (role === "assistant" ? "…" : ""),
      timestamp: typeof m.timestamp === "number" ? m.timestamp : undefined,
      model: role === "assistant" && mdl ? mdl : undefined,
    });
  }
  return out;
}

function persistSession(id: string | null) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  if (id) {
    window.localStorage.setItem(LAST_SESSION_KEY, id);
  } else {
    window.localStorage.removeItem(LAST_SESSION_KEY);
  }
}

export function useChatState({
  loadSessions,
}: {
  loadSessions: () => Promise<void>;
}) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [threadModel, setThreadModel] = useState("");
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [apiRequiredOpen, setApiRequiredOpen] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);

  const loadThread = useCallback(
    async (sid: string) => {
      setSendErr(null);
      try {
        const [r, list] = await Promise.all([
          cmdGetSessionMessages(sid),
          cmdGetSessions(100, 0),
        ]);
        const row = (list.sessions ?? []).find((s: SessionRow) => s.id === sid);
        const m = (row?.model ?? "").trim();
        setThreadModel(m);
        setMessages(rowsToUiMessages(r.messages ?? [], m));
        setActiveSessionId(sid);
        persistSession(sid);
        void loadSessions();
      } catch (e) {
        console.error(e);
        setMessages([]);
        setThreadModel("");
        setActiveSessionId(null);
        persistSession(null);
      }
    },
    [loadSessions]
  );

  const onNewChat = useCallback(() => {
    setActiveSessionId(null);
    setThreadModel("");
    setMessages([]);
    setSendErr(null);
    persistSession(null);
  }, []);

  const onPickSession = useCallback(
    (id: string) => {
      if (id === activeSessionId) {
        return;
      }
      void loadThread(id);
    },
    [activeSessionId, loadThread]
  );

  const onDeleteSession = useCallback(
    async (id: string) => {
      if (activeSessionId === id) {
        onNewChat();
      }
      await loadSessions();
    },
    [activeSessionId, onNewChat, loadSessions]
  );

  return {
    activeSessionId,
    setActiveSessionId,
    threadModel,
    setThreadModel,
    messages,
    setMessages,
    sendErr,
    setSendErr,
    apiRequiredOpen,
    setApiRequiredOpen,
    onNewChat,
    onPickSession,
    onDeleteSession,
  } as const;
}
