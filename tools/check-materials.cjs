#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { loadScene, SCENES } = require("./lib/load-scene.cjs");
let mutations = 0;
for (const entry of SCENES) {
  const { run, runFile } = loadScene(entry);
  runFile("js/runtime/validation.js");
  runFile("js/runtime/model.js");
  const check = () => Array.from(run("validateUsedMaterialSpecs(D, BLOCK_SPECS, WALL_SPECS, MAT, WALL)"));
  const original = run("JSON.stringify(D)");
  assert.deepEqual(check(), [], entry);
  for (const [background, regions, specs, palettes] of [
    [false, "solids", "BLOCK_SPECS", "MAT"],
    [true, "backgrounds", "WALL_SPECS", "WALL"],
  ]) {
    const used = Array.from(run(`[...new Set(D.${regions}.map(r => r.mat))]`));
    for (const material of used) {
      const key = JSON.stringify(material);
      run(`globalThis.savedSpec = ${specs}[${key}]; globalThis.savedPalette = ${palettes}[${key}];`);
      const rejected = (change, reason) => {
        try {
          run(change);
          const errors = check();
          assert(errors.some(e => e.includes(material) && e.includes(reason) && /X-?\d+ Y-?\d+/.test(e)),
            `${entry} ${material}: ${reason} must fail with coordinates`);
          assert.match(run(`inspectorMaterialSpec(${key}, ${background}).itemRu`), /Ошибка данных/);
          mutations++;
        } finally {
          run(`${specs}[${key}] = savedSpec; ${palettes}[${key}] = savedPalette;`);
        }
      };
      for (const field of ["itemRu", "itemEn", "paintRu", "paintEn", "note", background ? "safe" : "layer"]) {
        rejected(`${specs}[${key}] = {...savedSpec}; delete ${specs}[${key}][${JSON.stringify(field)}];`, field);
      }
      rejected(`delete ${specs}[${key}];`, "specification");
      rejected(`${specs}[${key}] = Object.create(savedSpec);`, "itemRu");
      rejected(`${specs}[${key}] = {...savedSpec, ${background ? 'safe: "true"' : 'layer: "unknown"'}};`, background ? "safe" : "layer");
      rejected(`delete ${palettes}[${key}];`, "palette");
      rejected(`${palettes}[${key}] = ${background ? '{base: "#112233"}' : '["#112233", "#445566"]'};`, "palette");
      rejected(`${palettes}[${key}] = ${background ? '["#112233", "rgba(999,0,0,.5)"]' : '{...savedPalette, light: "invalid"}'};`, "palette");
      if (background) rejected(`${palettes}[${key}] = new Array(2);`, "palette");
      assert.equal(run(`inspectorMaterialSpec(${key}, ${background}) === ${specs}[${key}]`), true);
    }
    // Unknown identifiers must not be resolved from Object.prototype.
    run(`globalThis.savedRegion = D.${regions}[0];`);
    for (const id of ["AUDIT_UNKNOWN_MATERIAL", "__proto__", "constructor"]) {
      try {
        run(`D.${regions}[0] = {...savedRegion, mat: ${JSON.stringify(id)}};`);
        assert(check().some(e => e.includes(id) && e.includes("specification")));
        assert.match(run(`inspectorMaterialSpec(${JSON.stringify(id)}, ${background}).itemRu`), /Ошибка данных/);
        mutations++;
      } finally { run(`D.${regions}[0] = savedRegion;`); }
    }
    for (const invalid of ["{...savedRegion, x1: NaN}", "{...savedRegion, x2: savedRegion.x1 - 1}"]) {
      try {
        run(`D.${regions}[0] = ${invalid};`);
        assert(check().some(e => e.includes("invalid rectangle")));
        mutations++;
      } finally { run(`D.${regions}[0] = savedRegion;`); }
    }
    // Overlaying one valid material with another does not change legality.
    run(`D.${regions}.push({...savedRegion, mat: D.${regions}.at(-1).mat});`);
    assert.deepEqual(check(), []);
    run(`D.${regions}.pop();`);
  }
  // Preserve real unsafe walls, and intentional absence of all backgrounds.
  run("globalThis.firstWall = D.backgrounds[0].mat; globalThis.wallSpec = WALL_SPECS[firstWall]; WALL_SPECS[firstWall] = {...wallSpec, safe: false};");
  assert.deepEqual(check(), []);
  assert.equal(run("wallSafetyLabel(inspectorMaterialSpec(firstWall, true))"), "Нет");
  run("WALL_SPECS[firstWall] = wallSpec; globalThis.backgrounds = D.backgrounds; D.backgrounds = [];");
  assert.deepEqual(check(), []);
  run("D.backgrounds = backgrounds;");
  assert.equal(run("JSON.stringify(D)"), original, "checks must not mutate scene data");
  // The runtime guard must reject BEFORE touching any canvas. Readiness is
  // revoked and the original diagnostic is visible, rather than a TypeError.
  run(`globalThis.elements = Object.fromEntries(["iname", "idesc", "ikv"].map(id => [id, {}]));
    globalThis.document = {getElementById: id => elements[id]};
    globalThis.viewport = {removeAttribute: name => { globalThis.removed = name; }};
    globalThis.startupComplete = true;
    globalThis.region = D.solids[0]; D.solids[0] = {...region, mat: "AUDIT_UNKNOWN_MATERIAL"};`);
  assert.throws(() => run("buildBaseCaches()"), /Material contract:.*AUDIT_UNKNOWN_MATERIAL/);
  assert.equal(run("startupComplete"), false);
  assert.equal(run("removed"), "data-ready");
  assert.match(run("elements.ikv.textContent"), /AUDIT_UNKNOWN_MATERIAL/);
  run("D.solids[0] = region;");
  assert.deepEqual(check(), []);
  console.log(`PASS ${entry}: material contract, inspector diagnostics, runtime gate and unchanged data`);
}
console.log(`PASS ${mutations} material mutations`);
