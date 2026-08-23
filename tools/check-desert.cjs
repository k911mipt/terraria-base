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
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, {
    filename: relative,
  });
}

const { D, ENG } = vm.runInContext(
  "({ D: JSON.parse(JSON.stringify(D)), ENG: JSON.parse(JSON.stringify(ENG)) })",
  context,
);

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const backgroundAt = (x, y) =>
  [...D.backgrounds]
    .reverse()
    .find(
      (background) =>
        x >= background.x1 &&
        x <= background.x2 &&
        y >= background.y1 &&
        y <= background.y2,
    );

const solidAt = (x, y) =>
  D.solids.find(
    (solid) =>
      x >= solid.x1 && x <= solid.x2 && y >= solid.y1 && y <= solid.y2,
  );

const ids = D.objects.map((object) => object.id);
assert(new Set(ids).size === ids.length, "Object IDs must be unique");
assert(D.rooms.length === 6, "Expected six functional rooms/modules");
assert(
  !D.rooms.some((room) => room.id === "desert_fishing"),
  "Separate fishing-hall room must be removed",
);
assert(
  !D.rooms.some((room) => room.id === "desert_access"),
  "Separate access room must be removed",
);
assert(
  D.validation.separateFishingHall === false,
  "Fishing hall snapshot must be false",
);
assert(D.validation.shaftUnderHatch === true, "Shaft must be under hatch");
assert(
  JSON.stringify(D.validation.shaftX) === JSON.stringify([49, 54]),
  "Shaft X snapshot mismatch",
);
assert(
  D.objects.filter((object) => object.kind === "npc").length === 2,
  "Expected two NPCs",
);
assert(
  D.objects.filter((object) => object.kind === "pylon").length === 1,
  "Expected one pylon",
);
assert(
  D.objects.filter((object) => object.kind === "chest").length === 5,
  "Expected five chests",
);
assert(
  D.objects.filter((object) => object.kind === "door").length === 5,
  "Expected five doors",
);

// Every door tile inside the built outpost must keep a background wall.
const doors = D.objects.filter((object) => object.kind === "door");
let coveredDoorTiles = 0;
for (const door of doors) {
  for (let y = door.y; y < door.y + door.h; y += 1) {
    const wall = backgroundAt(door.x, y);
    assert(Boolean(wall), `Missing background wall behind ${door.id} at y${y}`);
    if (wall) coveredDoorTiles += 1;
  }
}
assert(coveredDoorTiles === 15, "All 15 door tiles must have background walls");
assert(
  D.validation.doorsWithWall === 5 && D.validation.doorWallTiles === 15,
  "Door-wall validation snapshot mismatch",
);

// Horizontal platforms may be wallless in open air. If a platform touches a
// walled construction vertically, its own tile must also keep a wall so the
// background does not acquire a one-tile black seam.
const platformSolids = D.solids.filter((solid) =>
  solid.mat.endsWith("_platform"),
);
let platformTilesRequiringWall = 0;
let platformTilesWithWall = 0;
for (const platform of platformSolids) {
  for (let y = platform.y1; y <= platform.y2; y += 1) {
    for (let x = platform.x1; x <= platform.x2; x += 1) {
      const touchesWalledArea =
        Boolean(backgroundAt(x, y - 1)) || Boolean(backgroundAt(x, y + 1));
      if (!touchesWalledArea) continue;

      platformTilesRequiringWall += 1;
      const wall = backgroundAt(x, y);
      assert(
        Boolean(wall),
        `Missing background wall behind enclosed platform at x${x} y${y}`,
      );
      if (wall) platformTilesWithWall += 1;
    }
  }
}
assert(
  platformTilesRequiringWall === 60,
  `Expected 60 enclosed platform tiles, found ${platformTilesRequiringWall}`,
);
assert(
  platformTilesWithWall === platformTilesRequiringWall,
  "Every enclosed platform tile must have a background wall",
);
for (let x = 28; x <= 47; x += 1) {
  assert(
    backgroundAt(x, 27)?.mat === "sandstone_wall_plain",
    `Fishing-deck background must be Sandstone Wall at x${x} y27`,
  );
}
for (let x = 49; x <= 50; x += 1) {
  assert(
    backgroundAt(x, 20)?.mat === "palm_wall",
    `Hatch-platform background must be Palm Wood Wall at x${x} y20`,
  );
}

assert(
  ENG.circuits.length === 0 && ENG.devices.length === 0,
  "Desert scene must not require wiring",
);

// Hatch construction rule: platform in the old floor position, hatch one tile
// lower, and ordinary solid foreground blocks immediately to both sides.
const hatch = D.objects.find((object) => object.id === "D_HATCH");
assert(hatch && hatch.x === 49 && hatch.w === 2 && hatch.y === 21, "Hatch must be x49–50 y21");
const hatchPlatform = D.solids.find((solid) => solid.hatchPlatform);
assert(
  hatchPlatform &&
    hatchPlatform.x1 === 49 &&
    hatchPlatform.x2 === 50 &&
    hatchPlatform.y1 === 20 &&
    hatchPlatform.y2 === 20 &&
    hatchPlatform.mat === "palm_platform",
  "Palm platform must replace the old hatch position",
);
const leftHatchSupport = solidAt(48, 21);
const rightHatchSupport = solidAt(51, 21);
assert(Boolean(leftHatchSupport), "Left solid hatch support x48 y21 is missing");
assert(Boolean(rightHatchSupport), "Right solid hatch support x51 y21 is missing");
assert(
  leftHatchSupport && !leftHatchSupport.mat.endsWith("_platform"),
  "Left hatch support must be a solid block, not a platform",
);
assert(
  rightHatchSupport && !rightHatchSupport.mat.endsWith("_platform"),
  "Right hatch support must be a solid block, not a platform",
);
assert(
  D.validation.hatchShiftedBelowFloor === true &&
    D.validation.hatchPlatformY === 20,
  "Hatch validation snapshot mismatch",
);

const water = D.objects.find((object) => object.id === "DESERT_WATER");
assert(
  water && water.x === 28 && water.y === 28 && water.w === 20 && water.h === 16,
  "Pool must stay 20×16 at x28 y28",
);
assert(water.tiles === 320, "Pool must contain 320 tiles");
assert(water.room === "desert_service", "Pool must belong to service zone");

const door = D.objects.find((object) => object.id === "DESERT_ACCESS_INNER");
assert(
  door && door.x === 48 && door.y === 24 && door.h === 3,
  "Side shaft door must be x48 y24–26",
);
assert(door.room === "desert_shaft", "Door must belong to central shaft");

const loot = D.objects.find((object) => object.id === "DESERT_LOOT");
assert(loot && loot.x === 44 && loot.y === 25, "DESERT chest must stay on right deck");

const levels = D.solids
  .filter((solid) => solid.platformGroup === "descent")
  .sort((a, b) => a.platformLevel - b.platformLevel);
assert(
  JSON.stringify(levels.map((solid) => solid.platformLevel)) ===
    JSON.stringify([27, 34, 41, 48, 55, 62, 69]),
  "Shaft platform levels mismatch",
);
assert(
  levels.every((solid) => solid.x1 === 49 && solid.x2 === 54),
  "Shaft platforms must span x49–54",
);

const shaftWall = D.backgrounds.find(
  (background) => background.name === "Фон центрального спуска",
);
assert(
  shaftWall &&
    shaftWall.x1 === 49 &&
    shaftWall.x2 === 54 &&
    shaftWall.y1 === 21 &&
    shaftWall.y2 === 69,
  "Central shaft wall mismatch",
);

const serviceWall = D.backgrounds.find(
  (background) => background.name === "Фон сервисной и рыболовной зоны",
);
assert(
  serviceWall &&
    serviceWall.x1 === 28 &&
    serviceWall.x2 === 47 &&
    serviceWall.y1 === 21 &&
    serviceWall.y2 === 26,
  "Service wall mismatch",
);

const serviceRoom = D.rooms.find((room) => room.id === "desert_service");
assert(
  serviceRoom && serviceRoom.x1 === 28 && serviceRoom.x2 === 47,
  "Service room must start at x28",
);

const armsSupport = D.solids.find(
  (solid) => solid.name === "Естественный грунт под левым крылом",
);
assert(
  armsSupport &&
    armsSupport.x1 === 14 &&
    armsSupport.x2 === 27 &&
    armsSupport.y1 === 21 &&
    armsSupport.y2 === 26 &&
    armsSupport.mat === "sand",
  "Natural sand support under Arms Dealer is missing",
);
assert(
  D.validation.emptyUnderArms === false,
  "Under-Arms empty-space snapshot must be false",
);
assert(
  D.validation.naturalSupportTiles === 84,
  "Natural support must contain 84 tiles",
);
assert(
  D.validation.lowerRoomInterior === "20×6",
  "Service-zone size snapshot mismatch",
);
assert(
  !D.solids.some((solid) => solid.name === "Правая сервисная площадка"),
  "Legacy right service platform must be removed",
);
assert(
  !D.backgrounds.some(
    (background) => background.name === "Фон правой сервисной ниши",
  ),
  "Legacy right niche wall must be removed",
);

const html = fs.readFileSync(path.join(root, "desert.html"), "utf8");
assert(
  !html.includes("Поднятый пустынный рыболовный зал"),
  "Legacy fishing-hall label remains in HTML",
);
assert(html.includes(">Бассейн</button"), "Pool navigation button is missing");
assert(
  html.includes("За каждой дверью теперь есть безопасная фоновая стена"),
  "HTML must explain door walls",
);
assert(
  html.includes("сам люк опущен на y21"),
  "HTML must explain the shifted hatch",
);

const buildingRules = fs.readFileSync(
  path.join(root, "docs/building-rules.md"),
  "utf8",
);
assert(
  buildingRules.includes("Непрерывность фоновых стен за платформами"),
  "Persistent platform-wall rule is missing",
);
assert(
  buildingRules.includes("Правило установки люков"),
  "Persistent hatch rule is missing",
);

for (const solid of D.solids) {
  assert(
    solid.x1 >= D.bounds.xMin &&
      solid.y1 >= D.bounds.yMin &&
      solid.x2 <= D.bounds.xMax &&
      solid.y2 <= D.bounds.yMax,
    `${solid.name || solid.mat} outside bounds`,
  );
}
for (const background of D.backgrounds) {
  assert(
    background.x1 >= D.bounds.xMin &&
      background.y1 >= D.bounds.yMin &&
      background.x2 <= D.bounds.xMax &&
      background.y2 <= D.bounds.yMax,
    `${background.name || background.mat} outside bounds`,
  );
}
for (const object of D.objects) {
  assert(
    object.x >= D.bounds.xMin &&
      object.y >= D.bounds.yMin &&
      object.x + object.w - 1 <= D.bounds.xMax &&
      object.y + object.h - 1 <= D.bounds.yMax,
    `${object.id} outside bounds`,
  );
}

const serialized = JSON.stringify(D).toLowerCase();
assert(
  !serialized.includes("skeletron") && !serialized.includes("данж"),
  "World-specific location leaked into scene",
);

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
      waterTiles: water.tiles,
      shaftX: D.validation.shaftX,
      platformLevels: levels.map((solid) => solid.platformLevel),
      platformTilesRequiringWall,
      platformTilesWithWall,
      wiringCircuits: ENG.circuits.length,
    },
    null,
    2,
  ),
);
