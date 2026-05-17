/* global URL */
import assert from "node:assert/strict";
import fs from "node:fs";

const companionSource = fs.readFileSync(new URL("./CompanionWindow.tsx", import.meta.url), "utf8");
const compactBranch =
  companionSource.match(/if \(mode === "compact"\) \{([\s\S]*?)\n {2}\}\n\n {2}return \(/)?.[1] ||
  "";

assert.match(
  companionSource,
  /type CompanionMode = "expanded" \| "compact"/,
  "CompanionWindow should model expanded and compact modes.",
);

assert.match(companionSource, /cmd_set_companion_mode/, "CompanionWindow should call the Tauri companion mode resize command.");

assert.match(companionSource, /setMode\("compact"\)/, "The minimize action should enter compact mode.");

assert.match(companionSource, /setMode\("expanded"\)/, "The compact pill should be able to expand back.");

assert.match(
  compactBranch,
  /\/companion_compact\.png|COMPACT_ASSET_URL/,
  "Compact mode should use the PNG mascot asset.",
);

assert.match(
  companionSource,
  /intrinsicLogicalDimsForAsset/,
  "Compact sizing should read intrinsic bitmap dims and divide by scale factor.",
);

assert.match(
  companionSource,
  /compactWidth/,
  "Frontend should forward compact intrinsic width to the Rust command.",
);
assert.doesNotMatch(
  compactBranch,
  /kabuqina_na_blue/,
  "Compact pill should not use the Na raster logo.",
);

assert.match(
  companionSource,
  /onCompactPointerMove[\s\S]+getCurrentWindow\(\)\.startDragging/,
  "Compact pointer-move handler should initiate window dragging after threshold.",
);

assert.match(
  compactBranch,
  /onDoubleClick=\{\(\) => void setCompanionMode\("expanded"\)\}/,
  "Double-click compact surface should expand the companion.",
);

assert.doesNotMatch(
  compactBranch,
  /onClick=\{\(\) => void setCompanionMode\("expanded"\)\}/,
  "Compact should not expand on single click (keeps drag vs click clean).",
);

assert.match(
  compactBranch,
  /hermes-titlebar-nodrag/,
  "Compact shell should declare no-drag for reliable pointer delivery.",
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
