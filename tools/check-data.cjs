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

assert(D.validation.status === "PASS", "Frozen base validation is not PASS");
assert(
  D.validation.materialAudit.status === "PASS",
  "Material audit is not PASS",
);
assert(D.validation.craftWidth === 46, "Crafting hall width changed");
assert(
  D.validation.workingStorageChests === 86,
  "Working storage count changed",
);
assert(D.validation.allChestsDetailed === 93, "Detailed chest count changed");

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
  new Set(ENG.devices.map((device) => device.id)).size === ENG.devices.length,
  "Duplicate engineering ids",
);

console.log(
  `PASS: ${D.objects.length} objects, ${D.solids.length} solids, ${ENG.devices.length} engineering devices`,
);
