#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { loadScene, SCENES } = require("./lib/load-scene.cjs");
let mutations = 0, objects = 0;
for (const entry of SCENES) {
  const { run, runFile } = loadScene(entry);
  for (const file of ["core", "placement-contract", "validation", "model", "render-tiles", "render-cache", "inspector", "render-base", "render-objects",
    ...(entry === "index.html" ? [] : [entry.replace(".html", "") + "-extensions"])])
    runFile(`js/runtime/${file}.js`);
  const check = () => Array.from(run("validateObjectRenderers(D)"));
  const original = run("JSON.stringify(D)");
  assert.deepEqual(check(), [], entry);
  const count = run("D.objects.length");
  for (let i = 0; i < count; i++) {
    run(`globalThis.object = D.objects[${i}]; globalThis.kind = object.kind; globalThis.style = object.style;`);
    const where = run("`${D.title}: object ${object.id} at X${object.x} Y${object.y}`");
    for (const field of ["kind", "style"]) {
      for (const value of ["UNREGISTERED", "__proto__", "constructor", null]) {
        try {
          run(`object.${field} = ${JSON.stringify(value)}`);
          assert(check().some(error => error.startsWith(where) && error.includes("unregistered renderer")), where);
          assert.throws(() => run("drawObjectSprite(null, object)"), /Unregistered object renderer/);
          mutations++;
        } finally { run("object.kind = kind; object.style = style;"); }
      }
    }
    run("globalThis.draw = OBJECT_RENDERERS.get(kind).get(style)");
    for (const change of ["delete", "not-function"]) {
      try {
        run(change === "delete" ? "OBJECT_RENDERERS.get(kind).delete(style)" :
          "OBJECT_RENDERERS.get(kind).set(style, 'not a function')");
        assert(check().some(error => error.startsWith(where)), where);
        assert.throws(() => run("drawObjectSprite(null, object)"), /Unregistered object renderer/);
        mutations++;
      } finally { run("OBJECT_RENDERERS.get(kind).set(style, draw)"); }
    }
    // Prove that rendering uses the validated function, not a parallel dispatcher.
    try {
      run(`globalThis.seen = null; globalThis.contextToken = {};
        OBJECT_RENDERERS.get(kind).set(style, (ctx, value) => { seen = [ctx, value]; });
        drawObjectSprite(contextToken, object);`);
      assert.equal(run("seen[0] === contextToken && seen[1] === object"), true);
    } finally { run("OBJECT_RENDERERS.get(kind).set(style, draw)"); }
    objects++;
  }
  assert.deepEqual(check(), []);
  assert.equal(run("JSON.stringify(D)"), original, "renderer checks mutated the scene");
  // A duplicate registration must not partially add any preceding new style.
  assert.throws(() => run(`registerObjectRenderer(kind, ["new-style", style], draw)`), /Duplicate/);
  assert.equal(run(`OBJECT_RENDERERS.get(kind).has("new-style")`), false);
  for (const registration of [
    `registerObjectRenderer("new-kind", ["same", "same"], draw)`,
    `registerObjectRenderer("new-kind", [], draw)`,
    `registerObjectRenderer("new-kind", [null], draw)`,
    `registerObjectRenderer("new-kind", ["new"], null)`,
  ]) assert.throws(() => run(registration), /Duplicate|Invalid/);
  assert.equal(run('OBJECT_RENDERERS.has("new-kind")'), false);
  // Used styles with dedicated procedural colors do NOT require a STYLE entry.
  assert(run("D.objects.filter(o => !Object.hasOwn(STYLE, o.style)).every(o => rendererForObject(o))"));
  // Runtime rejects before accessing a canvas and never publishes readiness.
  run(`globalThis.elements = Object.fromEntries(["iname", "idesc", "ikv"].map(id => [id, {}]));
    globalThis.document = {getElementById: id => elements[id]};
    globalThis.viewport = {removeAttribute: name => { globalThis.removed = name; }};
    globalThis.startupComplete = true;
    D.objects[0].style = "UNREGISTERED";`);
  assert.throws(() => run("buildBaseCaches()"), /Object renderer contract:.*unregistered renderer/);
  assert.equal(run("startupComplete"), false);
  assert.equal(run("removed"), "data-ready");
  assert.equal(run("elements.iname.textContent"), "Ошибка отрисовки объектов");
  assert.match(run("elements.ikv.textContent"), /UNREGISTERED/);
  console.log(`PASS ${entry}: ${count} objects, exact renderer resolution and startup guard`);
}
console.log(`PASS ${objects} objects, ${mutations} renderer mutations`);
