import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const brandDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(brandDir, "../../../public");
const heroPath = path.join(publicDir, "kabuqina_hero_scene.svg");
const exportSource = fs.readFileSync(new URL("./exportBrandSvgs.ts", import.meta.url), "utf8");
const sceneSource = fs.readFileSync(new URL("./KabuqinaSceneSvg.tsx", import.meta.url), "utf8");

assert.match(exportSource, /kabuqina_hero_scene\.svg/, "Export script should write the empty-chat hero scene asset.");
assert.match(sceneSource, /embedded\?: boolean/, "Scene component should support flattened SVG export.");
assert.ok(fs.existsSync(heroPath), "Hero scene SVG should exist under web/public.");

const heroSvg = fs.readFileSync(heroPath, "utf8");
assert.match(heroSvg, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
assert.match(heroSvg, /viewBox="0 0 775 685"/);
assert.match(heroSvg, /aria-label="Kabuqina chat hero — cup on gingham coaster"/);
assert.doesNotMatch(heroSvg, /<svg[^>]*><svg/, "Exported hero scene should not contain nested SVG documents.");
assert.match(heroSvg, /#8f75a8/, "Exported hero scene should use the current coaster line color token.");
assert.match(heroSvg, /M 70 41\.32 C 99 43\.2 99 66\.8 70 69\.2/, "Exported hero scene should include the current cup handle geometry.");
