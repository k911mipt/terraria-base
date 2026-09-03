#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const files = [
  "js/data/jungle/layout.js",
  "js/data/jungle/solids.js",
  "js/data/jungle/backgrounds.js",
  "js/data/jungle/objects.js",
  "js/data/jungle/index.js",
  "js/data/jungle/engineering.js",
];

const context = vm.createContext({ console });
for (const relative of files) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, {
    filename: relative,
  });
}

const { D, ENG } = vm.runInContext(
  "({ D: JSON.parse(JSON.stringify(D)), ENG: JSON.parse(JSON.stringify(ENG)) })",
  context,
);

vm.runInContext(
  fs.readFileSync(path.join(root, "js/runtime/tables-jungle.js"), "utf8"),
  context,
  { filename: "js/runtime/tables-jungle.js" },
);

const displayedDoorModules = vm.runInContext(
  `Object.fromEntries(
    D.objects
      .filter((object) => object.kind === "door")
      .map((object) => [object.id, moduleForObject(object)?.id || null])
  )`,
  context,
);

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const rectContains = (region, x, y) =>
  x >= region.x1 && x <= region.x2 && y >= region.y1 && y <= region.y2;

const effectiveSolidAt = (x, y) =>
  [...D.solids].reverse().find((solid) => rectContains(solid, x, y));

const backgroundAt = (x, y) =>
  [...D.backgrounds]
    .reverse()
    .find((background) => rectContains(background, x, y));

assert(D.validation.status === "PASS", "Frozen Jungle status is not PASS");
assert(D.bounds.xMin === 0 && D.bounds.xMax === 72, "Jungle X bounds changed");
assert(D.bounds.yMin === 0 && D.bounds.yMax === 62, "Jungle Y bounds changed");
assert(D.validation.sceneWidth === 73, "Scene width snapshot changed");
assert(D.validation.sceneHeight === 63, "Scene height snapshot changed");
assert(D.validation.layer === "Surface Jungle", "Scene must remain on Surface Jungle");
assert(D.validation.naturalJungleRequired === true, "Scene must require an existing Jungle biome");
assert(D.rooms.length === 7, `Expected seven modules, found ${D.rooms.length}`);

const ids = D.objects.map((object) => object.id);
assert(new Set(ids).size === ids.length, "Object IDs must be unique");
const roomIds = new Set(D.rooms.map((room) => room.id));
for (const object of D.objects) {
  if (object.room) {
    assert(roomIds.has(object.room), `${object.id} declares unknown room ${object.room}`);
  }
}

const residents = D.objects.filter((object) => object.kind === "npc");
assert(residents.length === 3, `Expected three residents, found ${residents.length}`);
for (const id of ["JG_DRYAD", "JG_PAINTER", "JG_WITCH_DOCTOR"]) {
  assert(residents.some((npc) => npc.id === id), `Missing resident ${id}`);
}
const dryad = D.objects.find((object) => object.id === "JG_DRYAD");
const painter = D.objects.find((object) => object.id === "JG_PAINTER");
const witch = D.objects.find((object) => object.id === "JG_WITCH_DOCTOR");
const centerX = (object) => object.x + object.w / 2;
const residentDistances = {
  dryadPainter: Math.abs(centerX(dryad) - centerX(painter)),
  painterWitchDoctor: Math.abs(centerX(painter) - centerX(witch)),
  dryadWitchDoctor: Math.abs(centerX(dryad) - centerX(witch)),
};
assert(residentDistances.dryadPainter === 13, "Dryad/Painter distance changed");
assert(residentDistances.painterWitchDoctor === 10, "Painter/Witch Doctor distance changed");
assert(residentDistances.dryadWitchDoctor === 23, "Dryad/Witch Doctor distance changed");
assert(
  Object.values(residentDistances).every((distance) => distance <= 25),
  "All three Jungle residents must remain within 25 tiles",
);
assert(
  JSON.stringify(residentDistances) === JSON.stringify(D.validation.residentDistances),
  "Resident-distance snapshot mismatch",
);
assert(
  JSON.stringify(D.validation.priceTargets) ===
    JSON.stringify({ dryad: 0.84, painter: 0.79, witchDoctor: 0.84 }),
  "Jungle price targets changed",
);

const pylons = D.objects.filter((object) => object.kind === "pylon");
assert(pylons.length === 1, `Expected one Jungle Pylon, found ${pylons.length}`);
assert(
  pylons[0]?.id === "JG_JUNGLE_PYLON" &&
    pylons[0]?.x === 25 &&
    pylons[0]?.y === 30 &&
    pylons[0]?.w === 3 &&
    pylons[0]?.h === 4,
  "Jungle Pylon geometry changed",
);

const doors = D.objects.filter((object) => object.kind === "door");
assert(doors.length === 4, `Expected four doors, found ${doors.length}`);
let coveredDoorTiles = 0;
for (const door of doors) {
  for (let y = door.y; y < door.y + door.h; y += 1) {
    const wall = backgroundAt(door.x, y);
    assert(Boolean(wall), `Missing wall behind ${door.id} at y${y}`);
    if (wall) coveredDoorTiles += 1;
  }
}
assert(coveredDoorTiles === 12, `Expected 12 covered door tiles, found ${coveredDoorTiles}`);
assert(
  D.validation.doorsWithWall === 4 && D.validation.doorWallTiles === 12,
  "Door-wall validation snapshot mismatch",
);

const doorBlockingKinds = new Set([
  "bed",
  "chest",
  "furniture",
  "personal_storage",
  "pylon",
  "station",
  "teleporter",
]);
const blockingObjectAt = (x, y, excludedId) =>
  D.objects.find(
    (object) =>
      object.id !== excludedId &&
      doorBlockingKinds.has(object.kind) &&
      x >= object.x &&
      x < object.x + object.w &&
      y >= object.y &&
      y < object.y + object.h,
  );
const doorSideClear = (door, x) => {
  for (let y = door.y; y < door.y + door.h; y += 1) {
    if (effectiveSolidAt(x, y) || blockingObjectAt(x, y, door.id)) return false;
  }
  return true;
};
const doorClearance = {};
let openableDoors = 0;
for (const door of doors) {
  const left = doorSideClear(door, door.x - 1);
  const right = doorSideClear(door, door.x + 1);
  doorClearance[door.id] = { left, right };
  assert(left || right, `${door.id} is blocked on both sides`);
  if (left || right) openableDoors += 1;
}
assert(openableDoors === 4, `Expected four openable doors, found ${openableDoors}`);
for (const id of ["JG_DRYAD_HUB", "JG_HUB_WITCH", "JG_WITCH_SHAFT"]) {
  assert(
    doorClearance[id]?.left && doorClearance[id]?.right,
    `${id} must have free three-tile columns on both sides`,
  );
}
assert(D.validation.openableDoors === openableDoors, "Openable-door snapshot mismatch");

const expectedDoorModules = {
  JG_OUTER_L: "jungle_dryad",
  JG_DRYAD_HUB: "jungle_hub",
  JG_HUB_WITCH: "jungle_hub",
  JG_WITCH_SHAFT: "jungle_shaft",
};
for (const [doorId, roomId] of Object.entries(expectedDoorModules)) {
  assert(
    displayedDoorModules[doorId] === roomId,
    `${doorId} table module must honor declared room ${roomId}`,
  );
}

const hatch = D.objects.find((object) => object.id === "JG_PAINTER_HATCH");
assert(
  hatch && hatch.x === 31 && hatch.y === 23 && hatch.w === 2 && hatch.h === 1,
  "Painter hatch must be x31–32 y23",
);
const hatchPlatform = D.solids.find((solid) => solid.hatchPlatform);
assert(
  hatchPlatform &&
    hatchPlatform.x1 === 31 &&
    hatchPlatform.x2 === 32 &&
    hatchPlatform.y1 === 22 &&
    hatchPlatform.y2 === 22 &&
    hatchPlatform.mat === "rich_mahogany_platform",
  "Rich Mahogany Platform must occupy the original hatch floor row",
);
const leftHatchSupport = effectiveSolidAt(30, 23);
const rightHatchSupport = effectiveSolidAt(33, 23);
assert(leftHatchSupport?.mat === "rich_mahogany", "Left hatch support is missing");
assert(rightHatchSupport?.mat === "rich_mahogany", "Right hatch support is missing");
for (let y = 24; y <= 27; y += 1) {
  for (const x of [31, 32]) {
    assert(!effectiveSolidAt(x, y), `Painter access is blocked at x${x} y${y}`);
  }
}
const painterAccessPlatforms = D.solids
  .filter((solid) => solid.platformGroup === "painter_access")
  .sort((a, b) => a.platformLevel - b.platformLevel);
assert(
  JSON.stringify(painterAccessPlatforms.map((solid) => solid.platformLevel)) ===
    JSON.stringify([22, 28]),
  "Painter access platforms must be y22/y28",
);
assert(
  JSON.stringify(D.validation.symmetricAccessLevels) === JSON.stringify([22, 28, 34]),
  "Painter access snapshot must stay 22/28/34",
);

const shaftPlatforms = D.solids
  .filter((solid) => solid.platformGroup === "jungle_shaft")
  .sort((a, b) => a.platformLevel - b.platformLevel);
const shaftLevels = shaftPlatforms.map((solid) => solid.platformLevel);
assert(
  JSON.stringify(shaftLevels) === JSON.stringify([34, 41, 48, 55, 62]),
  "Jungle shaft platform levels changed",
);
assert(
  shaftLevels.slice(1).every((level, index) => level - shaftLevels[index] === 7),
  "Jungle shaft platforms must use a seven-tile step",
);
assert(
  shaftPlatforms.every((solid) => solid.x1 === 53 && solid.x2 === 60),
  "Jungle shaft platforms must span x53–60",
);

const enclosedPlatforms = D.solids.filter(
  (solid) =>
    solid.mat === "rich_mahogany_platform" && solid.openAirPlatform !== true,
);
let enclosedPlatformTiles = 0;
let enclosedPlatformTilesWithWall = 0;
for (const platform of enclosedPlatforms) {
  for (let y = platform.y1; y <= platform.y2; y += 1) {
    for (let x = platform.x1; x <= platform.x2; x += 1) {
      enclosedPlatformTiles += 1;
      const wall = backgroundAt(x, y);
      assert(Boolean(wall), `Missing wall behind enclosed platform x${x} y${y}`);
      if (wall) enclosedPlatformTilesWithWall += 1;
    }
  }
}
assert(enclosedPlatformTiles === 47, `Expected 47 enclosed platform tiles, found ${enclosedPlatformTiles}`);
assert(
  enclosedPlatformTilesWithWall === enclosedPlatformTiles,
  "Every enclosed Rich Mahogany Platform tile must have a wall",
);

const expectedSideCanopies = [
  [6, 21, 24, 21],
  [8, 20, 22, 20],
  [11, 19, 19, 19],
  [37, 21, 54, 21],
  [39, 20, 52, 20],
  [42, 19, 49, 19],
];
for (const [x1, y1, x2, y2] of expectedSideCanopies) {
  assert(
    D.solids.some(
      (solid) =>
        solid.mat === "leaf_block" &&
        solid.x1 === x1 &&
        solid.y1 === y1 &&
        solid.x2 === x2 &&
        solid.y2 === y2,
    ),
    `Missing attached side-canopy row x${x1}…${x2} y${y1}`,
  );
}
assert(
  D.validation.sideCanopiesAttached === true &&
    JSON.stringify(D.validation.sideCanopyLevels) === JSON.stringify([21, 20, 19]),
  "Attached side-canopy snapshot mismatch",
);

for (const x of [23, 37]) {
  for (let y = 24; y <= 29; y += 1) {
    assert(!effectiveSolidAt(x, y), `Shrine pillar must be passable at x${x} y${y}`);
    assert(
      backgroundAt(x, y)?.mat === "living_wood_wall",
      `Passable shrine pillar must use Living Wood Wall at x${x} y${y}`,
    );
  }
}
assert(
  D.backgrounds.filter((background) => background.passablePillar).length === 2,
  "Expected two passable background shrine pillars",
);
assert(
  D.validation.hubPillarsPassable === true &&
    D.validation.hubPillarWall === "Living Wood Wall",
  "Passable shrine-pillar snapshot mismatch",
);

const leftHubBeam = D.solids.find(
  (solid) => solid.name === "Левая часть бамбуковой перемычки святилища",
);
const rightHubBeam = D.solids.find(
  (solid) => solid.name === "Правая часть бамбуковой перемычки святилища",
);
assert(
  leftHubBeam?.x1 === 24 &&
    leftHubBeam?.x2 === 29 &&
    leftHubBeam?.y1 === 23 &&
    leftHubBeam?.y2 === 23,
  "Left Bamboo beam must be x24–29 y23",
);
assert(
  rightHubBeam?.x1 === 34 &&
    rightHubBeam?.x2 === 36 &&
    rightHubBeam?.y1 === 23 &&
    rightHubBeam?.y2 === 23,
  "Right Bamboo beam must be x34–36 y23",
);
assert(D.validation.hubBeamY === 23, "Bamboo beam snapshot must be y23");

const leftHubLantern = D.objects.find((object) => object.id === "JG_HUB_LANTERN_L");
const rightHubLantern = D.objects.find((object) => object.id === "JG_HUB_LANTERN_R");
assert(
  leftHubLantern?.x === 25 && leftHubLantern?.y === 24,
  "Left shrine lantern must be x25 y24",
);
assert(
  rightHubLantern?.x === 35 && rightHubLantern?.y === 24,
  "Right shrine lantern must be x35 y24",
);
for (const lantern of [leftHubLantern, rightHubLantern]) {
  assert(
    effectiveSolidAt(lantern.x, lantern.y - 1)?.mat === "bamboo_block",
    `${lantern.id} must hang from the Bamboo beam`,
  );
}

const teleporterReserves = D.objects.filter(
  (object) => object.kind === "teleporter" && object.future === true,
);
assert(teleporterReserves.length === 2, "Expected two future teleporter reserves");
assert(
  teleporterReserves.some((object) => object.id === "JG_SURFACE_TELEPORTER") &&
    teleporterReserves.some((object) => object.id === "JG_TEMPLE_TELEPORTER"),
  "Both surface and Temple teleporter reserves are required",
);
assert(
  D.validation.activeTeleporterWire === false &&
    ENG.circuits.length === 0 &&
    ENG.devices.length === 0,
  "Universal Jungle plan must not contain active world-specific wiring",
);

const chests = D.objects.filter((object) => object.kind === "chest");
assert(chests.length === 4, `Expected four local chests, found ${chests.length}`);
for (const chest of chests) {
  assert(chest.customName.length === chest.customNameLength, `${chest.id} customNameLength mismatch`);
  assert(chest.customNameLength <= 20, `${chest.id} custom name exceeds 20 characters`);
}

const rootSupports = D.solids.filter((solid) => solid.rootSupport && solid.y1 === 35);
assert(rootSupports.length === 4, "Treehouse must keep four vertical living-root supports");
assert(
  !D.solids.some(
    (solid) =>
      solid.x1 <= 51 && solid.x2 >= 8 && solid.y1 === 35 && solid.y2 >= 42 && !solid.rootSupport,
  ),
  "Do not replace the open root level with a solid artificial foundation",
);

const ceilingMountedLights = D.objects.filter(
  (object) => object.kind === "light" && object.ceilingMounted === true,
);
assert(ceilingMountedLights.length === 5, "Expected five ceiling-mounted room lights");
for (const light of ceilingMountedLights) {
  const supportX = Math.floor(light.x + light.w / 2);
  const supportY = light.y - 1;
  assert(
    Boolean(effectiveSolidAt(supportX, supportY)),
    `${light.id} lacks a real ceiling support at x${supportX} y${supportY}`,
  );
}

const lights = D.objects.filter((object) => object.kind === "light");
const lightCenter = (light) => ({
  x: light.x + light.w / 2,
  y: light.y + light.h / 2,
});
const covers = (light, x, y) => {
  const center = lightCenter(light);
  return Math.hypot(x - center.x, y - center.y) <= light.lightRadius;
};
const lightingResults = [];
for (const zone of D.lightingZones) {
  const tiles = [];
  for (let y = zone.y1; y <= zone.y2; y += 1) {
    for (let x = zone.x1; x <= zone.x2; x += 1) {
      tiles.push({ x: x + 0.5, y: y + 0.5, tileX: x, tileY: y });
    }
  }
  const localLights = lights.filter((light) => light.room === zone.room);
  const influencingLights = localLights.filter((light) =>
    tiles.some((tile) => covers(light, tile.x, tile.y)),
  );
  const uncovered = tiles.filter(
    (tile) => !influencingLights.some((light) => covers(light, tile.x, tile.y)),
  );
  const coverage = tiles.length
    ? (tiles.length - uncovered.length) / tiles.length
    : 0;
  assert(
    coverage >= zone.minCoverage,
    `${zone.name}: lighting coverage ${(coverage * 100).toFixed(1)}%, first dark tile ${uncovered[0] ? `x${uncovered[0].tileX} y${uncovered[0].tileY}` : "n/a"}`,
  );
  assert(
    influencingLights.length >= zone.minSources,
    `${zone.name}: expected ${zone.minSources} influencing local lights, found ${influencingLights.length}`,
  );
  lightingResults.push({
    id: zone.id,
    coveragePercent: Number((coverage * 100).toFixed(1)),
    influencingLights: influencingLights.map((light) => light.id),
  });
}
assert(D.lightingZones.length === 5, "Expected five Jungle lighting zones");
assert(
  D.validation.lightingCoveragePercent === 100 &&
    D.validation.lightingZones === D.lightingZones.length,
  "Lighting validation snapshot mismatch",
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
  if (object.kind === "light") {
    assert(
      Number.isFinite(object.lightRadius) && object.lightRadius > 0,
      `${object.id} must declare a positive lightRadius`,
    );
  }
}

const html = fs.readFileSync(path.join(root, "jungle.html"), "utf8");
assert(html.includes("Джунглевый аванпост v2"), "Jungle v2 title is missing");
assert(html.includes("Дриада + Маляр + Шаман"), "Resident group is missing from HTML");
assert(html.includes("Шахта / Храм"), "Temple-shaft focus button is missing");
for (const src of [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1])) {
  const relative = src.replace(/^\.\//, "");
  assert(fs.existsSync(path.join(root, relative)), `Missing script referenced by jungle.html: ${relative}`);
}
const navigationSources = {
  "index.html": fs.readFileSync(path.join(root, "js/runtime/start.js"), "utf8"),
  "desert.html":
    fs.readFileSync(path.join(root, "desert.html"), "utf8") +
    fs.readFileSync(path.join(root, "js/runtime/start-desert.js"), "utf8"),
  "underground.html":
    fs.readFileSync(path.join(root, "underground.html"), "utf8") +
    fs.readFileSync(path.join(root, "js/runtime/start-underground.js"), "utf8"),
  "jungle.html": html,
};
for (const [page, source] of Object.entries(navigationSources)) {
  assert(source.includes("./jungle.html"), `${page} is missing the Jungle scene tab`);
}

if (errors.length) {
  console.error("JUNGLE CHECK: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("JUNGLE CHECK: PASS");
console.log(
  JSON.stringify(
    {
      rooms: D.rooms.length,
      residents: residents.map((npc) => npc.name),
      residentDistances,
      pylon: pylons[0].name,
      doors: doors.length,
      coveredDoorTiles,
      openableDoors,
      doorClearance,
      hatch: { x: hatch.x, y: hatch.y, platformY: hatchPlatform.y1 },
      painterAccessLevels: D.validation.symmetricAccessLevels,
      shaftLevels,
      enclosedPlatformTiles,
      enclosedPlatformTilesWithWall,
      teleporterReserves: teleporterReserves.map((object) => object.id),
      chests: chests.length,
      lighting: lightingResults,
      wiringCircuits: ENG.circuits.length,
    },
    null,
    2,
  ),
);
