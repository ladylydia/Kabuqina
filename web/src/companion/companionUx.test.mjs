/* global URL */
import assert from "node:assert/strict";
import fs from "node:fs";

const companionSource = fs.readFileSync(new URL("./CompanionWindow.tsx", import.meta.url), "utf8");
const mainSource = fs.readFileSync(new URL("../main.tsx", import.meta.url), "utf8");
const indexCssSource = fs.readFileSync(new URL("../index.css", import.meta.url), "utf8");
const titleBarSource = fs.readFileSync(new URL("../components/WindowTitleBar.tsx", import.meta.url), "utf8");
const cupSource = fs.readFileSync(new URL("../components/CompanionCup.tsx", import.meta.url), "utf8");

assert.doesNotMatch(
  companionSource,
  /companion_compact\.png|intrinsicLogicalDimsForAsset|<img/,
  "Compact pill should render the CSS coffee cup, not a PNG mascot.",
);

assert.match(
  companionSource,
  /CompanionCup[\s\S]*kq-companion-pill-cup/,
  "CompanionWindow should wrap the shared CompanionCup in the pill layout.",
);

assert.match(
  cupSource,
  /kq-companion-cup-body[\s\S]*kq-companion-cup-handle[\s\S]*kq-companion-cup-face/,
  "CompanionCup should render the Kabuqina coffee cup structure.",
);

assert.match(
  companionSource,
  /PILL_REM_W = 5\.4[\s\S]*PILL_REM_H = 4\.7/,
  "Pill window size should track the same 5.4rem × 4.7rem cup as the empty chat hero.",
);

assert.match(
  indexCssSource,
  /kq-companion-pill-float/,
  "Pill cup should use a gentle floating animation.",
);

assert.match(
  companionSource,
  /cmd_resize_companion/,
  "CompanionWindow should resize via cmd_resize_companion.",
);

assert.match(
  companionSource,
  /onDoubleClick=\{openMain\}/,
  "Double-click compact surface should open the main window.",
);

assert.match(
  companionSource,
  /cmd_focus_main_window/,
  "Opening main should hide the compact pill via focus_main_window.",
);

assert.match(
  companionSource,
  /onCompactPointerMove[\s\S]+getCurrentWindow\(\)\.startDragging/,
  "Compact pointer-move handler should initiate window dragging after threshold.",
);

assert.match(
  mainSource,
  /kq-companion-window/,
  "Companion entry should mark the document root for transparent shell styling.",
);

assert.match(
  companionSource,
  /setShadow\(false\)/,
  "CompanionWindow should disable native window shadow on the pill.",
);

assert.match(
  titleBarSource,
  /cmd_show_companion/,
  "Title bar star should shrink the app into the compact pill.",
);
