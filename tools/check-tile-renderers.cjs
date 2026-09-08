#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {loadAudit, SCENES} = require("./lib/load-audit.cjs");
let mutations = 0, materials = 0;
for (const entry of SCENES) {
  const {run, compute} = loadAudit(entry);
  const original = run("JSON.stringify(D)");
  assert.deepEqual(Array.from(run("validateTileRenderers(D)")), [], entry);
  for (const [layer, field] of [["block", "solids"], ["wall", "backgrounds"]]) {
    for (const material of run(`[...new Set(D.${field}.map(r => r.mat))]`)) {
      run(`globalThis.layer = ${JSON.stringify(layer)}; globalThis.material = ${JSON.stringify(material)};
        globalThis.registry = TILE_RENDERERS[layer]; globalThis.savedDraw = registry.get(material);`);
      assert.equal(run("typeof savedDraw"), "function");
      for (const change of ["registry.delete(material)", "registry.set(material, null)", "registry.set(material, 'not a function')"]) {
        try {
          run(change);
          const errors = Array.from(run("validateTileRenderers(D)"));
          assert(errors.some(e => e.includes(material) && /X-?\d+ Y-?\d+/.test(e)), `${entry}: ${material}`);
          assert.throws(() => run("drawRegisteredTile(layer, null, material, 1, 2)"), /Unregistered tile renderer/);
          assert(compute().errors.some(e => e.rule === "renderer-contract" && e.message.includes(material)));
          mutations++;
        } finally {run("registry.set(material, savedDraw)");}
      }
      // The drawing API and validation use the same registered function and exact arguments.
      try {
        run("globalThis.seen = null; globalThis.token = {}; registry.set(material, (...args) => {seen=args;});");
        run(`${layer === "block" ? "tileMaterial" : "tileWall"}(token, material, -5, 7)`);
        assert(run("seen[0] === token && seen[1] === material && seen[2] === -5 && seen[3] === 7"));
      } finally {run("registry.set(material, savedDraw)");}
      materials++;
    }
  }
  assert.throws(() => run(`registerTileRenderer(layer, ["new", material], savedDraw)`), /Duplicate/);
  assert(!run('registry.has("new")'), "duplicate registration must be atomic");
  for (const expression of [
    `registerTileRenderer("__proto__", ["new"], savedDraw)`,
    `registerTileRenderer("block", [], savedDraw)`,
    `registerTileRenderer("block", [" "], savedDraw)`,
    `registerTileRenderer("block", ["new", "new"], savedDraw)`,
    `registerTileRenderer("block", ["new"], null)`,
  ]) assert.throws(() => run(expression), /Invalid|Duplicate/);
  for (const value of ["UNKNOWN", "constructor", "__proto__", " "]) {
    assert.equal(run(`tileRenderer("block", ${JSON.stringify(value)})`), null);
    assert.throws(() => run(`tileMaterial(null, ${JSON.stringify(value)}, 1, 2)`), /Unregistered/);
    mutations++;
  }
  assert.deepEqual(Array.from(run("validateTileRenderers(D)")), []);
  assert.equal(run("JSON.stringify(D)"), original);
  // Guard must fail before canvas access, table population, or readiness.
  run(`globalThis.elements = Object.fromEntries(['iname','idesc','ikv'].map(id=>[id,{}]));
    globalThis.document = {getElementById:id=>elements[id]};
    globalThis.viewport = {removeAttribute:name=>{globalThis.removed=name;}};
    globalThis.startupComplete = true; TILE_RENDERERS.block.delete(D.solids[0].mat);`);
  assert.throws(() => run("buildBaseCaches()"), /Tile renderer contract:.*unregistered tile renderer/);
  assert.equal(run("startupComplete"), false);
  assert.equal(run("removed"), "data-ready");
  assert.equal(run("elements.iname.textContent"), "Ошибка отрисовки материалов");
  console.log(`PASS ${entry}: explicit tile functions, shared audit, startup guard`);
}
const root = path.resolve(__dirname, "..");
for (const file of fs.readdirSync(path.join(root, "js/runtime")).filter(f => f.endsWith(".js"))) {
  const source = fs.readFileSync(path.join(root, "js/runtime", file), "utf8");
  assert(!/^\s*(tileMaterial|tileWall|drawObjectSprite|drawLight|drawPylon)\s*=/m.test(source), `${file}: global renderer reassignment`);
}
const model = fs.readFileSync(path.join(root, "js/runtime/model.js"), "utf8");
assert(!/function (inspect|tileMaterial|tileWall|buildBaseCaches)\(/.test(model), "model must contain lookup logic only");
console.log(`PASS ${materials} used tile registrations, ${mutations} negative tile mutations`);
