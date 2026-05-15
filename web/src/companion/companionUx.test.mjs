/* global URL */
import assert from "node:assert/strict";
import fs from "node:fs";

const companionSource = fs.readFileSync(new URL("./CompanionWindow.tsx", import.meta.url), "utf8");
const compactBranch = companionSource.match(
  /if \(mode === "compact"\) \{([\s\S]*?)\n {2}\}\n\n {2}return \(/,
)?.[1] || "";

assert.match(
  companionSource,
  /type CompanionMode = "expanded" \| "compact"/,
  "CompanionWindow should model expanded and compact modes.",
);

assert.match(
  companionSource,
  /cmd_set_companion_mode/,
  "CompanionWindow should call the Tauri companion mode resize command.",
);

assert.match(
  companionSource,
  /setMode\("compact"\)/,
  "The minimize action should enter compact mode.",
);

assert.match(
  companionSource,
  /setMode\("expanded"\)/,
  "The compact pill should be able to expand back.",
);

assert.match(
  companionSource,
  /onDoubleClick=\{\(\) => void setCompanionMode\("expanded"\)\}/,
  "The compact pill should expand to the full companion window on double-click.",
);

assert.doesNotMatch(
  compactBranch,
  /onMouseDown=\{startDrag\}|data-tauri-drag-region/,
  "The compact pill must not start window dragging before click and double-click handlers can fire.",
);

assert.match(
  companionSource,
  /document\.documentElement\.style\.overflow = "hidden"[\s\S]*document\.body\.style\.overflow = "hidden"/,
  "The companion window should suppress page scrollbars.",
);

assert.match(
  companionSource,
  /new LogicalSize\(320, 160\)/,
  "The expanded fallback size should match the full companion window size.",
);

assert.doesNotMatch(
  companionSource,
  /onClick=\{\(\) => setNotice\(null\)\}/,
  "The minimize button must not merely clear the current notice.",
);
