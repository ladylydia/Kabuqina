import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = {
  variant?: Variant;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
};

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition select-none";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-sky-600 text-white shadow-sm shadow-sky-900/10 hover:bg-sky-500 active:scale-[0.98] active:bg-sky-700 dark:bg-[#3B5BC7] dark:text-white dark:hover:bg-[#4D6CE0]",
  secondary:
    "border border-sky-200/90 bg-white text-sky-700 shadow-sm shadow-sky-900/5 hover:border-sky-300 hover:bg-sky-50 active:scale-[0.98] active:bg-sky-100/70 dark:border-sky-800/70 dark:bg-sky-950/25 dark:text-sky-100 dark:hover:border-sky-700 dark:hover:bg-sky-900/35",
  danger:
    "border border-red-200/90 bg-red-50 text-red-700 hover:bg-red-100 active:scale-[0.98] dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50",
  ghost:
    "text-sky-700 hover:bg-sky-50 active:scale-[0.98] dark:text-sky-300 dark:hover:bg-sky-950/40",
};

export function PlatformButton({
  variant = "secondary",
  children,
  onClick,
  disabled,
  type = "button",
  className,
  title,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        base,
        variantStyles[variant],
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        className
      )}
    >
      {children}
    </button>
  );
}
