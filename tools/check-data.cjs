#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "js/data/layout.js",
  "js/data/solids/upper.js",
  "js/data/solids/street.js",
  "js/data/solids/lower.js",
  "js/data/solids/index.js",
  "js/data/backgrounds/core.js",
  "js/data/backgrounds/boss-arena.js",
  "js/data/backgrounds/boss-platform-joins.js",
  "js/data/backgrounds/museum-pits.js",
  "js/data/backgrounds/index.js",
  "js/data/objects/routes.js",
  "js/data/objects/crafting.js",
  "js/data/objects/rooms.js",
  "js/data/objects/street.js",
  "js/data/objects/storage-left.js",
  "js/data/objects/storage-right.js",
  "js/data/objects/greenhouse.js",
  "js/data/objects/dyes.js",
  "js/data/objects/arena.js",
  "js/data/objects/eternia.js",
  "js/data/objects/museum.js",
  "js/data/objects/pits.js",
  "js/data/objects/index.js",
  "js/data/metadata.js",
  "js/data/index.js",
  "js/data/engineering/circuits.js",
  "js/data/engineering/controls.js",
  "js/data/engineering/traps.js",
  "js/data/engineering/index.js",
  "js/data/materials.js",
];
const code = files
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n\n");

const context = {};
vm.runInNewContext(code + "\nglobalThis.__plannerData = { D, ENG };", context, {
  filename: "planner-data.bundle.js",
});

const { D, ENG } = context.__plannerData;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(D.designHistory.craftWidth === 46, "Crafting hall width changed");
assert(
  D.designHistory.workingStorageChests === 86,
  "Working storage count changed",
);
assert(D.designHistory.allChestsDetailed === 93, "Detailed chest count changed");

const traps = ENG.devices.filter((device) => device.kind === "trap");
assert(traps.length === 32, "Expected exactly 32 engineering Dart Traps");

for (const [x, facing] of [
  [-18, "E"],
  [-1, "W"],
  [136, "E"],
  [153, "W"],
]) {
  const ys = traps
    .filter((trap) => trap.x === x && trap.facing === facing)
    .map((trap) => trap.y)
    .sort((a, b) => a - b);
  assert(
    ys.length === 8 && ys.every((y, index) => y === 56 + index),
    `Invalid Dart Trap column at X${x}`,
  );
}

const effectiveSolidAt = (x, y) =>
  D.solids
    .filter(
      (solid) =>
        x >= solid.x1 && x <= solid.x2 && y >= solid.y1 && y <= solid.y2,
    )
    .at(-1);

// Six wall-mounted mushroom torches must occupy air, not the grass terraces.
// Specific regression for #42; this is not a universal furniture/collision rule.
const nodeAssert = require("node:assert/strict");
function checkMushroomTorch(torch) {
  const where = `main: mushroom-torch ${torch.id} X${torch.x} Y${torch.y}`;
  assert(torch.kind === "light" && torch.w === 1 && torch.h === 1,
    `${where}: expected a one-tile torch`);
  assert(!effectiveSolidAt(torch.x, torch.y), `${where}: foreground overlap`);
  const wall = D.backgrounds.filter(r => torch.x >= r.x1 && torch.x <= r.x2 &&
    torch.y >= r.y1 && torch.y <= r.y2).at(-1);
  assert(wall?.mat === "mushroom_wall", `${where}: missing Mushroom Wall attachment`);
}
const torchDataBefore = JSON.stringify(D);
for (const [id, x, y] of [
  ["MUSH_TL1", 119, 10], ["MUSH_TR1", 122, 10],
  ["MUSH_TL2", 119, 17], ["MUSH_TR2", 122, 17],
  ["MUSH_TL3", 119, 23], ["MUSH_TR3", 122, 23],
]) {
  const torch = D.objects.find(o => o.id === id);
  assert(torch && torch.x === x && torch.y === y, `${id}: agreed torch position changed`);
  checkMushroomTorch(torch);
  // A valid attachment alone must not conceal the original overlap at Y9.
  nodeAssert.throws(() => checkMushroomTorch({...torch, y: 9}), /foreground overlap/);
  D.solids.push({x1: x, x2: x, y1: y, y2: y, mat: "gray_brick"});
  try { nodeAssert.throws(() => checkMushroomTorch(torch), /foreground overlap/); }
  finally { D.solids.pop(); }
  const backgrounds = D.backgrounds;
  D.backgrounds = [];
  try { nodeAssert.throws(() => checkMushroomTorch(torch), /missing Mushroom Wall attachment/); }
  finally { D.backgrounds = backgrounds; }
}
assert(JSON.stringify(D) === torchDataBefore, "Torch regressions mutated scene data");

for (const x of [1, 2, 133, 134]) {
  assert(
    effectiveSolidAt(x, 54)?.mat === "gray_brick",
    `Expected Gray Brick at X${x} Y54`,
  );
}

for (const [id, x, y] of [
  ["H_TOP_L", 3, 42],
  ["H_TOP_C", 67, 42],
  ["H_TOP_R", 131, 42],
  ["H_MUS_L", 3, 55],
  ["H_MUS_C", 67, 55],
  ["H_MUS_R", 131, 55],
]) {
  const hatch = D.objects.find((object) => object.id === id);
  assert(hatch && hatch.x === x && hatch.y === y, `Hatch ${id} moved`);
}

for (const [id, x, width] of [
  ["L_PIT_BRIDGE", -17, 16],
  ["R_PIT_BRIDGE", 137, 16],
]) {
  const bridge = ENG.devices.find((device) => device.id === id);
  assert(
    bridge &&
      bridge.x === x &&
      bridge.y === 54 &&
      bridge.w === width &&
      bridge.actuatorInstalled === true,
    `Bridge ${id} changed`,
  );
}

assert(ENG.circuits.length === 8, "Engineering circuit count changed");
assert(
  new Set(D.objects.map((object) => object.id)).size === D.objects.length,
  "Duplicate object ids",
);
assert(
  D.objects.filter((object) => object.eterniaSpec).length === 5,
  "Expected one Eternia stand and four planning zones",
);
assert(
  new Set(ENG.devices.map((device) => device.id)).size === ENG.devices.length,
  "Duplicate engineering ids",
);

console.log(
  `PASS: ${D.objects.length} objects, ${D.solids.length} solids, ${ENG.devices.length} engineering devices`,
);
