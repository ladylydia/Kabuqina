/* global URL */
import assert from "node:assert/strict";
import fs from "node:fs";

const platformButtonSource = fs.readFileSync(
  new URL("../components/ui/PlatformButton.tsx", import.meta.url),
  "utf8",
);
const settingsGatewaySource = fs.readFileSync(
  new URL("./settings/SettingsGateway.tsx", import.meta.url),
  "utf8",
);
const weixinSource = fs.readFileSync(
  new URL("../components/WeixinQrRouteCBlock.tsx", import.meta.url),
  "utf8",
);

assert.match(
  platformButtonSource,
  /primary:[\s\S]*bg-sky-600[\s\S]*text-white/,
  "Messaging platform primary buttons should be blue-white.",
);

assert.doesNotMatch(
  platformButtonSource,
  /primary:[\s\S]*bg-zinc-900[\s\S]*dark:bg-zinc-100/,
  "Messaging platform primary buttons should not use black-white contrast.",
);

assert.match(
  platformButtonSource,
  /secondary:[\s\S]*border-sky-200[\s\S]*bg-white[\s\S]*text-sky-700/,
  "Messaging platform default buttons should use a blue-white secondary style.",
);

assert.match(
  settingsGatewaySource,
  /platformItems\s*=\s*\[[\s\S]*telegram[\s\S]*email[\s\S]*\]/,
  "Messaging platform settings should still expose the seven platform entries.",
);

assert.match(
  settingsGatewaySource,
  /gateway-platform-nav[\s\S]*border-sky-200[\s\S]*bg-white[\s\S]*text-sky-700/,
  "Messaging platform page buttons should use the blue-white navigation style.",
);

assert.match(
  weixinSource,
  /<PlatformButton[\s\S]*manualRestartAssistant/,
  "WeChat restart action should use the shared messaging platform button style.",
);
