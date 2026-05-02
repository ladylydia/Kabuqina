import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className, ...rest }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition select-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
        variant === "secondary" && "border border-zinc-300/80 bg-white/80 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800",
        variant === "ghost" && "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
        size === "sm" && "px-2.5 py-1 text-xs",
        size === "md" && "px-3.5 py-2 text-sm",
        className,
      )}
      {...rest}
    />
  );
}
