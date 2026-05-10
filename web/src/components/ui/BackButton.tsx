import { ArrowLeft } from "lucide-react";

export function BackButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
    >
      <ArrowLeft className="size-4" />
      {children}
    </button>
  );
}
