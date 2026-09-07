#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { loadScene, SCENES } = require("./lib/load-scene.cjs");

for (const entry of SCENES) {
  const { run, runFile } = loadScene(entry);
  runFile("js/runtime/placement-contract.js");
  runFile("js/runtime/validation.js");
  runFile("js/runtime/model.js");
  const errors = () => Array.from(run("validateUsedWallSpecs(D, WALL_SPECS)"));
  assert.deepEqual(errors(), [], entry);
  assert.equal(run("wallSafetyLabel({ safe: true })"), "Да, поставленная игроком");
  assert.equal(run("wallSafetyLabel({ safe: false })"), "Нет");
  assert.equal(run("wallSafetyLabel({ safe: null }, false)"), null);
  assert.match(run("wallSafetyLabel({})"), /Ошибка данных.*safe/);
  assert.match(run("wallSafetyLabel({ safe: null })"), /Ошибка данных.*safe/);

  // Negative checks exercise every USED wall, including per-scene extensions.
  const materials = Array.from(run("[...new Set(D.backgrounds.map(r => r.mat))]"));
  for (const material of materials) {
    const key = JSON.stringify(material);
    run(`globalThis.originalSpec = WALL_SPECS[${key}]; WALL_SPECS[${key}] = { ...originalSpec };`);
    run(`delete WALL_SPECS[${key}].safe`);
    assert(errors().some(message => message.includes(material) && message.includes("safe")),
      `${entry}: deleting safe from ${material} must be rejected`);
    run(`WALL_SPECS[${key}].safe = false`);
    assert.deepEqual(errors(), [], `${entry}: legitimate safe:false must stay valid`);
    for (const field of ["itemRu", "itemEn", "paintRu", "paintEn", "note"]) {
      run(`WALL_SPECS[${key}] = { ...originalSpec }; delete WALL_SPECS[${key}][${JSON.stringify(field)}]`);
      assert(errors().some(message => message.includes(material) && message.includes(field)),
        `${entry}: missing ${field} in ${material} must be rejected`);
    }
    run(`delete WALL_SPECS[${key}]`);
    assert(errors().some(message => message.includes(material) && message.includes("specification")));
    run(`WALL_SPECS[${key}] = originalSpec`);
  }

  if (entry === "underground.html") {
    for (const [x, y] of [[24, 8], [29, 10], [44, 9]]) {
      assert.equal(run(`wallSafetyLabel(WALL_SPECS[rectAt(D.backgrounds, ${x}, ${y}).mat])`),
        "Да, поставленная игроком", `control tile X${x} Y${y}`);
    }
  }
  console.log(`PASS ${entry}: ${materials.length} used wall specs and negative mutations`);
}
