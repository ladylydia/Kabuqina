import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const brandDir = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.join(brandDir, "KabuqinaCoasterSvg.tsx");
const scenePath = path.join(brandDir, "KabuqinaSceneSvg.tsx");

assert.ok(fs.existsSync(componentPath), "KabuqinaCoasterSvg component should exist.");

const componentSource = fs.readFileSync(componentPath, "utf8");
const sceneSource = fs.readFileSync(scenePath, "utf8");

assert.match(componentSource, /export type KabuqinaCoasterVariant\s*=\s*"hero"\s*\|\s*"pill"\s*\|\s*"social"/);
assert.match(componentSource, /export type KabuqinaCoasterSvgProps\s*=/);
assert.match(componentSource, /viewBox=\{layout\.viewBox\}/);
assert.match(componentSource, /patternUnits="userSpaceOnUse"/);
assert.match(componentSource, /kabuqinaBrandTokens/);
assert.doesNotMatch(componentSource, /<image\b|<foreignObject\b|base64/i);

assert.match(sceneSource, /from "\.\/KabuqinaCoasterSvg"/);
assert.match(sceneSource, /<KabuqinaCoasterSvg\b/);
