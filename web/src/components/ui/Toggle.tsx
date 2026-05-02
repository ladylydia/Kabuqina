import { cn } from "../../lib/cn";

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ value, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        value ? "bg-zinc-800 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-700",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 translate-y-0 rounded-full bg-white shadow-sm ring-0 transition-transform dark:bg-zinc-900",
          value ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}
