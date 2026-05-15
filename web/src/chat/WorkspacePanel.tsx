import { Download, FolderKanban, PanelRightClose } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/cn";

type WorkspacePanelProps = {
  className?: string;
  onCollapse: () => void;
  onOrganizeDesktop?: () => void;
};

function WorkspaceSectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="workspace-section-heading inline-flex rounded-md bg-sky-600 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm shadow-sky-900/10 dark:bg-[#3B5BC7] dark:text-white">
      {children}
    </h3>
  );
}

function WorkspaceSection({
  sectionId,
  title,
  body,
}: {
  sectionId: string;
  title: string;
  body: string;
}) {
  return (
    <section
      data-workspace-section={sectionId}
      className="border-b border-zinc-200/80 pb-4 last:border-b-0 dark:border-zinc-800"
    >
      <WorkspaceSectionHeading>{title}</WorkspaceSectionHeading>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        {body}
      </p>
    </section>
  );
}

export function WorkspacePanel({
  className,
  onCollapse,
  onOrganizeDesktop,
}: WorkspacePanelProps) {
  const { t } = useI18n();
  const nav = useNavigate();

  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col border-l border-zinc-200/90 bg-white/70 dark:border-zinc-700 dark:bg-zinc-950/40",
        className,
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t("chat.workspaceTitle")}
        </h2>
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label={t("chat.workspaceCollapse")}
          title={t("chat.workspaceCollapse")}
        >
          <PanelRightClose className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <WorkspaceSection
          sectionId="workspace.currentGoal"
          title={t("chat.workspaceCurrentGoal")}
          body={t("chat.workspaceGoalEmpty")}
        />
        <WorkspaceSection
          sectionId="workspace.materials"
          title={t("chat.workspaceMaterials")}
          body={t("chat.workspaceMaterialsEmpty")}
        />
        <WorkspaceSection
          sectionId="workspace.outputs"
          title={t("chat.workspaceOutputs")}
          body={t("chat.workspaceOutputsEmpty")}
        />

        <section data-workspace-section="workspace.quickActions">
          <WorkspaceSectionHeading>{t("chat.workspaceQuickActions")}</WorkspaceSectionHeading>
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={onOrganizeDesktop}
              className="hd-btn-ghost justify-start text-left"
            >
              <FolderKanban className="mr-2 inline h-4 w-4" aria-hidden />
              {t("chat.workspaceOrganizeDesktop")}
            </button>
            <button
              type="button"
              onClick={() => nav("/export")}
              className="hd-btn-ghost justify-start text-left"
            >
              <Download className="mr-2 inline h-4 w-4" aria-hidden />
              {t("chat.exportButton")}
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
