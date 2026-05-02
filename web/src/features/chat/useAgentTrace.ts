import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";

export interface AgentTraceLine {
  tag: "py.out" | "py.err";
  line: string;
  ts: number;
}

const MAX_LINES = 500;

/**
 * Listen to Tauri "agent-trace" events pushed from the Rust supervisor
 * (Python stdout/stderr).  Returns accumulated lines + a clear helper.
 */
export function useAgentTrace(enabled: boolean) {
  const [lines, setLines] = useState<AgentTraceLine[]>([]);
  const linesRef = useRef<AgentTraceLine[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let unlisten: (() => void) | undefined;

    listen<{ tag: string; line: string }>("agent-trace", (event) => {
      if (event.payload.tag !== "py.out") return;
      const entry: AgentTraceLine = {
        tag: event.payload.tag as "py.out" | "py.err",
        line: event.payload.line,
        ts: Date.now(),
      };
      linesRef.current = [...linesRef.current, entry].slice(-MAX_LINES);
      setLines(linesRef.current);
    }).then((u) => {
      unlisten = u;
    });

    return () => {
      unlisten?.();
    };
  }, [enabled]);

  const clear = () => {
    linesRef.current = [];
    setLines([]);
  };

  return { lines, clear };
}
