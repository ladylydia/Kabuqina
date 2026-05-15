import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Bell, Maximize2, MessageCircle, Minus, X } from "lucide-react";
import { createDesktopDeliveryNotice, type DesktopDeliveryMessage, type DesktopDeliveryNotice } from "../lib/desktopDelivery";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/cn";

const EVENT_NAME = "desktop-delivery";
type CompanionMode = "expanded" | "compact";

export function CompanionWindow() {
  const { t, locale } = useI18n();
  const [notice, setNotice] = useState<DesktopDeliveryNotice | null>(null);
  const [mode, setMode] = useState<CompanionMode>("expanded");
  const sequenceRef = useRef(0);

  useEffect(() => {
    const unlisten = listen<DesktopDeliveryMessage>(EVENT_NAME, ({ payload }) => {
      setNotice(
        createDesktopDeliveryNotice(
          payload,
          Date.now() + sequenceRef.current++,
          t("cron.toastFallbackTitle"),
        ),
      );
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [t]);

  useEffect(() => {
    const root = document.getElementById("root");
    const previous = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      rootOverflow: root?.style.overflow,
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (root) {
      root.style.overflow = "hidden";
    }

    return () => {
      document.documentElement.style.overflow = previous.htmlOverflow;
      document.body.style.overflow = previous.bodyOverflow;
      if (root && previous.rootOverflow !== undefined) {
        root.style.overflow = previous.rootOverflow;
      }
    };
  }, []);

  const title = notice?.title || (locale === "zh" ? "小娜待机中" : "Nana is here");
  const preview = notice?.preview || (locale === "zh" ? "需要时点开主窗口就好。" : "Open the main window whenever you need me.");

  const hide = () => {
    void invoke("cmd_hide_companion");
  };

  const openMain = () => {
    void invoke("cmd_focus_main_window");
  };

  const setCompanionMode = async (next: CompanionMode) => {
    try {
      await invoke("cmd_set_companion_mode", { mode: next });
    } catch (error) {
      console.error("cmd_set_companion_mode failed:", error);
      try {
        await getCurrentWindow().setSize(
          next === "compact"
            ? new LogicalSize(120, 48)
            : new LogicalSize(320, 160),
        );
      } catch (fallbackError) {
        console.error("companion setSize fallback failed:", fallbackError);
      }
    }
    if (next === "compact") {
      setMode("compact");
    } else {
      setMode("expanded");
    }
  };

  const startDrag = (event: React.MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    void getCurrentWindow().startDragging().catch((error) => {
      console.error("companion startDragging failed:", error);
    });
  };

  if (mode === "compact") {
    return (
      <button
        type="button"
        className={cn(
          "group flex h-screen w-screen cursor-pointer select-none items-center gap-2 overflow-hidden rounded-full border border-white/60 bg-white/90 px-2 pr-3 text-left text-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-200",
          "max-h-[100dvh] max-w-[100dvw] overscroll-none hover:bg-white hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)]",
          "dark:border-zinc-700/50 dark:bg-zinc-900/90 dark:text-zinc-100",
          "dark:hover:bg-zinc-900 dark:hover:shadow-[0_6px_28px_rgba(0,0,0,0.25)]",
        )}
        onClick={() => void setCompanionMode("expanded")}
        onDoubleClick={() => void setCompanionMode("expanded")}
        aria-label={t("companion.expand")}
        title={t("companion.expand")}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-sky-100 shadow-sm dark:from-sky-950/60 dark:to-sky-900/40">
          <img src="/kabuqina_na_blue_48.png" alt="" className="h-5 w-5" />
        </span>
        <span className="min-w-0 truncate text-xs font-semibold tracking-tight">
          {locale === "zh" ? t("companion.idleShort") : "Nana"}
        </span>
        <Maximize2 className="ml-0.5 h-3 w-3 shrink-0 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "select-none cursor-move",
        "h-screen w-screen overflow-hidden rounded-2xl border border-white/60 bg-white/85 p-3 text-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl",
        "dark:border-zinc-700/50 dark:bg-zinc-900/85 dark:text-zinc-100",
      )}
      onMouseDown={startDrag}
      data-tauri-drag-region
    >
      <div className="flex h-full items-center gap-2.5">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
          notice
            ? "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 dark:from-amber-950/50 dark:to-amber-900/30 dark:text-amber-400"
            : "bg-gradient-to-br from-sky-50 to-sky-100 text-sky-600 dark:from-sky-950/50 dark:to-sky-900/30 dark:text-sky-400"
        )}>
          {notice ? <Bell className="h-5 w-5" strokeWidth={2.25} aria-hidden /> : <img src="/kabuqina_na_blue_48.png" alt="" className="h-6 w-6" />}
        </div>
        <div
          className="min-w-0 flex-1"
          data-tauri-drag-region
        >
          <p className="truncate text-base font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
            {preview}
          </p>
        </div>
        <div className="hermes-titlebar-nodrag flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={openMain}
            onMouseDown={(event) => event.stopPropagation()}
            className="flex h-8 w-8 cursor-default items-center justify-center rounded-lg text-zinc-500 transition hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/50 dark:hover:text-sky-400"
            aria-label={t("cron.toastOpen")}
            title={t("cron.toastOpen")}
          >
            <MessageCircle className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => void setCompanionMode("compact")}
            onMouseDown={(event) => event.stopPropagation()}
            className="flex h-8 w-8 cursor-default items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
            aria-label={t("companion.minimize")}
            title={t("companion.minimize")}
          >
            <Minus className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={hide}
            onMouseDown={(event) => event.stopPropagation()}
            className="flex h-8 w-8 cursor-default items-center justify-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            aria-label={t("shell.close")}
            title={t("shell.close")}
          >
            <X className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
