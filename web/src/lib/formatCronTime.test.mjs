/* global process */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const sourcePath = new URL("./formatCronTime.ts", import.meta.url);
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const tempPath = path.join(os.tmpdir(), `formatCronTime-${process.pid}-${Date.now()}.mjs`);
fs.writeFileSync(tempPath, compiled, "utf8");

try {
  const { formatCronDateTime, formatCronSchedule, isIsoDateTime } = await import(
    pathToFileURL(tempPath).href
  );

  assert.equal(isIsoDateTime("2026-05-10T23:55:51.708931+08:00"), true);
  assert.equal(isIsoDateTime("0 9 * * *"), false);
  assert.equal(isIsoDateTime("every 60s"), false);

  const short = formatCronDateTime("2026-05-10T23:55:51.708931+08:00", "zh");
  assert.ok(short.length < 24, `expected compact zh time, got: ${short}`);
  assert.doesNotMatch(short, /\.708931/);

  assert.equal(formatCronSchedule("0 9 * * *", "zh"), "0 9 * * *");
  const sched = formatCronSchedule("2026-05-10T23:55:51+08:00", "zh");
  assert.ok(sched.length < 24);
} finally {
  fs.rmSync(tempPath, { force: true });
}
