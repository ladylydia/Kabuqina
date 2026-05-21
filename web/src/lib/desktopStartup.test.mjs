/* global URL */
import assert from "node:assert/strict";
import fs from "node:fs";

const libSource = fs.readFileSync(new URL("../../../tauri/src/lib.rs", import.meta.url), "utf8");

const bootstrapStart = libSource.indexOf("async fn bootstrap(");
assert.ok(bootstrapStart >= 0, "Tauri bootstrap() should exist.");

const pythonBootstrapStart = libSource.indexOf("let hermes_ok = async", bootstrapStart);
assert.ok(pythonBootstrapStart >= 0, "bootstrap() should start embedded Hermes through hermes_ok.");

const edgeStartup = libSource.indexOf("state.edge_browser.start", bootstrapStart);
assert.ok(edgeStartup >= 0, "bootstrap() should start the Edge browser helper.");

const setupSuccessPath = libSource.lastIndexOf("return Ok(());", edgeStartup);
assert.ok(setupSuccessPath >= 0, "bootstrap() should have a setup success path before slow services.");

assert.ok(
  libSource.slice(setupSuccessPath, edgeStartup).includes("reveal_main();"),
  "The main window should be revealed before slow embedded services start so first-run onboarding is not hidden behind backend boot.",
);

assert.ok(
  edgeStartup < pythonBootstrapStart,
  "The test expects Edge helper startup to remain before embedded Hermes/Python startup.",
);
