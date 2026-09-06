#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const { loadScene } = require("./lib/load-scene.cjs");
const { run, runFile } = loadScene("index.html");
for (const file of ["core", "validation", "model", "tables"]) runFile(`js/runtime/${file}.js`);
run(`
  globalThis.elements = Object.fromEntries(['mode','iname','idesc','ikv'].map(id=>[id,{}]));
  elements.mode.value = 'visual';
  globalThis.document = {getElementById: id=>elements[id]};
  // Visual mode has no engineering foreground overlay and does not draw here.
  engineeringDeviceAtTile = () => null;
  schedule = () => {};
`);
for (const id of ["HEART_STAT_L", "HEART_STAT_R"]) {
  run(`globalThis.statue = D.objects.find(o=>o.id===${JSON.stringify(id)});`);
  assert.equal(run("statue.engineering"), true);
  assert.equal(run("inspectorObjectMetadata(D, statue).role"), "item");
  run("inspect(statue, statue.x, statue.y)");
  const html = run("elements.ikv.innerHTML");
  assert.match(html, /Роль элемента<\/div><div>Предмет/);
  assert.match(html, /Предмет не указан/);
  assert.doesNotMatch(html, /Блока\/платформы нет/);
  // Selecting the same source object in an engineering view keeps its metadata.
  assert.equal(run("inspectorObjectMetadata(D, statue).role"), "item");
  // Synthetic ENG selections retain the separate overlay specification path.
  assert.equal(run("inspectorObjectMetadata(D, {...statue})"), null);
}
assert.equal(run("inspectorObjectMetadata(D, null)"), null);
assert.equal(run("inspectorObjectMetadata(D, {kind:'npc'}) .role"), "npc");
console.log("PASS engineering-tagged scene statues use item metadata; synthetic overlay stays separate");
