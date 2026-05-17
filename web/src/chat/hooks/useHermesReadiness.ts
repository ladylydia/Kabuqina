import { useEffect, useState } from "react";
import { cmdGetHermesBootstrapError, cmdGetHermesPort } from "../chat-api";
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
          const bootFail = await cmdGetHermesBootstrapError();
          if (bootFail) {
            if (!cancel) {
              setBootErr(formatBootError(bootFail, t));
            }
            return;
          }
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
        const bootFail = await cmdGetHermesBootstrapError().catch(() => null);
        setBootErr(
          bootFail ? formatBootError(bootFail, t) : t("chat.errHermesTimeout"),
        );
      }
    };
    void tick();
    return () => {
      cancel = true;
    };
  }, [t]);

  return { hermesReady, bootErr } as const;
}

function formatBootError(detail: string, t: (key: string) => string): string {
  const lower = detail.toLowerCase();
  const proxyish =
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("proxy") ||
    lower.includes("30s");
  if (proxyish) {
    return `${t("chat.errHermesBootFailed")}\n\n${detail}\n\n${t("chat.errHermesProxyHint")}`;
  }
  return `${t("chat.errHermesBootFailed")}\n\n${detail}`;
}
