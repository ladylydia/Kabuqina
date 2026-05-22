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
    `kabuqina-provider-ux-${path.basename(relativePath, ".ts")}-${process.pid}-${Date.now()}.mjs`,
  );
  fs.writeFileSync(tempPath, compiled, "utf8");
  try {
    return await import(pathToFileURL(tempPath).href);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const { PROVIDERS } = await importTs("../lib/providers.ts");
const providerIds = PROVIDERS.map((provider) => provider.id);

for (const id of ["alibaba", "zai", "kimi-coding", "kimi-coding-cn", "minimax", "minimax-cn"]) {
  assert.ok(providerIds.includes(id), `Provider dropdown metadata should include Hermes provider ${id}.`);
}

const getAccessPassSource = fs.readFileSync(new URL("./steps/GetAccessPass.tsx", import.meta.url), "utf8");

assert.match(
  getAccessPassSource,
  /customProviderId/,
  "Custom provider mode should expose state for a manually entered provider id.",
);

assert.match(
  getAccessPassSource,
  /providerForSave[\s\S]*customProviderId\.trim\(\)\s*\|\|\s*"custom"[\s\S]*provider:\s*providerForSave/,
  "Saving the custom option should persist the user-entered provider id when provided.",
);

assert.match(
  getAccessPassSource,
  /"kimi-coding-cn":\s*\{\s*host:\s*"https:\/\/api\.kimi\.com\/coding\/v1"/,
  "Kimi / Moonshot (China) should use the current Kimi Coding base URL.",
);

assert.doesNotMatch(getAccessPassSource, /Deepseek API Key|自定义AI模型/);
assert.match(getAccessPassSource, /hd-wizard-title[\s\S]*t\("pass\.title"\)/);

const shellFrameSource = fs.readFileSync(new URL("./ShellFrame.tsx", import.meta.url), "utf8");
const indexCssSource = fs.readFileSync(new URL("../index.css", import.meta.url), "utf8");
assert.match(shellFrameSource, /onboarding\.progress/);
assert.match(shellFrameSource, /hd-wizard-progress/);
assert.match(indexCssSource, /\.hd-wizard-title/);
assert.match(indexCssSource, /\.hd-wizard-lead/);
