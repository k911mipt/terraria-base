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

assert(D.validation.status === "PASS", "Frozen underground status is not PASS");
assert(D.bounds.xMin === 0 && D.bounds.xMax === 65, "Scene X bounds changed");
assert(D.bounds.yMin === 0 && D.bounds.yMax === 34, "Scene Y bounds changed");
assert(D.rooms.length === 6, `Expected 6 modules, found ${D.rooms.length}`);
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
assert(!D.objects.some((object) => object.id === "UG_DYE_VAT"), "Dye Vat must not remain in the Princess room");

const goblin = D.objects.find((object) => object.id === "UG_GOBLIN");
const mechanic = D.objects.find((object) => object.id === "UG_MECHANIC");
const princess = D.objects.find((object) => object.id === "UG_PRINCESS");
const centerX = (object) => object.x + object.w / 2;
const mechanicDistance = Math.abs(centerX(goblin) - centerX(mechanic));
const princessDistance = Math.abs(centerX(goblin) - centerX(princess));
assert(mechanicDistance === 17, `Mechanic distance changed: ${mechanicDistance}`);
assert(princessDistance === 12, `Princess distance changed: ${princessDistance}`);
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

const expectedDoorModules = {
  UG_OUTER_L: "underground_mechanic",
  UG_MECH_GOBLIN: "underground_goblin",
  UG_GOBLIN_PRINCESS: "underground_goblin",
  UG_OUTER_R: "underground_princess",
};
for (const [doorId, roomId] of Object.entries(expectedDoorModules)) {
  assert(
    displayedDoorModules[doorId] === roomId,
    `${doorId} table module must honor declared room ${roomId}, found ${displayedDoorModules[doorId]}`,
  );
}

const iceBiomeBlocks = D.solids
  .filter((solid) => solid.iceBiome)
  .reduce(
    (total, solid) =>
      total + (solid.x2 - solid.x1 + 1) * (solid.y2 - solid.y1 + 1),
    0,
  );
assert(iceBiomeBlocks === 1536, `Expected 1536 Ice tiles, found ${iceBiomeBlocks}`);
assert(D.validation.iceBiomeBlocks === iceBiomeBlocks, "Ice-biome snapshot mismatch");
assert(
  iceBiomeBlocks >= D.validation.iceBiomeThreshold &&
    D.validation.iceBiomeThreshold === 1500 &&
    D.validation.iceBiomeGuaranteed === true,
  "Ice biome must be guaranteed by at least 1500 Snow/Ice blocks",
);
assert(
  D.solids
    .filter((solid) => solid.iceBiome)
    .every((solid) => ["ice_block_plain", "snow_block_plain"].includes(solid.mat)),
  "All biome-counted regions must use Ice or Snow Blocks",
);
assert(!D.solids.some((solid) => solid.mat === "stone_block_plain"), "Legacy Stone context must be removed");
const snowFloorTiles = D.solids
  .filter((solid) => solid.mat === "snow_block_plain")
  .reduce(
    (total, solid) =>
      total + (solid.x2 - solid.x1 + 1) * (solid.y2 - solid.y1 + 1),
    0,
  );
assert(snowFloorTiles === 24, `Expected 24 Snow floor tiles, found ${snowFloorTiles}`);

assert(
  !D.solids.some((solid) => solid.mat.endsWith("_platform")),
  "Underground Snow v1 must not contain platforms",
);
assert(
  !D.objects.some((object) => object.kind === "hatch"),
  "Underground Snow v1 must not contain hatches",
);
assert(ENG.circuits.length === 0 && ENG.devices.length === 0, "Scene must not require wiring");

const chests = D.objects.filter((object) => object.kind === "chest");
assert(chests.length === 3, `Expected three local chests, found ${chests.length}`);
for (const chest of chests) {
  assert(chest.customName.length === chest.customNameLength, `${chest.id} customNameLength mismatch`);
  assert(chest.customNameLength <= 20, `${chest.id} custom name exceeds 20 characters`);
}
assert(
  D.objects.filter((object) => object.id === "UG_TINKERERS_WORKSHOP").length === 1,
  "Tinkerer's Workshop missing",
);
assert(D.objects.filter((object) => object.id === "UG_SAFE").length === 1, "Safe missing");
assert(D.objects.filter((object) => object.id === "UG_PRINCESS_BED").length === 1, "Princess bed missing");

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
assert(html.includes("Мастерская Гоблина"), "Third-scene title is missing");
assert(html.includes("Принцесса"), "Princess room is missing from HTML");
assert(html.includes("1536 Snow/Ice Blocks"), "Guaranteed Ice biome is not explained in HTML");
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
      pylonWorksBeforePrincess: D.validation.pylonWorksBeforePrincess,
      doors: doors.length,
      coveredDoorTiles,
      doorModules: displayedDoorModules,
      chests: chests.length,
      iceBiomeBlocks,
      iceBiomeThreshold: D.validation.iceBiomeThreshold,
      snowFloorTiles,
      wiringCircuits: ENG.circuits.length,
    },
    null,
    2,
  ),
);
