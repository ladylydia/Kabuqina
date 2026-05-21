import { cn } from "../lib/cn";

/** Kabuqina mascot — CSS coffee cup used in chat and the compact desktop pill. */
export function CompanionCup({ className }: { className?: string }) {
  return (
    <div className={cn("kq-companion-cup", className)} aria-hidden>
      <div className="kq-companion-cup-body" />
      <div className="kq-companion-cup-handle" />
      <div className="kq-companion-cup-face">
        <div className="kq-companion-cup-eye" />
        <div className="kq-companion-cup-eye" />
      </div>
      <div className="kq-companion-cup-blush left" />
      <div className="kq-companion-cup-blush right" />
    </div>
  );
}
