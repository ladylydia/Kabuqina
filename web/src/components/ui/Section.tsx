import type { LucideIcon } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
};

export function Section({ icon: Icon, title, desc, children, className }: Props) {
  return (
    <section
      className={`hd-glass-subtle rounded-[var(--radius-shell-lg)] p-5 sm:p-6 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
            <Icon className="size-[1.125rem]" strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[0.9375rem] font-semibold leading-5 text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {desc && (
            <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {desc}
            </p>
          )}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
