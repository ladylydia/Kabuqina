import { useCallback, useEffect, useState } from "react";
import { cmdDeleteSession, cmdGetSessions, type SessionRow } from "../chat-api";

export function useSessions({ hermesReady }: { hermesReady: boolean }) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setListLoading(true);
    try {
      const r = await cmdGetSessions(50, 0);
      setSessions(r.sessions ?? []);
    } catch (e) {
      console.error(e);
      setSessions([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hermesReady) {
      return;
    }
    void loadSessions();
  }, [hermesReady, loadSessions]);

  const deleteSession = useCallback(async (id: string) => {
    try {
      await cmdDeleteSession(id);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  return { sessions, listLoading, loadSessions, deleteSession } as const;
}
