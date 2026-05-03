import { useCallback, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  cmdChatSend,
  cmdDeskStop,
  fileToDeskAttachment,
  isRecord,
  parseChatSend,
  type DeskAttachmentPayload,
  type UiMsg,
} from "../chat-api";

export function useSendMessage({
  activeSessionId,
  setActiveSessionId,
  threadModel,
  setThreadModel,
  setMessages,
  loadSessions,
  setApiRequiredOpen,
  setSendErr,
}: {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  threadModel: string;
  setThreadModel: (model: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<UiMsg[]>>;
  loadSessions: () => Promise<void>;
  setApiRequiredOpen: (open: boolean) => void;
  setSendErr: (err: string | null) => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<DeskAttachmentPayload[]>([]);
  const stopTurnRef = useRef(false);
  const inFlightSessionIdRef = useRef<string | null>(null);

  const onAddFiles = useCallback(async (list: FileList | null) => {
    if (!list?.length) {
      return;
    }
    const out: DeskAttachmentPayload[] = [];
    for (let i = 0; i < list.length; i++) {
      if (out.length >= 6) {
        break;
      }
      const f = list[i];
      try {
        out.push(await fileToDeskAttachment(f));
      } catch (e) {
        console.error(e);
      }
    }
    setPendingAttachments((prev) => [...prev, ...out]);
  }, []);

  const onRemoveAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onStopAgent = useCallback(async () => {
    const sid = inFlightSessionIdRef.current || activeSessionId;
    if (!sid) {
      return;
    }
    stopTurnRef.current = true;
    setSending(false);
    setMessages((m) => m.filter((x) => x.id !== "pending-assistant"));
    setSendErr(null);
    try {
      await cmdDeskStop(sid);
    } catch (e) {
      console.error(e);
      const msg =
        typeof e === "string"
          ? e
          : e && isRecord(e) && typeof e.message === "string"
            ? e.message
            : String(e);
      setSendErr(msg);
    }
  }, [activeSessionId, setMessages, setSendErr]);

  const onSend = useCallback(async () => {
    const text = input.trim();
    const atts = pendingAttachments;
    if (sending || (!text && !atts.length)) {
      return;
    }
    try {
      const hasKey = await invoke<boolean>("cmd_has_secret");
      if (!hasKey) {
        setApiRequiredOpen(true);
        return;
      }
    } catch {
      setApiRequiredOpen(true);
      return;
    }
    setSending(true);
    stopTurnRef.current = false;
    setSendErr(null);
    setInput("");
    setPendingAttachments([]);

    let sessionForSend = activeSessionId;
    if (!sessionForSend) {
      sessionForSend =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `desk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      setActiveSessionId(sessionForSend);
    }
    inFlightSessionIdRef.current = sessionForSend;

    const attLabel =
      atts.length > 0
        ? atts.map((a) => `📎 ${a.name}`).join("\n")
        : "";
    const userText = [text, attLabel].filter(Boolean).join("\n");
    const nowSec = Math.floor(Date.now() / 1000);
    const userMsg: UiMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: nowSec,
    };
    setMessages((m) => [...m, userMsg]);
    const placeholder: UiMsg = {
      id: "pending-assistant",
      role: "assistant",
      text: "…",
      model: threadModel || undefined,
      timestamp: nowSec,
    };
    setMessages((m) => [...m, placeholder]);

    try {
      const raw = await cmdChatSend(text, sessionForSend, atts.length ? atts : null);
      const parsed = parseChatSend(raw);
      if (stopTurnRef.current) {
        setMessages((m) => m.filter((x) => x.id !== "pending-assistant"));
        return;
      }
      if (!parsed.ok) {
        setMessages((m) => m.filter((x) => x.id !== "pending-assistant"));
        setSendErr(parsed.err);
        return;
      }
      setActiveSessionId(parsed.sessionId);
      const resolvedModel = (parsed.model || "").trim() || threadModel;
      if (resolvedModel) {
        setThreadModel(resolvedModel);
      }
      if (stopTurnRef.current) {
        setMessages((m) => m.filter((x) => x.id !== "pending-assistant"));
        return;
      }
      setMessages((m) =>
        m.map((x) =>
          x.id === "pending-assistant"
            ? {
                ...x,
                id: `a-${Date.now()}`,
                text: parsed.text,
                model: resolvedModel || undefined,
                timestamp: Math.floor(Date.now() / 1000),
              }
            : x
        )
      );
      void loadSessions();
    } catch (e) {
      if (!stopTurnRef.current) {
        setMessages((m) => m.filter((x) => x.id !== "pending-assistant"));
        const msg =
          typeof e === "string"
            ? e
            : e && isRecord(e) && typeof e.message === "string"
              ? e.message
              : String(e);
        setSendErr(msg);
      }
    } finally {
      setSending(false);
      stopTurnRef.current = false;
      inFlightSessionIdRef.current = null;
    }
  }, [
    input,
    pendingAttachments,
    sending,
    activeSessionId,
    threadModel,
    setActiveSessionId,
    setThreadModel,
    setMessages,
    loadSessions,
    setApiRequiredOpen,
    setSendErr,
  ]);

  return {
    input,
    setInput,
    sending,
    pendingAttachments,
    onAddFiles,
    onRemoveAttachment,
    onSend,
    onStopAgent,
  } as const;
}
