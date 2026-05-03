import { useEffect, useState } from "react";
import { cmdGetHermesPort } from "../chat-api";
import { useI18n } from "../../lib/i18n";

export function useHermesReadiness() {
  const { t } = useI18n();
  const [hermesReady, setHermesReady] = useState(false);
  const [bootErr, setBootErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    const tick = async () => {
      for (let i = 0; i < 120; i++) {
        if (cancel) {
          return;
        }
        try {
          const p = await cmdGetHermesPort();
          if (p != null) {
            if (!cancel) {
              setHermesReady(true);
              setBootErr(null);
            }
            return;
          }
        } catch {
          /* keep polling */
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      if (!cancel) {
        setBootErr(t("chat.errHermesTimeout"));
      }
    };
    void tick();
    return () => {
      cancel = true;
    };
  }, [t]);

  return { hermesReady, bootErr } as const;
}
