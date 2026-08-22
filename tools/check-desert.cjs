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
for (const relative of scripts)
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename: relative });
const { D, ENG } = vm.runInContext(
  "({ D: JSON.parse(JSON.stringify(D)), ENG: JSON.parse(JSON.stringify(ENG)) })",
  context,
);
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(new Set(D.objects.map((object) => object.id)).size === D.objects.length, "Object IDs must be unique");
assert(D.rooms.length === 8, "Expected 8 rooms");
assert(D.objects.filter((object) => object.kind === "npc").length === 2, "Expected two NPCs");
assert(D.objects.filter((object) => object.kind === "pylon").length === 1, "Expected one pylon");
assert(D.objects.filter((object) => object.kind === "chest").length === 5, "Expected five chests");
assert(D.objects.filter((object) => object.kind === "door").length === 5, "Expected five doors");
assert(ENG.circuits.length === 0 && ENG.devices.length === 0, "Desert v5 must not require wiring");

const water = D.objects.find((object) => object.id === "DESERT_WATER");
assert(water?.x === 28 && water?.y === 28, "Water must start at x28 y28");
assert(water?.w === 20 && water?.h === 16 && water?.tiles === 320, "Water must be 20×16 = 320");
assert(JSON.stringify(D.validation.waterY) === JSON.stringify([28, 43]), "Water Y snapshot mismatch");

const deck = D.solids.filter((solid) => solid.platformGroup === "fishing_deck").sort((a, b) => a.x1 - b.x1);
assert(deck.length === 2, "Fishing deck must have two halves");
assert(deck[0]?.x1 === 28 && deck[0]?.x2 === 35 && deck[1]?.x1 === 40 && deck[1]?.x2 === 47, "Fishing deck X geometry mismatch");
assert(deck.every((solid) => solid.y1 === 27 && solid.y2 === 27), "Fishing deck must be on y27");
assert(D.solids.some((solid) => solid.name === "Дно поднятого рыболовного зала" && solid.y1 === 44), "Pool bottom must be y44");

assert(!D.solids.some((solid) => solid.foundation), "Filled foundation blocks must be removed");
assert(D.validation.foundationTiles === 0, "Foundation snapshot must be zero");
assert(JSON.stringify(D.validation.centralLevels) === JSON.stringify([20, 27]), "Central levels must be y20/y27");
assert(D.validation.oneTileFloorY === 20, "Surface floor must stay on y20");

const lowerWall = D.backgrounds.find((background) => background.name === "Фон нижней сервисной комнаты");
assert(lowerWall?.x1 === 14 && lowerWall?.x2 === 54 && lowerWall?.y1 === 21 && lowerWall?.y2 === 26, "Lower safe wall must cover x14–54 y21–26");
assert((lowerWall.x2 - lowerWall.x1 + 1) * (lowerWall.y2 - lowerWall.y1 + 1) === 246, "Lower safe wall must cover 246 tiles");
assert(D.validation.lowerRoomInterior === "41×6", "Lower room snapshot mismatch");

const accessDoor = D.objects.find((object) => object.id === "DESERT_ACCESS_INNER");
assert(accessDoor?.x === 54 && accessDoor?.y === 24 && accessDoor?.h === 3, "Descent door must be x54 y24–26");
const descent = D.solids.filter((solid) => solid.platformGroup === "descent").sort((a, b) => a.platformLevel - b.platformLevel);
const levels = descent.map((solid) => solid.platformLevel);
assert(JSON.stringify(levels) === JSON.stringify([27, 34, 41, 48, 55, 62, 69]), "Descent levels mismatch");
assert(levels.slice(1).every((level, index) => level - levels[index] === 7), "Descent step must be seven tiles");
assert(descent.every((solid) => solid.x1 === 55 && solid.x2 === 61), "Descent platforms must span x55–61");
const shaftWall = D.backgrounds.find((background) => background.name === "Фон прямого спуска");
assert(shaftWall?.x1 === 55 && shaftWall?.x2 === 61 && shaftWall?.y1 === 21 && shaftWall?.y2 === 69, "Direct shaft safe wall mismatch");
assert(D.objects.some((object) => object.id === "DESERT_ACCESS_LIGHT_6" && object.y === 65), "Final shaft light is missing");

for (const solid of D.solids)
  assert(solid.x1 >= D.bounds.xMin && solid.x2 <= D.bounds.xMax && solid.y1 >= D.bounds.yMin && solid.y2 <= D.bounds.yMax, (solid.name || solid.mat) + " outside bounds");
for (const background of D.backgrounds)
  assert(background.x1 >= D.bounds.xMin && background.x2 <= D.bounds.xMax && background.y1 >= D.bounds.yMin && background.y2 <= D.bounds.yMax, (background.name || background.mat) + " outside bounds");
for (const object of D.objects)
  assert(object.x >= D.bounds.xMin && object.x + object.w - 1 <= D.bounds.xMax && object.y >= D.bounds.yMin && object.y + object.h - 1 <= D.bounds.yMax, object.id + " outside bounds");

const serialized = JSON.stringify(D).toLowerCase();
assert(!serialized.includes("skeletron") && !serialized.includes("данж"), "World-specific location leaked into scene");
const html = fs.readFileSync(path.join(root, "desert.html"), "utf8");
assert(html.includes("Пустынный аванпост v5"), "HTML version must be v5");
assert(html.includes("одноблочный пол") || html.includes("одна полоса"), "HTML must describe the one-tile floor");

if (errors.length) {
  console.error("DESERT CHECK: FAIL");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("DESERT CHECK: PASS");
console.log(JSON.stringify({
  rooms: D.rooms.length,
  solids: D.solids.length,
  backgrounds: D.backgrounds.length,
  objects: D.objects.length,
  foundationTiles: D.validation.foundationTiles,
  lowerRoom: D.validation.lowerRoomInterior,
  waterTiles: water.tiles,
  waterY: D.validation.waterY,
  centralLevels: D.validation.centralLevels,
  descentLevels: levels,
  wiringCircuits: ENG.circuits.length,
}, null, 2));
