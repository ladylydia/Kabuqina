import { useI18n } from "../../lib/i18n";
import {
  Activity,
  FolderOpen,
  Shield,
  Store,
  Type,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Section } from "../../components/ui/Section";
import { Button } from "../../components/ui/Button";
import { Toggle } from "../../components/ui/Toggle";
import { cn } from "../../lib/cn";
import type { Status } from "../Settings";

interface Props {
  status: Status | null;
  powerUser: boolean;
  onTogglePowerUser: (next: boolean) => void;
  showRecipeMarket: boolean;
  onToggleRecipeMarket: (next: boolean) => void;
  fontSize: "small" | "medium" | "large";
  onSetFontSize: (size: "small" | "medium" | "large") => void;
  gatewayRunning: boolean;
}

export function SettingsDisplay({
  status,
  powerUser,
  onTogglePowerUser,
  showRecipeMarket,
  onToggleRecipeMarket,
  fontSize,
  onSetFontSize,
  gatewayRunning,
}: Props) {
  const { t } = useI18n();

  return (
    <>
      <Section icon={Type} title={t("settings.fontTitle")} desc={t("settings.fontDesc")}>
        <div className="inline-flex w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-100/50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/50 sm:w-auto">
          {(
            [
              { id: "small" as const, label: t("settings.fontSmall") },
              { id: "medium" as const, label: t("settings.fontMedium") },
              { id: "large" as const, label: t("settings.fontLarge") },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onSetFontSize(id);
              }}
              className={cn(
                "min-h-[2.25rem] flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition sm:flex-initial",
                "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
                fontSize === id
                  ? "hd-btn-segment-active shadow-sm"
                  : "hd-btn-segment-idle"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section
        icon={FolderOpen}
        title={t("settings.secWorkspace")}
        desc={powerUser ? t("settings.secWorkspaceDescPower") : t("settings.secWorkspaceDescSimple")}
      >
        {powerUser ? (
          <>
            <p className="w-full break-all font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
              <span className="inline-block max-w-full rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-800/90">
                {status?.workspace ?? "…"}
              </span>
            </p>
            <Button onClick={() => invoke("cmd_open_workspace")}>{t("settings.openFolder")}</Button>
          </>
        ) : null}
      </Section>

      <Section icon={Shield} title={t("settings.powerTitle")} desc={t("settings.powerDesc")}>
        <Toggle value={powerUser} onChange={(v) => onTogglePowerUser(v)} />
      </Section>

      <Section icon={Store} title={t("settings.recipeTitle")} desc={t("settings.recipeDesc")}>
        <Toggle value={showRecipeMarket} onChange={(v) => onToggleRecipeMarket(v)} />
      </Section>

      <Section icon={Activity} title={t("settings.status")}>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${status?.pythonRunning ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
            <span>{t("settings.pyRunning")}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {status?.pythonRunning ? t("settings.yes") : t("settings.no")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${status?.hasSecret ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
            <span>{t("settings.hasPass")}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {status?.hasSecret ? t("settings.yes") : t("settings.no")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${gatewayRunning ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
            <span>{t("settings.gatewayShort")}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {gatewayRunning ? t("settings.yes") : t("settings.no")}
            </span>
          </div>
        </div>
      </Section>
    </>
  );
}
