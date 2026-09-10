#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {loadScene, SCENES, ROOT} = require("./lib/load-scene.cjs");
for (const entry of SCENES) {
  const {run, runFile} = loadScene(entry);
  runFile("js/runtime/scene-ui.js");
  runFile("js/runtime/formatters.js");
  const ui = run("plannerUI"), html = fs.readFileSync(path.join(ROOT, entry), "utf8");
  const scriptPaths = [...html.matchAll(/<script\b[^>]*src="([^\"]+)"/g)].map(m => m[1].split("?")[0]);
  assert.equal(scriptPaths.length, 1, `${entry}: one module entry`);
  assert(html.includes('type="module"'));
  const entrySource = fs.readFileSync(path.join(ROOT, html.match(/data-planner-entry="([^"]+)"/)[1]), 'utf8');
  assert(entrySource.includes("../runtime/start.js"));
  assert(!scriptPaths.some(p => /(?:start|prepare|tables|interactions)-(?:desert|underground|jungle)/.test(p)));
  assert(html.includes(`value="${ui.initialMode}"`));
  for (const [id, target] of Object.entries(ui.focus)) {
    assert(html.includes(`id="${id}"`), `${entry}: ${id}`);
    assert(target.bounds.length === 4 && target.bounds.every(Number.isFinite));
    assert(target.bounds[0] < target.bounds[2] && target.bounds[1] < target.bounds[3]);
    if (target.mode) assert(html.includes(`value="${target.mode}"`));
  }
  if (!ui.engineering) for (const id of ["bossLeft", "museumBtn", "wiringBtn"])
    assert(!html.includes(`id="${id}"`), `${entry}: foreign hidden button ${id}`);
  const links = [...html.matchAll(/<a class="scene-tab" href="\.\/([^\"]+)"/g)].map(m => m[1]);
  assert.deepEqual(links, SCENES);
  assert.equal(run('escHtml(`<img>&"\'`)'), "&lt;img&gt;&amp;&quot;&#39;");
  assert.equal(run('paintName({paintRu:"Без краски",paintEn:"None"})'), "Без краски");
  console.log(`PASS ${entry}: explicit focus configuration, common scripts, static navigation`);
}
// Every button binding is configured once, not corrected by a later script.
const interaction = fs.readFileSync(path.join(ROOT, "js/runtime/interactions.js"), "utf8");
assert(interaction.includes("Object.entries(planner.plannerUI.focus)"));
assert(!/getElementById\("(?:bossLeft|museumBtn|wiringBtn|upper|craft)"\)\.onclick/.test(interaction));
assert(!fs.readFileSync(path.join(ROOT, "js/runtime/start.js"), "utf8").includes("insertAdjacentHTML"));
