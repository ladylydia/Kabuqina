/* global URL, process */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

async function importTs(relativePath) {
  const sourcePath = new URL(relativePath, import.meta.url);
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  }).outputText;
  const tempPath = path.join(
    os.tmpdir(),
    `kabuqina-chat-ux-${path.basename(relativePath, ".ts")}-${process.pid}-${Date.now()}.mjs`,
  );
  fs.writeFileSync(tempPath, compiled, "utf8");
  try {
    return await import(pathToFileURL(tempPath).href);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const { deriveSessionPresentation } = await importTs("./sessionPresentation.ts");
const { friendlyChatError } = await importTs("./friendlyError.ts");
const sidebarSource = fs.readFileSync(new URL("./ChatSidebar.tsx", import.meta.url), "utf8");
const messageListSource = fs.readFileSync(new URL("./ChatMessageList.tsx", import.meta.url), "utf8");
const chatMessageSource = fs.readFileSync(new URL("./ChatMessage.tsx", import.meta.url), "utf8");

const now = new Date("2026-05-13T10:00:00+08:00");

assert.deepEqual(
  deriveSessionPresentation(
    {
      id: "reminder-1",
      title: "1 分钟后提醒我喝水",
      preview: "请提醒我喝水",
      last_active: Math.floor(now.getTime() / 1000),
    },
    "zh",
    now,
  ),
  {
    label: "喝水提醒",
    group: "今天",
    kind: "reminder",
    icon: "alarm",
  },
);

assert.deepEqual(
  deriveSessionPresentation(
    {
      id: "intro-1",
      title: "你是谁？",
      preview: "你是谁？",
      last_active: Math.floor(now.getTime() / 1000) - 3 * 86400,
    },
    "zh",
    now,
  ),
  {
    label: "小娜的自我介绍",
    group: "最近",
    kind: "chat",
    icon: "message",
  },
);

assert.deepEqual(
  deriveSessionPresentation(
    {
      id: "file-1",
      title: "D:\\Downloads\\report.pdf",
      preview: "帮我看看这个文件 D:\\Downloads\\report.pdf",
      last_active: Math.floor(now.getTime() / 1000),
    },
    "en",
    now,
  ),
  {
    label: "File help",
    group: "Today",
    kind: "file",
    icon: "file",
  },
);

assert.equal(
  friendlyChatError("permission denied while opening file", "zh"),
  "我现在没有权限处理这个文件。你可以先把文件拖进来，或换一个我能访问的位置。",
);

assert.equal(
  friendlyChatError("Stream failed", "en"),
  "I lost the reply halfway through. Please try again, and I can pick it back up.",
);

assert.equal(
  friendlyChatError("Tool execution failed.", "zh"),
  "这个步骤我没成功。你可以换个说法，或把要处理的文件拖进来再试。",
);

assert.doesNotMatch(
  sidebarSource,
  /data-action-priority="low"[\s\S]*t\("chat\.exportButton"\)|nav\("\/export"\)/,
  "Export chat should move out of the left rail.",
);

assert.match(
  sidebarSource,
  /data-action-priority="primary"[\s\S]*t\("cron\.title"\)/,
  "Scheduled tasks should remain the primary sidebar utility action.",
);

assert.match(
  sidebarSource,
  /collapsed\?: boolean/,
  "ChatSidebar should accept a collapsed prop.",
);

assert.match(
  sidebarSource,
  /onToggleCollapsed/,
  "ChatSidebar should expose a left-rail collapse action.",
);

assert.doesNotMatch(
  sidebarSource,
  /nav\("\/capabilities"\)|t\("capabilities\.title"\)/,
  "Capability should not be duplicated in the left rail.",
);

assert.match(
  sidebarSource,
  /onNewChat[\s\S]*onToggleCollapsed/,
  "The left-rail collapse button should sit after New Chat in the header.",
);

assert.match(
  messageListSource,
  /organizeDesktopButton[\s\S]*onOrganizeDesktop/,
  "The empty-state organize action should open the desktop organizer workflow.",
);

assert.doesNotMatch(
  messageListSource,
  /整理文件[\s\S]*帮我整理桌面文件/,
  "Desktop organizing should not regress to a prompt-only shortcut.",
);

assert.doesNotMatch(
  chatMessageSource,
  /import\s*\{[^}]*\bUser\b[^}]*\}\s*from "lucide-react"|import\s*\{[^}]*\bSparkles\b[^}]*\}\s*from "lucide-react"|Avatar|h-7 w-7[\s\S]*rounded-full|rounded-full[\s\S]*h-7 w-7/,
  "Chat message bubbles should not render user or assistant avatars.",
);

assert.doesNotMatch(
  messageListSource,
  /Sparkles|rounded-full[\s\S]*bg-sky-100[\s\S]*text-sky-600/,
  "Typing and progress rows should not render assistant avatar icons.",
);

const chatPageSource = fs.readFileSync(new URL("./ChatPage.tsx", import.meta.url), "utf8");
const desktopApiSource = fs.readFileSync(new URL("./desktop-organizer-api.ts", import.meta.url), "utf8");
const workbenchLayoutSource = fs.readFileSync(
  new URL("./hooks/useWorkbenchLayout.ts", import.meta.url),
  "utf8",
);
const workspacePanelSource = fs.readFileSync(
  new URL("./WorkspacePanel.tsx", import.meta.url),
  "utf8",
);

assert.match(
  chatPageSource,
  /handleOrganizeDesktop[\s\S]*role: "user"[\s\S]*desktopOrganizer\.userAction[\s\S]*role: "assistant"/,
  "One-click desktop organizing should add a visible user action and assistant result to chat.",
);

assert.match(
  chatPageSource,
  /useWorkbenchLayout/,
  "ChatPage should use the workbench layout hook.",
);

assert.match(
  chatPageSource,
  /WorkspacePanel/,
  "ChatPage should render the workspace panel.",
);

assert.match(
  chatPageSource,
  /buildWorkspaceState[\s\S]*messages[\s\S]*pendingAttachments[\s\S]*progress/,
  "ChatPage should derive workspace state from messages, attachments, and agent progress.",
);

assert.match(
  chatPageSource,
  /materials=\{workspace\.materials\}[\s\S]*outputs=\{workspace\.outputs\}[\s\S]*activeTool=\{workspace\.activeTool\}/,
  "ChatPage should pass live workspace materials, outputs, and active work into WorkspacePanel.",
);

assert.match(
  chatPageSource,
  /toggleFocusMode/,
  "ChatPage should expose focus mode controls.",
);

assert.match(
  chatPageSource,
  /PanelLeftOpen[\s\S]*chat\.activeWork/,
  "The left-rail expand button should sit on the left side of the center header.",
);

assert.doesNotMatch(
  chatPageSource,
  /DesktopOrganizerModal|desktopOrganizerOpen|setDesktopOrganizerOpen/,
  "One-click desktop organizing should not open a modal confirmation flow.",
);

assert.match(
  desktopApiSource,
  /cmd_desktop_organize_run/,
  "Desktop organizing should call the one-click Tauri command.",
);

assert.match(
  workbenchLayoutSource,
  /WORKBENCH_LAYOUT_KEY\s*=\s*"kabuqina\.workbench\.layout"/,
  "Workbench layout should persist under a Kabuqina-specific localStorage key.",
);

assert.match(
  workbenchLayoutSource,
  /toggleFocusMode/,
  "Workbench layout hook should expose a focus mode toggle.",
);

assert.match(
  workbenchLayoutSource,
  /isNarrow/,
  "Workbench layout hook should track narrow-window behavior.",
);

assert.match(
  workspacePanelSource,
  /workspace\.currentGoal/,
  "Workspace panel should render a Current Goal section.",
);

assert.match(
  workspacePanelSource,
  /workspace\.materials/,
  "Workspace panel should render a Materials section.",
);

assert.match(
  workspacePanelSource,
  /workspace\.outputs/,
  "Workspace panel should render an Outputs section.",
);

assert.match(
  workspacePanelSource,
  /materials\.length[\s\S]*items=\{materials\}/,
  "Workspace panel should render dynamic materials.",
);

assert.match(
  workspacePanelSource,
  /outputs\.length[\s\S]*items=\{outputs\}/,
  "Workspace panel should render dynamic outputs.",
);

assert.match(
  workspacePanelSource,
  /activeTool[\s\S]*activity\.map/,
  "Workspace panel should render current work and recent activity.",
);

assert.match(
  workspacePanelSource,
  /workspace\.quickActions/,
  "Workspace panel should render a Quick Actions section.",
);

assert.match(
  workspacePanelSource,
  /workspace-section-heading[\s\S]*bg-sky-600[\s\S]*text-white/,
  "Workspace section headings should use the Kabuqina blue-white emphasis.",
);

assert.match(
  workspacePanelSource,
  /nav\("\/export"\)[\s\S]*chat\.exportButton/,
  "Workspace quick actions should include Export Chat.",
);

assert.doesNotMatch(
  workspacePanelSource,
  /workspaceAddFile|workspaceCapture|FilePlus2|Camera/,
  "Workspace quick actions should not show unfinished Add File or Screenshot actions.",
);
