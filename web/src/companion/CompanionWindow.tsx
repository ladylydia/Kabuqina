import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Bell, MessageCircle, Minus, X } from "lucide-react";
import { createDesktopDeliveryNotice, type DesktopDeliveryMessage, type DesktopDeliveryNotice } from "../lib/desktopDelivery";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/cn";

const EVENT_NAME = "desktop-delivery";
/** Pixels²: move more than sqrt(this) before we call `startDragging`, so plain double‑clicks expand. */
const COMPACT_DRAG_SQ_THRESHOLD = 7 * 7;
/** Compact mascot; PNG keeps alpha; window logical size tracks intrinsic dims ÷ OS scale factor. */
const COMPACT_ASSET_URL = "/companion_compact.png";
/** Fallback logical size when intrinsic metadata cannot be read (matches legacy pill). */
const COMPACT_FALLBACK_LOGICAL_W = 120;
const COMPACT_FALLBACK_LOGICAL_H = 48;
type CompanionMode = "expanded" | "compact";

function intrinsicLogicalDimsForAsset(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const sf = await getCurrentWindow().scaleFactor();
        resolve({
          w: img.naturalWidth / sf,
          h: img.naturalHeight / sf,
        });
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.decoding = "async";
    img.src = src;
  });
}

export function CompanionWindow() {
  const { t, locale } = useI18n();
  const [notice, setNotice] = useState<DesktopDeliveryNotice | null>(null);
  const [mode, setMode] = useState<CompanionMode>("expanded");
  const sequenceRef = useRef(0);
  const compactDragRef = useRef<{
    down: boolean;
    startX: number;
    startY: number;
    started: boolean;
  }>({ down: false, startX: 0, startY: 0, started: false });

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
    let compactWidth: number | undefined;
    let compactHeight: number | undefined;
    if (next === "compact") {
      try {
        const dims = await intrinsicLogicalDimsForAsset(COMPACT_ASSET_URL);
        compactWidth = dims.w;
        compactHeight = dims.h;
      } catch (error) {
        console.error("companion compact intrinsic size failed:", error);
      }
    }
    try {
      await invoke("cmd_set_companion_mode", {
        mode: next,
        compactWidth,
        compactHeight,
      });
    } catch (error) {
      console.error("cmd_set_companion_mode failed:", error);
      try {
        const win = getCurrentWindow();
        if (next === "compact") {
          const lw = compactWidth ?? COMPACT_FALLBACK_LOGICAL_W;
          const lh = compactHeight ?? COMPACT_FALLBACK_LOGICAL_H;
          await win.setSize(new LogicalSize(lw, lh));
        } else {
          await win.setSize(new LogicalSize(320, 160));
        }
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

  const onCompactPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    compactDragRef.current = {
      down: true,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
    };
  };

  const onCompactPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const s = compactDragRef.current;
    if (!s.down || s.started) {
      return;
    }
    const dx = event.clientX - s.startX;
    const dy = event.clientY - s.startY;
    if (dx * dx + dy * dy >= COMPACT_DRAG_SQ_THRESHOLD) {
      s.started = true;
      void getCurrentWindow().startDragging().catch((error) => {
        console.error("companion compact startDragging failed:", error);
      });
    }
  };

  const resetCompactDrag = (
    target: HTMLDivElement,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (compactDragRef.current.down) {
      try {
        target.releasePointerCapture(event.pointerId);
      } catch {
        /* capture already released after OS drag */
      }
    }
    compactDragRef.current = {
      down: false,
      startX: 0,
      startY: 0,
      started: false,
    };
  };

  const onCompactPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    resetCompactDrag(event.currentTarget, event);
  };

  const onCompactPointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    resetCompactDrag(event.currentTarget, event);
  };

  if (mode === "compact") {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "hermes-titlebar-nodrag h-screen w-screen cursor-pointer touch-manipulation select-none overflow-visible",
          "rounded-none border-0 bg-transparent shadow-none",
          "outline-none ring-0 focus-visible:ring-2 focus-visible:ring-sky-400/80",
        )}
        aria-label={
          locale === "zh"
            ? "卡布奇娜伙伴：双击展开，拖拽可移动窗口"
            : "Kabuqina companion: double-click to expand, drag to move"
        }
        title={
          locale === "zh"
            ? "拖拽移动窗口 · 双击展开"
            : "Drag to move · Double-click to expand"
        }
        onPointerDown={onCompactPointerDown}
        onPointerMove={onCompactPointerMove}
        onPointerUp={onCompactPointerUp}
        onPointerCancel={onCompactPointerCancel}
        onLostPointerCapture={() => {
          compactDragRef.current = {
            down: false,
            startX: 0,
            startY: 0,
            started: false,
          };
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void setCompanionMode("expanded");
          }
        }}
        onDoubleClick={() => void setCompanionMode("expanded")}
      >
        <img
          src={COMPACT_ASSET_URL}
          alt=""
          className="pointer-events-none block h-full w-full object-contain drop-shadow-md dark:drop-shadow-lg"
          draggable={false}
        />
      </div>
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
