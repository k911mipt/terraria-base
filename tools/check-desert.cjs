#!/usr/bin/env node
(function generatedCheck() {
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
    vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename: relative });
  }
  const model = vm.runInContext("({ D: JSON.parse(JSON.stringify(D)), ENG: JSON.parse(JSON.stringify(ENG)) })", context);
  const D = model.D;
  const ENG = model.ENG;
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  const ids = D.objects.map((object) => object.id);
  assert(new Set(ids).size === ids.length, "Object IDs must be unique");
  assert(D.rooms.length === 6, "Expected six functional rooms/modules");
  assert(!D.rooms.some((room) => room.id === "desert_fishing"), "Separate fishing-hall room must be removed");
  assert(!D.rooms.some((room) => room.id === "desert_access"), "Separate access room must be removed");
  assert(D.validation.separateFishingHall === false, "Fishing hall snapshot must be false");
  assert(D.validation.shaftUnderHatch === true, "Shaft must be under hatch");
  assert(JSON.stringify(D.validation.shaftX) === JSON.stringify([49, 54]), "Shaft X snapshot mismatch");
  assert(D.objects.filter((object) => object.kind === "npc").length === 2, "Expected two NPCs");
  assert(D.objects.filter((object) => object.kind === "pylon").length === 1, "Expected one pylon");
  assert(D.objects.filter((object) => object.kind === "chest").length === 5, "Expected five chests");
  assert(D.objects.filter((object) => object.kind === "door").length === 5, "Expected five doors");
  assert(ENG.circuits.length === 0 && ENG.devices.length === 0, "Desert scene must not require wiring");
  const hatch = D.objects.find((object) => object.id === "D_HATCH");
  assert(hatch && hatch.x === 49 && hatch.w === 2 && hatch.y === 20, "Hatch coordinates changed unexpectedly");
  const water = D.objects.find((object) => object.id === "DESERT_WATER");
  assert(water && water.x === 28 && water.y === 28 && water.w === 20 && water.h === 16, "Pool must stay 20×16 at x28 y28");
  assert(water.tiles === 320, "Pool must contain 320 tiles");
  assert(water.room === "desert_service", "Pool must belong to service zone");
  const door = D.objects.find((object) => object.id === "DESERT_ACCESS_INNER");
  assert(door && door.x === 48 && door.y === 24 && door.h === 3, "Side shaft door must be x48 y24–26");
  assert(door.room === "desert_shaft", "Door must belong to central shaft");
  const loot = D.objects.find((object) => object.id === "DESERT_LOOT");
  assert(loot && loot.x === 44 && loot.y === 25, "DESERT chest must move onto right deck");
  const levels = D.solids.filter((solid) => solid.platformGroup === "descent").sort((a, b) => a.platformLevel - b.platformLevel);
  assert(JSON.stringify(levels.map((solid) => solid.platformLevel)) === JSON.stringify([27, 34, 41, 48, 55, 62, 69]), "Shaft platform levels mismatch");
  assert(levels.every((solid) => solid.x1 === 49 && solid.x2 === 54), "Shaft platforms must span x49–54");
  const shaftWall = D.backgrounds.find((background) => background.name === "Фон центрального спуска");
  assert(shaftWall && shaftWall.x1 === 49 && shaftWall.x2 === 54 && shaftWall.y1 === 21 && shaftWall.y2 === 69, "Central shaft wall mismatch");
  const serviceWall = D.backgrounds.find((background) => background.name === "Фон сервисной и рыболовной зоны");
  assert(serviceWall && serviceWall.x1 === 28 && serviceWall.x2 === 47 && serviceWall.y1 === 21 && serviceWall.y2 === 26, "Service wall mismatch");
  const serviceRoom = D.rooms.find((room) => room.id === "desert_service");
  assert(serviceRoom && serviceRoom.x1 === 28 && serviceRoom.x2 === 47, "Service room must start at x28");
  const armsSupport = D.solids.find((solid) => solid.name === "Естественный грунт под левым крылом");
  assert(armsSupport && armsSupport.x1 === 14 && armsSupport.x2 === 27 && armsSupport.y1 === 21 && armsSupport.y2 === 26 && armsSupport.mat === "sand", "Natural sand support under Arms Dealer is missing");
  assert(D.validation.emptyUnderArms === false, "Under-Arms empty-space snapshot must be false");
  assert(D.validation.naturalSupportTiles === 84, "Natural support must contain 84 tiles");
  assert(D.validation.lowerRoomInterior === "20×6", "Service-zone size snapshot mismatch");
  assert(!D.solids.some((solid) => solid.name === "Правая сервисная площадка"), "Legacy right service platform must be removed");
  assert(!D.backgrounds.some((background) => background.name === "Фон правой сервисной ниши"), "Legacy right niche wall must be removed");
  const html = fs.readFileSync(path.join(root, "desert.html"), "utf8");
  assert(!html.includes("Поднятый пустынный рыболовный зал"), "Legacy fishing-hall label remains in HTML");
  assert(html.includes(">Бассейн</button"), "Pool navigation button is missing");
  assert(html.includes("Под Оружейником больше нет пустого пространства"), "HTML must explain the filled area under Arms Dealer");
  for (const solid of D.solids) {
    assert(solid.x1 >= D.bounds.xMin && solid.y1 >= D.bounds.yMin && solid.x2 <= D.bounds.xMax && solid.y2 <= D.bounds.yMax, (solid.name || solid.mat) + " outside bounds");
  }
  for (const background of D.backgrounds) {
    assert(background.x1 >= D.bounds.xMin && background.y1 >= D.bounds.yMin && background.x2 <= D.bounds.xMax && background.y2 <= D.bounds.yMax, (background.name || background.mat) + " outside bounds");
  }
  for (const object of D.objects) {
    assert(object.x >= D.bounds.xMin && object.y >= D.bounds.yMin && object.x + object.w - 1 <= D.bounds.xMax && object.y + object.h - 1 <= D.bounds.yMax, object.id + " outside bounds");
  }
  const serialized = JSON.stringify(D).toLowerCase();
  assert(!serialized.includes("skeletron") && !serialized.includes("данж"), "World-specific location leaked into scene");
  if (errors.length) {
    console.error("DESERT CHECK: FAIL");
    for (const error of errors) console.error("- " + error);
    process.exit(1);
  }
  console.log("DESERT CHECK: PASS");
  console.log(JSON.stringify({ rooms: D.rooms.length, waterTiles: water.tiles, shaftX: D.validation.shaftX, platformLevels: levels.map((solid) => solid.platformLevel), wiringCircuits: ENG.circuits.length }, null, 2));
})();
