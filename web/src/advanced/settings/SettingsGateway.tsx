import { useI18n } from "../../lib/i18n";
import {
  Bot,
  Building2,
  MessageCircle,
  QrCode,
  Send,
  Store,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Section } from "../../components/ui/Section";
import { Toggle } from "../../components/ui/Toggle";
import { DingTalkSettingsBlock } from "../../components/DingTalkSettingsBlock";
import { FeishuQrRouteBlock } from "../../components/FeishuQrRouteBlock";
import { PairingSettingsBlock } from "../../components/PairingSettingsBlock";
import { TelegramSettingsBlock } from "../../components/TelegramSettingsBlock";
import { QqbotQrRouteBlock } from "../../components/QqbotQrRouteBlock";
import { WeComSettingsBlock } from "../../components/WeComSettingsBlock";
import { WeixinQrRouteCBlock } from "../../components/WeixinQrRouteCBlock";
import type { Status } from "../Settings";
import type { GatewayStatus } from "../../features/gateway/useGatewayStatus";

interface Props {
  gatewayStatus: GatewayStatus;
  autoStartGateway: boolean;
  onToggleAutoStart: (next: boolean) => void;
  onOpenConsole: (subPath?: string | null) => void;
  onStatusChange: (status: Status | null) => void;
  status: Status | null;
}

function platformLabel(key: string): string {
  const map: Record<string, string> = {
    telegram: "Telegram",
    feishu: "飞书",
    qqbot: "QQ",
    weixin: "微信",
    dingtalk: "钉钉",
    wecom: "企微",
  };
  return map[key] ?? key;
}

export function SettingsGateway({
  gatewayStatus,
  autoStartGateway,
  onToggleAutoStart,
  onOpenConsole,
  onStatusChange,
  status,
}: Props) {
  const { t } = useI18n();
  const {
    running: gatewayRunning,
    eligible: gatewayEligible,
    diskState: gatewayDiskState,
    diskExit: gatewayDiskExit,
    embedSurvival: gatewayEmbedSurvival,
    startError: gatewayStartError,
    starting: gatewayStarting,
    platforms: gatewayPlatforms,
    start: startGateway,
    stop: stopGateway,
  } = gatewayStatus;

  return (
    <>
      <Section icon={MessageCircle} title={t("settings.gatewayTitle")} desc={t("settings.gatewayLead")}>
        <div className="w-full min-w-0 space-y-3">
          <div>
            <Button type="button" onClick={() => void onOpenConsole("/env")}>
              {t("settings.gatewayOpenKeys")}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-700 dark:text-zinc-200">{t("settings.gatewayAuto")}</span>
            <Toggle value={autoStartGateway} onChange={(v) => onToggleAutoStart(v)} />
          </div>
          {!gatewayEligible ? (
            <p className="text-xs leading-relaxed text-amber-700/90 dark:text-amber-400/90">
              {t("settings.gatewayNotEligible")}
            </p>
          ) : null}
          {gatewayEligible && !gatewayEmbedSurvival ? (
            <p className="text-xs leading-relaxed text-amber-800/95 dark:text-amber-300/95">
              {t("settings.gatewayEmbedStale")}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => void startGateway()}
              disabled={!gatewayEligible || gatewayStarting}
            >
              {gatewayStarting ? t("settings.gatewayStarting") : t("settings.gatewayStart")}
            </Button>
            <Button type="button" onClick={() => void stopGateway()} disabled={gatewayStarting}>
              {t("settings.gatewayStop")}
            </Button>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              {gatewayStarting
                ? t("settings.gatewayStatusChecking")
                : gatewayRunning
                  ? t("settings.gatewayStatusRunning")
                  : t("settings.gatewayStatusStopped")}
            </span>
          </div>
          {gatewayEligible && gatewayStarting && gatewayPlatforms ? (
            <div className="rounded-md border border-zinc-200/90 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="font-medium text-zinc-700 dark:text-zinc-200 mb-1.5">{t("settings.gatewayStartingHint")}</p>
              {Object.entries(gatewayPlatforms).map(([key, p]) => (
                <p key={key} className="flex items-center gap-1.5 mt-0.5 font-mono text-[0.7rem]">
                  <span className={
                    p.state === "connected" ? "text-emerald-600 dark:text-emerald-400" :
                    p.state === "retrying" ? "text-amber-600 dark:text-amber-400" :
                    p.state === "fatal" ? "text-red-600 dark:text-red-400" :
                    "text-zinc-500 dark:text-zinc-400"
                  }>
                    {p.state === "connected" ? "●" : p.state === "retrying" ? "◐" : p.state === "fatal" ? "✕" : "○"}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-300">{platformLabel(key)}</span>
                  <span className="text-zinc-500 dark:text-zinc-500">
                    {p.state === "connected" ? t("settings.gatewayPlatformConnected") :
                     p.state === "retrying" ? t("settings.gatewayPlatformRetrying") :
                     p.state === "fatal" ? p.error_message ?? t("settings.gatewayPlatformError") :
                     t("settings.gatewayPlatformConnecting")}
                  </span>
                </p>
              ))}
            </div>
          ) : null}
          {gatewayEligible && gatewayStarting && !gatewayPlatforms ? (
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("settings.gatewayStartingHint")}
            </p>
          ) : null}
          {gatewayStartError ? (
            <p className="text-xs leading-relaxed text-red-700 dark:text-red-400">
              {t("settings.gatewayStartFailed", { msg: gatewayStartError })}
            </p>
          ) : null}
          {gatewayDiskState || gatewayDiskExit ? (
            <div className="rounded-md border border-zinc-200/90 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="font-medium text-zinc-700 dark:text-zinc-200">{t("settings.gatewayDiskRecord")}</p>
              {gatewayDiskState ? (
                <p className="mt-1 font-mono text-[0.7rem] text-zinc-600 dark:text-zinc-300">
                  {t("settings.gatewayStateLine", { state: gatewayDiskState })}
                </p>
              ) : null}
              {gatewayDiskExit ? (
                <p className="mt-1 font-mono text-[0.7rem] text-zinc-600 dark:text-zinc-300">
                  {t("settings.gatewayExitLine", { detail: gatewayDiskExit })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Section>

      <Section icon={Send} title={t("settings.telegramTitle")} desc={t("settings.telegramLead")}>
        <TelegramSettingsBlock />
        <div className="mt-4 border-t border-zinc-200/80 pt-3 dark:border-zinc-700/80">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
            {t("settings.telegramPairingTitle")}
          </p>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500 mb-3">
            {t("settings.telegramPairingLead")}
          </p>
          <PairingSettingsBlock platform="telegram" />
        </div>
      </Section>

      <Section icon={Building2} title={t("settings.feishuTitle")} desc={t("settings.feishuLead")}>
        <FeishuQrRouteBlock
          onHermesRunningChange={(running) =>
            onStatusChange(status ? { ...status, pythonRunning: running } : status)
          }
        />
      </Section>

      <Section icon={Bot} title={t("settings.qqTitle")} desc={t("settings.qqLead")}>
        <QqbotQrRouteBlock
          onHermesRunningChange={(running) =>
            onStatusChange(status ? { ...status, pythonRunning: running } : status)
          }
        />
      </Section>

      <Section icon={QrCode} title={t("settings.weixinTitle")} desc={t("settings.weixinLead")}>
        <WeixinQrRouteCBlock
          onHermesRunningChange={(running) =>
            onStatusChange(status ? { ...status, pythonRunning: running } : status)
          }
        />
      </Section>

      <Section icon={Store} title={t("settings.dingtalkTitle")} desc={t("settings.dingtalkLead")}>
        <DingTalkSettingsBlock />
      </Section>

      <Section icon={Store} title={t("settings.wecomTitle")} desc={t("settings.wecomLead")}>
        <WeComSettingsBlock />
      </Section>
    </>
  );
}
