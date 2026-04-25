import { invoke } from "@tauri-apps/api/core";

export type SessionRow = {
  id: string;
  preview?: string;
  title?: string;
  model?: string;
  last_active?: number;
  started_at?: number;
  message_count?: number;
};

export type SessionsResponse = {
  sessions: SessionRow[];
  total: number;
};

export type MessageRow = {
  role: string;
  content: unknown;
  timestamp?: number;
};

export type SessionMessagesResponse = {
  session_id: string;
  messages: MessageRow[];
};

export type UiMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Unix seconds (Hermes `messages.timestamp`), or ms if > 1e12 */
  timestamp?: number;
  model?: string;
};

export async function cmdGetHermesPort(): Promise<number | null> {
  const p = await invoke<number | null>("cmd_get_hermes_port");
  return p ?? null;
}

export async function cmdGetSessions(limit = 50, offset = 0): Promise<SessionsResponse> {
  return invoke<SessionsResponse>("cmd_get_sessions", { limit, offset });
}

export async function cmdGetSessionMessages(id: string): Promise<SessionMessagesResponse> {
  return invoke<SessionMessagesResponse>("cmd_get_session_messages", { id });
}

export async function cmdDeleteSession(id: string): Promise<void> {
  await invoke("cmd_delete_session", { id });
}

/** Base64 file payload for Hermes ``/api/desk/chat-proto`` (no data: URL prefix). */
export type DeskAttachmentPayload = { name: string; mime: string; data: string };

export function fileToDeskAttachment(file: File): Promise<DeskAttachmentPayload> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      const i = s.indexOf(";base64,");
      if (i < 0) {
        reject(new Error("Failed to read file as data URL"));
        return;
      }
      const mime = (s.slice(5, i) || file.type || "application/octet-stream").trim() || "application/octet-stream";
      const data = s.slice(i + 8).replace(/\s/g, "");
      resolve({ name: file.name, mime, data });
    };
    r.onerror = () => reject(r.error ?? new Error("read error"));
    r.readAsDataURL(file);
  });
}

export async function cmdChatSend(
  message: string,
  sessionId: string | null,
  attachments?: DeskAttachmentPayload[] | null
): Promise<unknown> {
  // Tauri maps Rust `session_id` → JS `sessionId` (snake_case args use camelCase keys).
  return invoke("cmd_chat_send", {
    message,
    sessionId,
    attachments: attachments?.length ? attachments : null,
  });
}

export function cmdDeskStop(sessionId: string): Promise<unknown> {
  return invoke("cmd_desk_stop", { sessionId });
}

export function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

export function parseChatSend(
  r: unknown
):
  | { ok: true; sessionId: string; text: string; model: string }
  | { ok: false; err: string } {
  if (!isRecord(r)) {
    return { ok: false, err: "Invalid response" };
  }
  if (r.ok === true) {
    return {
      ok: true,
      sessionId: String(r.session_id ?? ""),
      text: String(r.final_response ?? ""),
      model: String((r as { model?: unknown }).model ?? ""),
    };
  }
  const detail = typeof r.detail === "string" ? r.detail : "";
  const err = String((r as { error?: unknown }).error ?? "error");
  return { ok: false, err: detail || err };
}
