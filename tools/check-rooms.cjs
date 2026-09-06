#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { loadScene, SCENES } = require("./lib/load-scene.cjs");

for (const entry of SCENES) {
  const { run, runFile } = loadScene(entry);
  runFile("js/runtime/core.js");
  const snapshot = run("JSON.stringify(D)");
  // Validate all explicit references, including engineering objects shown in tips.
  run("[...D.objects, ...ENG.devices, ...ENG.futureSlots].forEach(o => roomForObject(D, o))");
  const doors = Array.from(run('D.objects.filter(o => o.kind === "door").map(o => o.id)'));
  for (const id of doors) {
    const key = JSON.stringify(id);
    const actual = run(`roomForObject(D, D.objects.find(o => o.id === ${key}))?.id || null`);
    const expected = run(`(() => {
      const o = D.objects.find(o => o.id === ${key});
      return o.room || roomAt(D, o.x, o.y)?.id || null;
    })()`);
    assert.equal(actual, expected, `${entry}: ${id}`);
  }
  assert.equal(run("roomAt(D, D.bounds.xMax + 100, D.bounds.yMax + 100)"), null);
  assert.equal(run("roomForObject(D, null)"), null);
  assert.throws(() => run('roomForObject(D, { id: "BAD_ROOM", x: 0, y: 0, room: "MISSING_ROOM" })'),
    /BAD_ROOM.*unknown room MISSING_ROOM/);

  // Preserve the previous smallest-area rule, then original order for ties.
  run(`globalThis.overlapScene = { title: "fixture", rooms: [
    { id: "large", x1: 0, y1: 0, x2: 20, y2: 20 },
    { id: "first", x1: 2, y1: 2, x2: 10, y2: 10 },
    { id: "second", x1: 2, y1: 2, x2: 10, y2: 10 },
  ] }`);
  assert.equal(run('roomAt(overlapScene, 3, 3).id'), "first");
  assert.equal(run('roomForObject(overlapScene, { id: "NO_ROOM", x: 3, y: 3 }).id'), "first");
  assert.equal(run('roomForObject(overlapScene, { id: "LEGACY_EMPTY", x: 3, y: 3, room: "" }).id'), "first");
  assert.equal(run('roomForObject(overlapScene, { id: "EXPLICIT", x: 3, y: 3, room: "large" }).id'), "large");
  assert.equal(run('roomAt(overlapScene, 10, 10).id'), "first");

  if (entry === "underground.html") {
    assert.equal(run('roomForObject(D, D.objects.find(o => o.id === "UG_MECH_GOBLIN")).id'),
      "underground_goblin");
    assert.equal(run('(() => { const o = D.objects.find(o => o.id === "UG_MECH_GOBLIN"); return roomAt(D, o.x, o.y).id; })()'),
      "underground_mechanic", "the geographical tile area intentionally differs from ownership");
  }
  assert.equal(run("JSON.stringify(D)"), snapshot, "lookups must not mutate geometry or order");
  console.log(`PASS ${entry}: shared object ownership, ${doors.length} boundary doors and negative cases`);
}
