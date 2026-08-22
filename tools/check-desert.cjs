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
assert(D.bounds.xMin === 0 && D.bounds.xMax === 79, "Compact scene must span x0–79");
assert(D.validation.sceneWidth === 80, "Scene width snapshot must be 80 tiles");
assert(D.objects.filter((object) => object.kind === "npc").length === 2, "Expected two NPCs");
assert(D.objects.filter((object) => object.kind === "pylon").length === 1, "Expected one pylon");
assert(D.objects.filter((object) => object.kind === "chest").length === 5, "Expected five local chests");
assert(D.objects.filter((object) => object.kind === "door").length === 5, "Expected four surface doors and one descent door");
assert(
  D.objects.filter((object) => object.kind === "door" && object.room === "desert_access").length === 1,
  "Direct descent must use exactly one door",
);
assert(!D.objects.some((object) => object.id === "DESERT_ACCESS_OUTER"), "Legacy outer access door must stay removed");
assert(ENG.circuits.length === 0 && ENG.devices.length === 0, "Desert v3 must not require wiring");

const surface = D.rooms.find((room) => room.id === "desert_surface");
const fishingHall = D.rooms.find((room) => room.id === "desert_fishing");
assert(D.validation.surfaceWidth === 55, "Pavilion width snapshot must be 55 tiles");
assert(fishingHall?.x1 === 27 && fishingHall?.x2 === 54, "Fishing hall must span x27–54");
assert(fishingHall?.x2 - fishingHall?.x1 + 1 === 28, "Fishing hall must be 28 tiles wide");
assert(surface?.x1 === 10 && surface?.x2 === 76, "Surface context room must cover both palms");

const water = D.objects.find((object) => object.id === "DESERT_WATER");
assert(Boolean(water), "DESERT_WATER is missing");
assert(water?.x === 28 && water?.y === 35, "Water reservoir must start at x34 y35");
assert(water?.w === 20 && water?.h === 16, "Water reservoir must be 20×16");
assert(water?.w * water?.h === 320, "Water reservoir must contain 320 tiles");
assert(water?.tiles === 320, "Water object tile snapshot must be 320");
assert(D.validation.fishingWaterTiles === 320, "Validation water snapshot must be 320");
assert(D.validation.leftPoolGap === 0, "Pool must have no left-side gap");
assert(JSON.stringify(D.validation.poolX) === JSON.stringify([28, 47]), "Pool X snapshot mismatch");
assert(!D.backgrounds.some((background) => background.name === "Фон левой сервисной ниши"), "Legacy left service niche must stay removed");

const fishingDeck = D.solids
  .filter((solid) => solid.platformGroup === "fishing_deck")
  .sort((a, b) => a.x1 - b.x1);
assert(fishingDeck.length === 2, "Fishing deck must have two halves");
assert(
  fishingDeck[0]?.x1 === 28 &&
    fishingDeck[0]?.x2 === 35 &&
    fishingDeck[1]?.x1 === 40 &&
    fishingDeck[1]?.x2 === 47 &&
    fishingDeck.every((solid) => solid.y1 === 34 && solid.y2 === 34),
  "Fishing deck must be 8 + opening 4 + 8 on y34",
);

const centralLevels = D.validation.centralLevels;
assert(
  JSON.stringify(centralLevels) === JSON.stringify([20, 27, 34]),
  "Service shaft levels must be y20/y27/y34",
);
assert(
  centralLevels.slice(1).every((level, index) => level - centralLevels[index] === 7),
  "Service shaft levels must use a seven-tile step",
);
const centralPlatform = D.solids.find((solid) => solid.platformGroup === "central");
assert(
  centralPlatform?.x1 === 48 &&
    centralPlatform?.x2 === 51 &&
    centralPlatform?.y1 === 27 &&
    centralPlatform?.y2 === 27,
  "Service landing must be x48–51 y27",
);

const descentPlatforms = D.solids
  .filter((solid) => solid.platformGroup === "descent")
  .sort((a, b) => a.platformLevel - b.platformLevel);
const descentLevels = descentPlatforms.map((solid) => solid.platformLevel);
assert(
  JSON.stringify(descentLevels) === JSON.stringify([34, 41, 48, 55, 62, 69]),
  "Direct descent platforms must be y34/41/48/55/62/69",
);
assert(
  descentLevels.slice(1).every((level, index) => level - descentLevels[index] === 7),
  "Direct descent platforms must use a seven-tile step",
);
assert(
  descentPlatforms.every(
    (solid) => solid.x1 === 55 && solid.x2 === 61 && solid.y1 === solid.platformLevel,
  ),
  "Direct descent platforms must span x61–67",
);

const solidAt = (x, y) =>
  D.solids.find(
    (solid) => x >= solid.x1 && x <= solid.x2 && y >= solid.y1 && y <= solid.y2,
  );
for (let y = 21; y <= 26; y++) {
  for (let x = 14; x <= 68; x++) {
    const isShaftInterior = x >= 48 && x <= 51;
    const solid = solidAt(x, y);
    if (isShaftInterior) {
      assert(!solid, `Service shaft must stay open at x${x} y${y}`);
    } else {
      assert(Boolean(solid?.foundation), `Foundation hole at x${x} y${y}`);
    }
  }
}
const foundationTiles = D.solids
  .filter((solid) => solid.foundation)
  .reduce(
    (total, solid) => total + (solid.x2 - solid.x1 + 1) * (solid.y2 - solid.y1 + 1),
    0,
  );
assert(foundationTiles === 306, `Expected 306 foundation tiles, found ${foundationTiles}`);
assert(D.validation.foundationTiles === foundationTiles, "Foundation snapshot mismatch");

const accessRoom = D.rooms.find((room) => room.id === "desert_access");
assert(
  accessRoom?.x1 === 54 && accessRoom?.x2 === 62 && accessRoom?.y2 === 70,
  "Direct access room must begin at the compact fishing-hall wall",
);
const accessDoor = D.objects.find((object) => object.id === "DESERT_ACCESS_INNER");
assert(
  accessDoor?.x === 54 && accessDoor?.y === 31 && accessDoor?.h === 3,
  "Direct descent door must be x60 y31–33",
);
assert(
  descentPlatforms[0]?.x1 === accessDoor.x + 1 && descentPlatforms[0]?.y1 === 34,
  "The shaft must begin immediately behind the access door",
);

const shaftWall = D.backgrounds.find((background) => background.name === "Фон прямого спуска");
assert(
  shaftWall?.x1 === 55 &&
    shaftWall?.x2 === 61 &&
    shaftWall?.y1 === 28 &&
    shaftWall?.y2 === 69,
  "Direct descent must have a safe player-placed wall throughout",
);

for (const solid of D.solids) {
  assert(
    solid.x1 >= D.bounds.xMin &&
      solid.y1 >= D.bounds.yMin &&
      solid.x2 <= D.bounds.xMax &&
      solid.y2 <= D.bounds.yMax,
    `${solid.name || solid.mat} lies outside scene bounds`,
  );
}
for (const background of D.backgrounds) {
  assert(
    background.x1 >= D.bounds.xMin &&
      background.y1 >= D.bounds.yMin &&
      background.x2 <= D.bounds.xMax &&
      background.y2 <= D.bounds.yMax,
    `${background.name || background.mat} lies outside scene bounds`,
  );
}
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
assert(!serialized.includes("720"), "Legacy 720-tile pool text must be removed");
assert(!serialized.includes("45×16"), "Legacy 45×16 pool text must be removed");

const html = fs.readFileSync(path.join(root, "desert.html"), "utf8");
assert(html.includes("20×16"), "desert.html must describe the 20×16 pool");
assert(html.includes("320"), "desert.html must describe 320 water tiles");
assert(!html.includes("45×16") && !html.includes("720"), "desert.html contains legacy pool dimensions");
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
      doors: D.objects.filter((object) => object.kind === "door").length,
      chests: D.objects.filter((object) => object.kind === "chest").length,
      sceneWidth: D.validation.sceneWidth,
      surfaceWidth: D.validation.surfaceWidth,
      fishingHallWidth: fishingHall.x2 - fishingHall.x1 + 1,
      waterTiles: water.w * water.h,
      centralLevels,
      descentLevels,
      foundationTiles,
      wiringCircuits: ENG.circuits.length,
    },
    null,
    2,
  ),
);
