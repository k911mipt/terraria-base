#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {ROOT, SCENES, loadScene} = require('./lib/load-scene.cjs');
const {createPlanner} = require('../js/runtime/start.js');
const {destroyPlanner} = require('../js/runtime/lifecycle.js');
const {listen, plannerTimeout} = require('../js/runtime/events.js');
const {schedule} = require('../js/runtime/core.js');
const {geometryDigest} = require('./lib/geometry-snapshot.cjs');
const beforeGlobals = new Set(Object.getOwnPropertyNames(globalThis));

for (const entry of SCENES) {
  const {entryModule} = loadScene(entry);
  const source = entryModule.createScene();
  const first = createPlanner(source, entryModule.registerRenderers);
  const second = createPlanner(source, entryModule.registerRenderers);
  const expected = geometryDigest(second);
  for (const key of ['cam', 'history', 'viewportPointers', 'TILE_RENDERERS', 'OBJECT_RENDERERS', 'D', 'ENG', 'MAT', 'WALL', 'plannerUI'])
    assert.notEqual(first[key], second[key], `${entry}: shared ${key}`);
  first.D.objects[0].x++;
  first.cam.x += 10;
  first.history.push({x: 1});
  first.plannerUI.focus.craft.bounds[0]++;
  first.TILE_RENDERERS.block.clear();
  first.OBJECT_RENDERERS.clear();
  assert.equal(geometryDigest(second), expected);
  assert.equal(second.history.length, 0);
  assert(second.TILE_RENDERERS.block.size > 0);
  assert(second.OBJECT_RENDERERS.size > 0);
  assert.equal(geometryDigest(entryModule.createScene()), expected);

  // Own one listener, timeout, scheduled frame, pointer and cache per instance.
  const target = new EventTarget(); let observed = 0;
  const callback = () => observed++;
  listen(first, target, 'test', callback);
  const pending = new Map(), cancelled = [];
  first.window = {
    setTimeout(fn) {pending.set(1, fn); return 1;},
    clearTimeout(id) {pending.delete(id);},
    requestAnimationFrame(fn) {pending.set(2, fn); return 2;},
    cancelAnimationFrame(id) {pending.delete(id); cancelled.push(id);},
  };
  first.viewport = {removeAttribute() {}, classList: {remove() {}},
    hasPointerCapture: () => true, releasePointerCapture: id => cancelled.push(id)};
  first.caches = {bg: {width: 16, height: 16}, solid: {width: 16, height: 16}};
  first.viewportPointers.set(42, {});
  plannerTimeout(first, () => observed += 100, 100);
  schedule(first);
  const delayed = [...pending.values()];
  destroyPlanner(first);
  destroyPlanner(first); // Idempotent disposal.
  assert.equal(pending.size, 0);
  assert.deepEqual(cancelled, [2, 42]);
  assert.equal(first.viewportPointers.size, 0);
  assert.equal(first.cleanups.length, 0);
  assert.equal(first.caches.bg.width, 0);
  target.dispatchEvent(new Event('test'));
  for (const fn of delayed) fn(); // Queued callbacks must also see the destroyed flag.
  assert.equal(observed, 0);
  assert.equal(first.raf, 0);
  assert.equal(second.destroyed, false);
  assert.equal(geometryDigest(second), expected);
  console.log(`PASS ${entry}: native imports, independent data/registries, owned cleanup and late callbacks`);
}

let failed;
assert.throws(() => createPlanner(require('../js/scenes/main.js').createScene(), planner => {
  failed = planner; throw new Error('intentional renderer registration failure');
}), /intentional renderer registration failure/);
assert.equal(failed.destroyed, true);
assert.equal(failed.OBJECT_RENDERERS.size, 0);
for (const name of Object.getOwnPropertyNames(globalThis)) assert(beforeGlobals.has(name), `Module leaked global ${name}`);
for (const file of fs.readdirSync(path.join(ROOT, 'js/runtime')).filter(f => f.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(ROOT, 'js/runtime', file), 'utf8');
  assert(!/\beval\s*\(|new\s+Function\s*\(|\bwith\s*\(/.test(source), `${file}: runtime source interpreter`);
  assert(!/^(?:const|let|var)\s+(?:cam|history|selected|caches|TILE_RENDERERS|OBJECT_RENDERERS)\s*=/m.test(source), `${file}: global mutable state`);
}
console.log('PASS native lifecycle has no implicit global runtime or source-code interpreter');
