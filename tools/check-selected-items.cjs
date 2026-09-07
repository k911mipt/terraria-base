#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const {loadScene, SCENES} = require("./lib/load-scene.cjs");
let mutations = 0, displays = 0;
for (const entry of SCENES) {
  const {run, runFile} = loadScene(entry);
  runFile("js/runtime/validation.js");
  runFile("js/runtime/model.js");
  const before = run("JSON.stringify(D)");
  for (const [regions, specs, background] of [["solids", "BLOCK_SPECS", false], ["backgrounds", "WALL_SPECS", true]]) {
    for (const mat of run(`[...new Set(D.${regions}.map(r => r.mat))]`)) {
      const key = JSON.stringify(mat);
      run(`globalThis.originalSpec = ${specs}[${key}]`);
      for (const field of ["itemEn", "paintEn"]) {
        try {
          run(`${specs}[${key}] = {...originalSpec, ${field}: "UNREGISTERED_SELECTED_ITEM"}`);
          assert(run(`validateUsedMaterialSpecs(D,BLOCK_SPECS,WALL_SPECS,MAT,WALL).some(e => e.includes("UNREGISTERED_SELECTED_ITEM") && /X-?\\d+ Y-?\\d+/.test(e))`));
          assert.match(run(`inspectorMaterialSpec(${key},${background}).itemRu`), /Ошибка данных/);
          mutations++;
        } finally { run(`${specs}[${key}] = originalSpec`); }
      }
    }
  }
  const count = run("D.objects.length");
  for (let i = 0; i < count; i++) {
    run(`globalThis.originalObject = D.objects[${i}]`);
    for (const prefix of ["foreground", "chest"]) {
      if (!run(`hasObjectSpec(originalObject, "${prefix}")`)) continue;
      for (const suffix of ["ItemEn", "PaintEn"]) {
        try {
          run(`D.objects[${i}] = {...originalObject, ${prefix + suffix}: "UNREGISTERED_SELECTED_ITEM"}`);
          assert(run(`validateObjectData(D).errors.some(e => e.includes(originalObject.id) && e.includes("UNREGISTERED_SELECTED_ITEM"))`));
          assert(run(`objectMetadata(D.objects[${i}]).problems.length > 0`));
          mutations++;
        } finally { run(`D.objects[${i}] = originalObject`); }
      }
    }
    const carrier = run("installedDisplayItem(originalObject)");
    if (!carrier) continue;
    displays++;
    assert([498, 2699, 3270].includes(carrier.itemId));
    assert.notEqual(carrier.itemEn, carrier.contents, "display contents are not the installed carrier");
    assert.equal(run("originalObject.w"), carrier.w);
    assert.equal(run("originalObject.h"), carrier.h);
    try {
      run(`D.objects[${i}] = {...originalObject, w: originalObject.w + 1}`);
      assert(run("validateObjectData(D).errors.some(e => e.includes('footprint') && e.includes(originalObject.id))"));
      mutations++;
    } finally { run(`D.objects[${i}] = originalObject`); }
  }
  assert.deepEqual(Array.from(run("validateObjectData(D).errors")), []);
  assert.equal(run("JSON.stringify(D)"), before);
  assert.equal(run("installedDisplayItem({kind:'display', foregroundItemEn:'Unknown Painting'})"), null);
  assert.equal(run("installedDisplayItem({kind:'__proto__'})"), null);
  assert.equal(run("installedDisplayItem(null)"), null);
  console.log(`PASS ${entry}: selected names/paints, carrier identities and unchanged data`);
}
console.log(`PASS ${mutations} selected-item mutations; ${displays} real display carriers`);
