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
    <section className={className}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <Icon className="size-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{title}</h2>
          {desc && (
            <p className="mt-0.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{desc}</p>
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
