#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const files = [
  "js/data/underground/layout.js",
  "js/data/underground/solids.js",
  "js/data/underground/backgrounds.js",
  "js/data/underground/objects.js",
  "js/data/underground/index.js",
  "js/data/underground/engineering.js",
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
  fs.readFileSync(path.join(root, "js/runtime/tables-underground.js"), "utf8"),
  context,
  { filename: "js/runtime/tables-underground.js" },
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
  [...D.backgrounds].reverse().find((background) => rectContains(background, x, y));

assert(D.validation.status === "PASS", "Frozen underground status is not PASS");
assert(D.bounds.xMin === 0 && D.bounds.xMax === 65, "Scene X bounds changed");
assert(D.bounds.yMin === 0 && D.bounds.yMax === 50, "Scene Y bounds must be 0–50");
assert(D.validation.sceneWidth === 66, "Scene width snapshot changed");
assert(D.validation.sceneHeight === 51, "Scene height snapshot must be 51");
assert(D.rooms.length === 7, `Expected 7 modules, found ${D.rooms.length}`);
assert(
  D.rooms.some((room) => room.id === "underground_fishing"),
  "Fishing module is missing",
);
assert(D.validation.npcHouses === 3, "Expected three NPC houses");

const ids = D.objects.map((object) => object.id);
assert(new Set(ids).size === ids.length, "Object IDs must be unique");
const roomIds = new Set(D.rooms.map((room) => room.id));
for (const object of D.objects) {
  if (object.room) {
    assert(roomIds.has(object.room), `${object.id} declares unknown room ${object.room}`);
  }
}

const residents = D.objects.filter((object) => object.kind === "npc");
assert(residents.length === 3, `Expected 3 residents, found ${residents.length}`);
for (const id of ["UG_MECHANIC", "UG_GOBLIN", "UG_PRINCESS"]) {
  assert(residents.some((npc) => npc.id === id), `Missing resident ${id}`);
}
assert(!D.objects.some((object) => object.id === "UG_DYE_TRADER"), "Dye Trader must not be in the final group");

const goblin = D.objects.find((object) => object.id === "UG_GOBLIN");
const mechanic = D.objects.find((object) => object.id === "UG_MECHANIC");
const princess = D.objects.find((object) => object.id === "UG_PRINCESS");
const centerX = (object) => object.x + object.w / 2;
const mechanicDistance = Math.abs(centerX(goblin) - centerX(mechanic));
const princessDistance = Math.abs(centerX(goblin) - centerX(princess));
assert(mechanicDistance === 13, `Mechanic distance changed: ${mechanicDistance}`);
assert(princessDistance === 15, `Princess distance changed: ${princessDistance}`);
assert(
  mechanicDistance <= 25 && princessDistance <= 25,
  "Goblin neighbors must stay within 25 tiles",
);
assert(D.validation.goblinPriceModifier === 0.75, "Goblin price target must stay at 0.75");
assert(princess.futureResident === true, "Princess must remain marked as a future resident");
assert(D.validation.pylonWorksBeforePrincess === true, "Pylon must work before Princess arrives");

const pylons = D.objects.filter((object) => object.kind === "pylon");
assert(pylons.length === 1, `Expected one pylon, found ${pylons.length}`);
assert(
  pylons[0]?.id === "UG_CAVERN_PYLON" &&
    pylons[0]?.x === 38 &&
    pylons[0]?.y === 17 &&
    pylons[0]?.w === 3 &&
    pylons[0]?.h === 4,
  "Cavern Pylon geometry changed",
);

const goblinStyleSolids = D.solids.filter((solid) => solid.goblinStyle);
const goblinStyleTiles = goblinStyleSolids.reduce(
  (total, solid) =>
    total + (solid.x2 - solid.x1 + 1) * (solid.y2 - solid.y1 + 1),
  0,
);
assert(goblinStyleSolids.length === 3, "Expected three foreground Goblin style regions");
assert(goblinStyleTiles === 20, `Expected 20 Goblin accent tiles, found ${goblinStyleTiles}`);
assert(
  D.backgrounds.some(
    (wall) =>
      wall.name === "Тёплая жилая панель Гоблина" &&
      wall.mat === "boreal_wall" &&
      wall.x1 === 24 &&
      wall.x2 === 27,
  ),
  "Goblin living wall panel is missing",
);
assert(
  D.backgrounds.some(
    (wall) =>
      wall.name === "Медная рабочая панель" &&
      wall.mat === "copper_wall_plain" &&
      wall.x1 === 29 &&
      wall.x2 === 36,
  ),
  "Copper work panel is missing",
);
assert(
  D.backgrounds.some(
    (wall) =>
      wall.name === "Стеклянная ниша Пилона пещер" &&
      wall.mat === "glass_wall" &&
      wall.x1 === 38 &&
      wall.x2 === 41,
  ),
  "Glass pylon niche is missing",
);
for (const id of [
  "UG_GOBLIN_CHANDELIER",
  "UG_GOBLIN_GREEN_TORCH",
  "UG_TOOL_FRAME_WRENCH",
  "UG_TOOL_FRAME_CUTTER",
]) {
  assert(D.objects.some((object) => object.id === id), `Missing Goblin decoration ${id}`);
}

const doors = D.objects.filter((object) => object.kind === "door");
assert(doors.length === 5, `Expected five doors, found ${doors.length}`);
let coveredDoorTiles = 0;
for (const door of doors) {
  for (let y = door.y; y < door.y + door.h; y += 1) {
    const wall = backgroundAt(door.x, y);
    assert(Boolean(wall), `Missing wall behind ${door.id} at y${y}`);
    if (wall) coveredDoorTiles += 1;
  }
}
assert(coveredDoorTiles === 15, `Expected 15 covered door tiles, found ${coveredDoorTiles}`);
assert(
  D.validation.doorsWithWall === 5 && D.validation.doorWallTiles === 15,
  "Door-wall validation snapshot mismatch",
);

const doorBlockingKinds = new Set([
  "bed",
  "chest",
  "furniture",
  "personal_storage",
  "pylon",
  "station",
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
let openableDoors = 0;
const doorClearance = {};
for (const door of doors) {
  const left = doorSideClear(door, door.x - 1);
  const right = doorSideClear(door, door.x + 1);
  doorClearance[door.id] = { left, right };
  assert(left || right, `${door.id} is blocked on both sides`);
  if (left || right) openableDoors += 1;
}
assert(openableDoors === 5, `Expected five openable doors, found ${openableDoors}`);
assert(doorClearance.UG_MECH_GOBLIN.left && doorClearance.UG_MECH_GOBLIN.right, "Mechanic/Goblin door must be clear on both sides");
assert(doorClearance.UG_GOBLIN_PRINCESS.left && doorClearance.UG_GOBLIN_PRINCESS.right, "Goblin/Princess door must be clear on both sides");
assert(D.validation.openableDoors === 5, "Openable-door validation snapshot mismatch");

const expectedDoorModules = {
  UG_OUTER_L: "underground_mechanic",
  UG_MECH_GOBLIN: "underground_goblin",
  UG_GOBLIN_PRINCESS: "underground_goblin",
  UG_OUTER_R: "underground_princess",
  UG_FISHING_DOOR: "underground_fishing",
};
for (const [doorId, roomId] of Object.entries(expectedDoorModules)) {
  assert(
    displayedDoorModules[doorId] === roomId,
    `${doorId} table module must honor declared room ${roomId}, found ${displayedDoorModules[doorId]}`,
  );
}

const hatch = D.objects.find((object) => object.id === "UG_HATCH");
assert(
  hatch && hatch.x === 36 && hatch.y === 22 && hatch.w === 2 && hatch.h === 1,
  "Fishing hatch must be x36–37 y22",
);
const hatchPlatform = D.solids.find((solid) => solid.hatchPlatform);
assert(
  hatchPlatform &&
    hatchPlatform.x1 === 36 &&
    hatchPlatform.x2 === 37 &&
    hatchPlatform.y1 === 21 &&
    hatchPlatform.y2 === 21 &&
    hatchPlatform.mat === "boreal_platform",
  "Boreal platform must occupy the old floor position above the hatch",
);
const leftSupport = effectiveSolidAt(35, 22);
const rightSupport = effectiveSolidAt(38, 22);
assert(leftSupport && leftSupport.mat === "black_slab", "Left hatch support x35 y22 is missing");
assert(rightSupport && rightSupport.mat === "black_slab", "Right hatch support x38 y22 is missing");
assert(
  !leftSupport.mat.endsWith("_platform") && !rightSupport.mat.endsWith("_platform"),
  "Hatch supports must be ordinary solid blocks",
);
assert(
  backgroundAt(36, 21)?.mat === "goblin_green_wall" &&
    backgroundAt(37, 21)?.mat === "goblin_green_wall",
  "Background wall must continue behind the hatch platform",
);

const water = D.objects.find((object) => object.id === "UG_FISH_WATER");
assert(
  water &&
    water.x === 15 &&
    water.y === 29 &&
    water.w === 20 &&
    water.h === 16 &&
    water.tiles === 320,
  "Artificial fishing pool must be 20×16 at x15 y29",
);
assert(water.room === "underground_fishing", "Pool must belong to the fishing module");
assert(D.validation.fishingWaterTiles === 320, "Water validation snapshot must be 320");
assert(D.validation.artificialPool === true, "Pool must stay marked as artificial");

const fishingDeck = D.solids
  .filter((solid) => solid.platformGroup === "fishing_dock")
  .sort((a, b) => a.x1 - b.x1);
assert(fishingDeck.length === 2, "Fishing dock must have two halves");
assert(
  fishingDeck[0]?.x1 === 15 &&
    fishingDeck[0]?.x2 === 22 &&
    fishingDeck[1]?.x1 === 27 &&
    fishingDeck[1]?.x2 === 34 &&
    fishingDeck.every((solid) => solid.y1 === 28 && solid.y2 === 28),
  "Fishing dock must be 8 + opening 4 + 8 on y28",
);
for (let x = 23; x <= 26; x += 1) {
  assert(!effectiveSolidAt(x, 28), `Fishing opening must stay clear at x${x} y28`);
  assert(Boolean(backgroundAt(x, 28)), `Fishing opening background is missing at x${x} y28`);
}
for (let y = 29; y <= 44; y += 1) {
  assert(effectiveSolidAt(14, y)?.mat === "glass", `Left pool glass missing at y${y}`);
  assert(effectiveSolidAt(35, y)?.mat === "glass", `Right pool glass missing at y${y}`);
}
for (let x = 14; x <= 43; x += 1) {
  assert(effectiveSolidAt(x, 45)?.mat === "gray_brick", `Pool bottom missing at x${x} y45`);
}

const platformSolids = D.solids.filter(
  (solid) => solid.mat === "boreal_platform" && !solid.decorativePlatform,
);
const platformTiles = platformSolids.reduce(
  (total, solid) =>
    total + (solid.x2 - solid.x1 + 1) * (solid.y2 - solid.y1 + 1),
  0,
);
assert(platformTiles === 20, `Expected 20 platform tiles, found ${platformTiles}`);
const platformLevels = [...new Set(platformSolids.map((solid) => solid.y1))].sort(
  (a, b) => a - b,
);
assert(
  JSON.stringify(platformLevels) === JSON.stringify([21, 28]),
  `Platform levels must be y21/y28, found ${platformLevels.join("/")}`,
);
assert(platformLevels[1] - platformLevels[0] === 7, "Fishing descent must use a seven-tile step");
let platformTilesWithWall = 0;
for (const platform of platformSolids) {
  for (let x = platform.x1; x <= platform.x2; x += 1) {
    assert(Boolean(backgroundAt(x, platform.y1)), `Missing wall behind platform x${x} y${platform.y1}`);
    if (backgroundAt(x, platform.y1)) platformTilesWithWall += 1;
  }
}
assert(platformTilesWithWall === 20, "All 20 enclosed platform tiles must have walls");

const princessShelf = D.solids.find((solid) => solid.decorativePlatform);
assert(
  princessShelf &&
    princessShelf.x1 === 49 &&
    princessShelf.x2 === 52 &&
    princessShelf.y1 === 16 &&
    princessShelf.mat === "boreal_platform",
  "Princess wall shelf must be x49–52 y16",
);
for (let x = 49; x <= 52; x += 1) {
  assert(Boolean(backgroundAt(x, 16)), `Missing wall behind Princess shelf at x${x} y16`);
}

for (let y = 23; y <= 27; y += 1) {
  assert(!effectiveSolidAt(38, y), `Passage to fishing chest is blocked at x38 y${y}`);
}

for (let y = 29; y <= 44; y += 1) {
  for (let x = 36; x <= 42; x += 1) {
    assert(
      effectiveSolidAt(x, y)?.mat === "ice_block_plain",
      `Empty cavity under fishing service ledge at x${x} y${y}`,
    );
  }
}

const iceBiomeBlocks = D.solids
  .filter((solid) => solid.iceBiome)
  .reduce(
    (total, solid) =>
      total + (solid.x2 - solid.x1 + 1) * (solid.y2 - solid.y1 + 1),
    0,
  );
const iceBlocks = D.solids
  .filter((solid) => solid.iceBiome && solid.mat === "ice_block_plain")
  .reduce(
    (total, solid) =>
      total + (solid.x2 - solid.x1 + 1) * (solid.y2 - solid.y1 + 1),
    0,
  );
const snowFloorTiles = D.solids
  .filter((solid) => solid.mat === "snow_block_plain")
  .reduce(
    (total, solid) =>
      total + (solid.x2 - solid.x1 + 1) * (solid.y2 - solid.y1 + 1),
    0,
  );
assert(iceBlocks === 1960, `Expected 1960 Ice tiles, found ${iceBlocks}`);
assert(snowFloorTiles === 24, `Expected 24 Snow floor tiles, found ${snowFloorTiles}`);
assert(iceBiomeBlocks === 1984, `Expected 1984 Snow/Ice tiles, found ${iceBiomeBlocks}`);
assert(D.validation.iceBiomeBlocks === iceBiomeBlocks, "Ice-biome snapshot mismatch");
assert(
  iceBiomeBlocks >= D.validation.iceBiomeThreshold &&
    D.validation.iceBiomeThreshold === 1500 &&
    D.validation.iceBiomeGuaranteed === true,
  "Ice biome must remain guaranteed by at least 1500 Snow/Ice blocks",
);

const chests = D.objects.filter((object) => object.kind === "chest");
assert(chests.length === 4, `Expected four local chests, found ${chests.length}`);
for (const chest of chests) {
  assert(chest.customName.length === chest.customNameLength, `${chest.id} customNameLength mismatch`);
  assert(chest.customNameLength <= 20, `${chest.id} custom name exceeds 20 characters`);
}
const fishChest = D.objects.find((object) => object.id === "UG_FISH_CHEST");
assert(
  fishChest &&
    fishChest.x === 39 &&
    fishChest.y === 26 &&
    fishChest.customName === "Рыбалка и наживка",
  "Fishing chest geometry or name changed",
);

assert(
  D.objects.filter((object) => object.id === "UG_TINKERERS_WORKSHOP").length === 1,
  "Tinkerer's Workshop missing",
);
assert(D.objects.filter((object) => object.id === "UG_SAFE").length === 1, "Safe missing");
assert(D.objects.filter((object) => object.id === "UG_PRINCESS_BED").length === 1, "Princess bed missing");
assert(D.objects.find((object) => object.id === "UG_MECHANIC_CHAIR")?.x === 20, "Mechanic chair must not block x22");
assert(D.objects.find((object) => object.id === "UG_GOBLIN_TABLE")?.x === 25, "Goblin table must leave x24 clear");
assert(D.objects.find((object) => object.id === "UG_CAVERN_PYLON")?.x === 38, "Pylon must leave x41 clear");
assert(D.objects.find((object) => object.id === "UG_PRINCESS_TABLE")?.x === 44, "Princess table must leave x43 clear");
assert(D.objects.find((object) => object.id === "UG_READY_CHEST")?.y === 14, "Ready chest must be on the wall shelf");
for (const id of [
  "UG_MECH_CHANDELIER",
  "UG_MECH_TIMER_FRAME",
  "UG_MECH_SWITCH_FRAME",
  "UG_PYLON_ICE_LANTERN",
  "UG_PRINCESS_CHANDELIER",
  "UG_PRINCESS_CANDELABRA",
  "UG_FISH_LIGHT_L",
  "UG_FISH_LIGHT_R",
  "UG_FISH_SERVICE_LIGHT",
]) {
  assert(D.objects.some((object) => object.id === id), `Missing V3 room object ${id}`);
}
assert(ENG.circuits.length === 0 && ENG.devices.length === 0, "Scene must not require wiring");

for (const solid of D.solids) {
  assert(
    solid.x1 >= D.bounds.xMin &&
      solid.y1 >= D.bounds.yMin &&
      solid.x2 <= D.bounds.xMax &&
      solid.y2 <= D.bounds.yMax,
    `${solid.name || solid.mat} lies outside bounds`,
  );
}
for (const background of D.backgrounds) {
  assert(
    background.x1 >= D.bounds.xMin &&
      background.y1 >= D.bounds.yMin &&
      background.x2 <= D.bounds.xMax &&
      background.y2 <= D.bounds.yMax,
    `${background.name || background.mat} lies outside bounds`,
  );
}
for (const object of D.objects) {
  assert(
    object.x >= D.bounds.xMin &&
      object.y >= D.bounds.yMin &&
      object.x + object.w - 1 <= D.bounds.xMax &&
      object.y + object.h - 1 <= D.bounds.yMax,
    `${object.id} lies outside bounds`,
  );
}

const serialized = JSON.stringify(D).toLowerCase();
for (const forbidden of ["dungeon", "skeletron", "данж"]) {
  assert(!serialized.includes(forbidden), `World-specific term leaked into scene: ${forbidden}`);
}

const html = fs.readFileSync(path.join(root, "underground.html"), "utf8");
assert(html.includes("Снежная мастерская Гоблина v3"), "V3 title is missing");
assert(html.includes("рыбалка 20×16"), "Fishing title is missing");
assert(html.includes("320 тайлов"), "Water volume is missing from HTML");
assert(html.includes("четыре сундука"), "Updated storage count is missing");
assert(html.includes("./underground.html"), "Underground scene tab is missing");
assert(html.includes("./desert.html"), "Desert scene tab is missing");
assert(html.includes("./index.html"), "Main scene tab is missing");

if (errors.length) {
  console.error("UNDERGROUND CHECK: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("UNDERGROUND CHECK: PASS");
console.log(
  JSON.stringify(
    {
      rooms: D.rooms.length,
      residents: residents.map((npc) => npc.name),
      goblinPriceModifier: D.validation.goblinPriceModifier,
      neighborDistances: { mechanic: mechanicDistance, princess: princessDistance },
      pylon: pylons[0].name,
      doors: doors.length,
      coveredDoorTiles,
      openableDoors,
      doorClearance,
      doorModules: displayedDoorModules,
      goblinStyleTiles,
      waterTiles: water.tiles,
      pool: `${water.w}×${water.h}`,
      platformLevels,
      platformTiles,
      platformTilesWithWall,
      hatches: D.objects.filter((object) => object.kind === "hatch").length,
      chests: chests.length,
      iceBlocks,
      snowFloorTiles,
      iceBiomeBlocks,
      wiringCircuits: ENG.circuits.length,
    },
    null,
    2,
  ),
);
