#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const scripts = [
  "js/data/desert/layout.js",
  "js/data/desert/solids.js",
  "js/data/desert/backgrounds.js",
  "js/data/desert/objects.js",
  "js/data/desert/index.js",
  "js/data/desert/engineering.js",
];

const context = vm.createContext({ console });
for (const relative of scripts) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  vm.runInContext(source, context, { filename: relative });
}

const { D, ENG } = vm.runInContext(
  `({ D: JSON.parse(JSON.stringify(D)), ENG: JSON.parse(JSON.stringify(ENG)) })`,
  context,
);

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const ids = D.objects.map((object) => object.id);
assert(new Set(ids).size === ids.length, "Object IDs must be unique");
assert(D.rooms.length === 8, `Expected 8 rooms, found ${D.rooms.length}`);
assert(D.objects.filter((object) => object.kind === "npc").length === 2, "Expected two NPCs");
assert(D.objects.filter((object) => object.kind === "pylon").length === 1, "Expected one pylon");
assert(D.objects.filter((object) => object.kind === "chest").length === 5, "Expected five local chests");
assert(D.objects.filter((object) => object.kind === "door").length === 6, "Expected six doors including the access airlock");
assert(ENG.circuits.length === 0 && ENG.devices.length === 0, "Desert v1 must not require wiring");

const water = D.objects.find((object) => object.id === "DESERT_WATER");
assert(Boolean(water), "DESERT_WATER is missing");
assert(water?.w === 45 && water?.h === 16, "Water reservoir must be 45×16");
assert(water?.w * water?.h === 720, "Water reservoir must contain 720 tiles");

const deck = D.solids.filter((solid) => solid.name?.includes("рыболовный мостик"));
assert(deck.length === 2, "Fishing deck must have two halves");
assert(deck[0]?.x2 === 46 && deck[1]?.x1 === 51, "Fishing opening must stay x47–50");

for (const object of D.objects) {
  assert(
    object.x >= D.bounds.xMin &&
      object.y >= D.bounds.yMin &&
      object.x + object.w - 1 <= D.bounds.xMax &&
      object.y + object.h - 1 <= D.bounds.yMax,
    `${object.id} lies outside scene bounds`,
  );
  if (object.customName) {
    assert(
      object.customName.length === object.customNameLength,
      `${object.id} customNameLength mismatch`,
    );
    assert(object.customNameLength <= 20, `${object.id} custom name exceeds 20 characters`);
  }
}

const serialized = JSON.stringify(D).toLowerCase();
assert(!serialized.includes("skeletron"), "Scene must not mention Skeletron");
assert(!serialized.includes("данж"), "Scene must not encode a world-specific dungeon location");

const html = fs.readFileSync(path.join(root, "desert.html"), "utf8");
for (const src of [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1])) {
  const relative = src.replace(/^\.\//, "");
  if (
    relative.startsWith("js/data/materials.js") ||
    (relative.startsWith("js/runtime/") && !relative.includes("desert"))
  )
    continue;
  assert(fs.existsSync(path.join(root, relative)), `Missing new script referenced by desert.html: ${relative}`);
}

if (errors.length) {
  console.error("DESERT CHECK: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("DESERT CHECK: PASS");
console.log(
  JSON.stringify(
    {
      rooms: D.rooms.length,
      solids: D.solids.length,
      backgrounds: D.backgrounds.length,
      objects: D.objects.length,
      chests: D.objects.filter((object) => object.kind === "chest").length,
      waterTiles: water.w * water.h,
      wiringCircuits: ENG.circuits.length,
    },
    null,
    2,
  ),
);
