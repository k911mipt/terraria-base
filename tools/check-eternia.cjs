#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ console });
for (const relative of [
  "js/data/solids/upper.js",
  "js/data/solids/street.js",
  "js/data/objects/arena.js",
  "js/data/objects/eternia.js",
]) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, {
    filename: relative,
  });
}

const data = vm.runInContext(
  `({
    upper: JSON.parse(JSON.stringify(SOLIDS_UPPER)),
    street: JSON.parse(JSON.stringify(SOLIDS_STREET)),
    arena: JSON.parse(JSON.stringify(OBJECTS_ARENA)),
    eternia: JSON.parse(JSON.stringify(OBJECTS_ETERNIA)),
  })`,
  context,
);

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const stand = data.eternia.find((object) => object.id === "ETERNIA_STAND");
assert(Boolean(stand), "ETERNIA_STAND is missing");
assert(
  stand?.x === -119 && stand?.y === 51 && stand?.w === 5 && stand?.h === 3,
  "Eternia Crystal Stand must occupy x-119…-115, y51…53",
);
assert(stand?.centerX === -117, "Stand center must be x-117");
assert(
  stand?.foregroundPaintEn === "None",
  "Eternia stand must remain unpainted",
);

const floor = data.street.find(
  (solid) => solid.name === "Пол левой босс-арены",
);
assert(
  floor &&
    floor.x1 === -200 &&
    floor.x2 === -33 &&
    floor.y1 === 54 &&
    floor.y2 === 54 &&
    floor.mat === "gray_brick",
  "Left boss-arena floor must remain a continuous Gray Brick row x-200…-33 y54",
);

const leftClearance = stand.centerX - floor.x1;
const rightClearance = floor.x2 - stand.centerX;
assert(leftClearance === 83, `Expected 83 left tiles, found ${leftClearance}`);
assert(rightClearance === 84, `Expected 84 right tiles, found ${rightClearance}`);
assert(
  leftClearance >= stand.requiredClearanceEachSide &&
    rightClearance >= stand.requiredClearanceEachSide,
  "Stand must have at least 61 floor tiles on both sides",
);

const supportingTiles = [];
for (let x = stand.x; x < stand.x + stand.w; x += 1) {
  const support = [...data.upper, ...data.street].find(
    (solid) =>
      x >= solid.x1 &&
      x <= solid.x2 &&
      stand.floorY >= solid.y1 &&
      stand.floorY <= solid.y2,
  );
  supportingTiles.push(support?.mat || null);
}
assert(
  supportingTiles.every((material) => material === "gray_brick"),
  "All five stand tiles must be supported by solid Gray Brick, not platforms",
);

const obstructingSolids = [...data.upper, ...data.street].filter((solid) => {
  if (solid.mat.includes("platform") || solid.mat === "bubble") return false;
  const overlapsX = solid.x2 >= stand.centerX - 61 && solid.x1 <= stand.centerX + 61;
  const overlapsClearHeight = solid.y2 >= 44 && solid.y1 <= 53;
  return overlapsX && overlapsClearHeight;
});
assert(
  obstructingSolids.length === 0,
  `Solid obstruction inside the 10-tile event clearance: ${obstructingSolids
    .map((solid) => solid.name || solid.mat)
    .join(", ")}`,
);

for (const y of [11, 21, 31, 41]) {
  const platform = data.upper.find(
    (solid) =>
      solid.bossArenaLeft &&
      solid.mat === "boreal_platform_plain" &&
      solid.x1 === -198 &&
      solid.x2 === -35 &&
      solid.y1 === y &&
      solid.y2 === y,
  );
  assert(Boolean(platform), `Boss platform y${y} must remain unchanged`);
}

const bast = data.arena.find((object) => object.id === "BOSS_BAST_C");
assert(
  bast && bast.x === -123 && bast.y === 38,
  "Bast Statue must move onto the y41 platform and clear the event floor",
);

for (const [id, x] of [
  ["ETERNIA_SENTRY_L", -161],
  ["ETERNIA_SENTRY_R", -77],
]) {
  const zone = data.eternia.find((object) => object.id === id);
  assert(
    zone && zone.x === x && zone.y === 28 && zone.w === 5 && zone.h === 3,
    `${id} geometry mismatch`,
  );
}

for (const [id, x] of [
  ["ETERNIA_PORTAL_L", -200],
  ["ETERNIA_PORTAL_R", -37],
]) {
  const zone = data.eternia.find((object) => object.id === id);
  assert(
    zone && zone.x === x && zone.y === 49 && zone.w === 5 && zone.h === 5,
    `${id} geometry mismatch`,
  );
}

assert(
  data.eternia.every((object) => object.arenaSpec && object.bossArenaLeft),
  "Every Eternia object must appear in the left-arena specification",
);
assert(
  new Set(data.eternia.map((object) => object.id)).size === data.eternia.length,
  "Eternia object IDs must be unique",
);
assert(data.eternia.length === 5, "Expected one stand and four planning zones");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const arenaScript = html.indexOf('./js/data/objects/arena.js');
const eterniaScript = html.indexOf('./js/data/objects/eternia.js');
const objectIndexScript = html.indexOf('./js/data/objects/index.js');
assert(
  arenaScript >= 0 && eterniaScript > arenaScript && objectIndexScript > eterniaScript,
  "index.html must load arena.js, eternia.js and objects/index.js in that order",
);
assert(
  html.includes('<button id="bossLeft">Босс / Этерия</button'),
  "Left-arena navigation button was not renamed",
);

const objectIndex = fs.readFileSync(
  path.join(root, "js/data/objects/index.js"),
  "utf8",
);
assert(
  objectIndex.includes("...OBJECTS_ETERNIA"),
  "OBJECTS_ETERNIA is missing from foreground-object assembly",
);

const checkData = fs.readFileSync(path.join(root, "tools/check-data.cjs"), "utf8");
assert(
  checkData.includes('"js/data/objects/eternia.js"'),
  "check-data.cjs must load the Eternia object module",
);

if (errors.length) {
  console.error("ETERNIA CHECK: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("ETERNIA CHECK: PASS");
console.log(
  JSON.stringify(
    {
      stand: "5×3 · x-119…-115 · y51…53",
      centerX: stand.centerX,
      floorY: stand.floorY,
      clearances: { left: leftClearance, right: rightClearance },
      firstPlatformY: 41,
      sentryZones: 2,
      portalZones: 2,
      paints: 0,
    },
    null,
    2,
  ),
);
