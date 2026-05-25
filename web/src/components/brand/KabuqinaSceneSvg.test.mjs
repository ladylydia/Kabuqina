import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const brandDir = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.join(brandDir, "KabuqinaSceneSvg.tsx");

assert.ok(fs.existsSync(componentPath), "KabuqinaSceneSvg component should exist.");

const componentSource = fs.readFileSync(componentPath, "utf8");

assert.match(componentSource, /export type KabuqinaSceneVariant\s*=\s*"hero"\s*\|\s*"pill"\s*\|\s*"social"/);
assert.match(componentSource, /export type KabuqinaSceneSvgProps\s*=/);
for (const prop of ["className", "variant", "title", "decorative"]) {
  assert.match(componentSource, new RegExp(`${prop}\\??:`), `Missing ${prop} prop.`);
}

assert.match(componentSource, /from "\.\/CompanionCupSvg"/);
assert.match(componentSource, /from "\.\/KabuqinaCoasterSvg"/);
assert.match(componentSource, /from "\.\/kabuqinaBrandTokens"/);
assert.match(componentSource, /<CompanionCupSvg\b/);
assert.match(componentSource, /<KabuqinaCoasterSvg\b/);
assert.match(componentSource, /<CompanionCupSvg[\s\S]*width=\{100\}[\s\S]*height=\{100\}/);
assert.match(componentSource, /variant === "social"/);
assert.match(componentSource, /viewBox=\{layout\.viewBox\}/);
assert.match(componentSource, /aria-hidden=\{decorative \? true : undefined\}/);
assert.match(componentSource, /role=\{decorative \? undefined : "img"\}/);

for (const primitive of ["rect", "ellipse"]) {
  assert.match(componentSource, new RegExp(`<${primitive}\\b`), `Missing <${primitive}> primitive.`);
}

assert.doesNotMatch(componentSource, /<image\b|<foreignObject\b|base64/i);
