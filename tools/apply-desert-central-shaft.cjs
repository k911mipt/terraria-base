#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const write = (relative, content) =>
  fs.writeFileSync(path.join(root, relative), content.trimEnd() + "\n", "utf8");

function evaluate(relative, names) {
  const context = vm.createContext({ console });
  vm.runInContext(read(relative), context, { filename: relative });
  return Object.fromEntries(
    names.map((name) => [
      name,
      vm.runInContext("JSON.parse(JSON.stringify(" + name + "))", context),
    ]),
  );
}

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error("Missing replacement: " + label);
  return source.replace(from, to);
}

const layout = evaluate("js/data/desert/layout.js", [
  "DESERT_BOUNDS",
  "DESERT_ROOMS",
  "DESERT_RESERVES",
  "DESERT_VALIDATION",
  "DESERT_NOTES",
  "DESERT_TITLE",
]);
const solids = evaluate("js/data/desert/solids.js", ["DESERT_SOLIDS"]).DESERT_SOLIDS;
const backgrounds = evaluate("js/data/desert/backgrounds.js", ["DESERT_BACKGROUNDS"]).DESERT_BACKGROUNDS;
const objects = evaluate("js/data/desert/objects.js", ["DESERT_OBJECTS"]).DESERT_OBJECTS;

layout.DESERT_ROOMS = layout.DESERT_ROOMS
  .filter((room) => !["desert_fishing", "desert_access"].includes(room.id))
  .map((room) => {
    const next = { ...room };
    if (room.id === "desert_surface") {
      next.desc = "Компактный аванпост с двумя NPC-комнатами, Desert Pylon, одноблочным полом и центральной шахтой прямо под люком.";
    }
    if (room.id === "desert_shaft") {
      next.name = "Центральный спуск в подземную пустыню";
      next.x1 = 48;
      next.y1 = 20;
      next.x2 = 55;
      next.y2 = 70;
      next.short = "СПУСК 7";
      next.desc = "Люк x49–50 открывается прямо в шахту x49–54. Боковая дверь на x48 ведёт к бассейну; платформы идут y27/34/41/48/55/62/69.";
    }
    if (room.id === "desert_service") {
      next.name = "Сервис и рыбалка";
      next.x1 = 14;
      next.y1 = 20;
      next.x2 = 47;
      next.y2 = 27;
      next.short = "СЕРВИС / РЫБАЛКА";
      next.desc = "Нижняя комната с тремя сундуками и рыболовным мостиком. Отдельного «рыболовного зала» больше нет; бассейн является обычным объектом под мостиком.";
    }
    return next;
  });

Object.assign(layout.DESERT_VALIDATION, {
  status: "PASS",
  rooms: 6,
  separateFishingHall: false,
  shaftUnderHatch: true,
  shaftX: [49, 54],
  shaftDoorX: 48,
  accessDoors: 1,
  totalDoors: 5,
  descentPlatforms: [27, 34, 41, 48, 55, 62, 69],
  lowerRoomInterior: "34×6",
  lowerRoomWallTiles: 204,
});
delete layout.DESERT_VALIDATION.fishingHall;
delete layout.DESERT_VALIDATION.accessX;
layout.DESERT_NOTES = [
  "Сцена универсальна и не привязана к расположению конкретных мировых структур.",
  "Отдельного помещения с названием «рыболовный зал» нет: мостик, сундуки и бассейн входят в одну сервисную зону.",
  "Люк x49–50 ведёт прямо в центральную шахту x49–54; отдельная шахта справа удалена.",
  "Боковая дверь x48, y24–26 соединяет шахту с сервисной комнатой и бассейном.",
  "Бассейн 20×16 сохраняет координаты x28–47, y28–43 и 320 тайлов воды.",
  "Платформы центральной шахты расположены на y27/34/41/48/55/62/69 с постоянным шагом 7.",
];

const nextSolids = [];
for (const solid of solids) {
  if (
    solid.name === "Правая сервисная площадка" ||
    solid.name === "Верх стены у прямого спуска" ||
    solid.name === "Общая стена бассейна и прямого спуска" ||
    solid.name === "Правая стена прямого спуска" ||
    solid.platformGroup === "descent"
  ) {
    continue;
  }

  const next = { ...solid };
  if (solid.name === "Правая естественная масса пустыни") {
    next.x1 = 56;
    next.desc = "Естественный Sand Block начинается сразу за правой стеной центральной шахты на x55.";
  }
  if (solid.name === "Дно поднятого рыболовного зала") {
    next.x2 = 48;
    next.name = "Дно бассейна и левый борт шахты";
    next.desc = "Одноблочное дно под водой x28–47; блок x48 связывает стеклянный борт с левой стеной шахты.";
  }
  nextSolids.push(next);
}

nextSolids.push(
  {
    x1: 48,
    y1: 21,
    x2: 48,
    y2: 23,
    mat: "sandstone_block_plain",
    name: "Верх левой стены центральной шахты",
    desc: "Проём y24–26 оставлен под дверь из шахты в сервисную комнату.",
  },
  {
    x1: 48,
    y1: 27,
    x2: 48,
    y2: 27,
    mat: "sandstone_block_plain",
    name: "Порог двери центральной шахты",
    desc: "Твёрдый блок под дверью; справа начинается верхняя платформа шахты.",
  },
  {
    x1: 48,
    y1: 44,
    x2: 48,
    y2: 69,
    mat: "sandstone_block_plain",
    name: "Нижняя левая стена центральной шахты",
    desc: "Продолжает левую границу шахты ниже стеклянного борта бассейна.",
  },
  {
    x1: 55,
    y1: 21,
    x2: 55,
    y2: 69,
    mat: "sandstone_block_plain",
    name: "Правая стена центральной шахты",
    desc: "Шахта x49–54 заканчивается стеной x55; естественный песок начинается с x56.",
  },
);

for (const level of [27, 34, 41, 48, 55, 62, 69]) {
  nextSolids.push({
    x1: 49,
    y1: level,
    x2: 54,
    y2: level,
    mat: "palm_platform",
    name: "Площадка центрального спуска y" + level,
    desc: level === 27
      ? "Верхняя площадка находится прямо под люком и совпадает с рыболовным этажом."
      : "Площадка центрального спуска с шагом ровно семь тайлов.",
    platformGroup: "descent",
    platformLevel: level,
  });
}

const nextBackgrounds = backgrounds.filter(
  (background) => ![
    "Фон нижней сервисной комнаты",
    "Фон сервисной шахты",
    "Фон правой сервисной ниши",
    "Фон прямого спуска",
  ].includes(background.name),
);
nextBackgrounds.push(
  {
    x1: 14,
    y1: 21,
    x2: 47,
    y2: 26,
    mat: "sandstone_wall_plain",
    name: "Фон сервисной и рыболовной зоны",
    desc: "Безопасная стена закрывает нижнюю комнату с сундуками и мостиком; отдельного рыболовного зала нет.",
  },
  {
    x1: 49,
    y1: 21,
    x2: 54,
    y2: 69,
    mat: "sandstone_wall_plain",
    name: "Фон центрального спуска",
    desc: "Безопасная поставленная игроком стена закрывает шахту непосредственно под люком.",
  },
);

const nextObjects = objects.map((object) => {
  const next = { ...object };
  if (object.id === "D_HATCH") {
    next.desc = "Люк 2×1 открывается прямо в центральную шахту x49–54; спуск не требует отдельной боковой шахты.";
  }
  if (object.id === "DESERT_LOOT") {
    next.x = 44;
    next.room = "desert_service";
    next.desc = "Сундук перенесён на правую половину рыболовного мостика; отдельная сервисная площадка справа удалена.";
  }
  if (object.id === "DESERT_SERVICE_LIGHT_R") {
    next.x = 44;
    next.room = "desert_service";
    next.desc = "Правый свет сервисной зоны над сундуком DESERT и мостиком.";
  }
  if (object.id === "DESERT_WATER") {
    next.room = "desert_service";
    next.desc = "Бассейн 20×16 является частью общей сервисной и рыболовной зоны; отдельного помещения-«зала» нет.";
  }
  if (object.id === "DESERT_ACCESS_INNER") {
    next.name = "Дверь из центральной шахты";
    next.x = 48;
    next.y = 24;
    next.room = "desert_shaft";
    next.desc = "Боковая дверь соединяет центральную шахту под люком с сервисной комнатой и бассейном.";
  }
  if (object.id === "DESERT_ACCESS_LIGHT") {
    next.x = 52;
    next.room = "desert_shaft";
    next.desc = "Верхний свет центральной шахты непосредственно под люком.";
  }
  if (/^DESERT_ACCESS_LIGHT_[1-6]$/.test(object.id)) {
    next.x = 54;
    next.room = "desert_shaft";
  }
  return next;
});

write(
  "js/data/desert/layout.js",
  "// Desert outpost bounds, rooms and design metadata.\n" +
    "const DESERT_BOUNDS = " + JSON.stringify(layout.DESERT_BOUNDS, null, 2) + ";\n\n" +
    "const DESERT_ROOMS = " + JSON.stringify(layout.DESERT_ROOMS, null, 2) + ";\n\n" +
    "const DESERT_RESERVES = " + JSON.stringify(layout.DESERT_RESERVES, null, 2) + ";\n\n" +
    "const DESERT_VALIDATION = " + JSON.stringify(layout.DESERT_VALIDATION, null, 2) + ";\n\n" +
    "const DESERT_NOTES = " + JSON.stringify(layout.DESERT_NOTES, null, 2) + ";\n\n" +
    "const DESERT_TITLE = " + JSON.stringify(layout.DESERT_TITLE) + ";",
);
write(
  "js/data/desert/solids.js",
  "// Foreground blocks and platforms for the compact desert outpost.\n" +
    "const DESERT_SOLIDS = " + JSON.stringify(nextSolids, null, 2) + ";",
);
write(
  "js/data/desert/backgrounds.js",
  "// Safe player-placed walls for housing, service/fishing and the central shaft.\n" +
    "const DESERT_BACKGROUNDS = " + JSON.stringify(nextBackgrounds, null, 2) + ";",
);
write(
  "js/data/desert/objects.js",
  "// Furniture, NPCs, local storage, pylon, water and landscape accents.\n" +
    "const DESERT_OBJECTS = " + JSON.stringify(nextObjects, null, 2) + ";",
);

let engineering = read("js/data/desert/engineering.js");
engineering = engineering.replace(/v5/g, "v6");
write("js/data/desert/engineering.js", engineering);

let interactions = read("js/runtime/interactions-desert.js");
interactions = replaceRequired(
  interactions,
  'document.getElementById("craft").onclick = () => focusRect(12, 18, 56, 29, 2);',
  'document.getElementById("craft").onclick = () => focusRect(12, 18, 49, 29, 2);',
  "service focus",
);
interactions = replaceRequired(
  interactions,
  'document.getElementById("arena").onclick = () => focusRect(25, 25, 56, 46, 2);',
  'document.getElementById("arena").onclick = () => focusRect(25, 25, 50, 46, 2);',
  "pool focus",
);
interactions = replaceRequired(
  interactions,
  'document.getElementById("pitsBtn").onclick = () => focusRect(51, 18, 64, 71, 2);',
  'document.getElementById("pitsBtn").onclick = () => focusRect(46, 18, 57, 71, 2);',
  "shaft focus",
);
write("js/runtime/interactions-desert.js", interactions);

let tables = read("js/runtime/tables-desert.js");
tables = tables.replace(
  '    ["good", `фундамент: ${v.foundationTiles} тайлов`],',
  '    ["good", `отдельный рыболовный зал: ${v.separateFishingHall ? "да" : "нет"}`],\n    ["good", `шахта под люком: ${v.shaftUnderHatch ? "да" : "нет"}`],',
);
write("js/runtime/tables-desert.js", tables);

let html = read("desert.html");
html = replaceRequired(html, ">Рыболовный зал</button", ">Бассейн</button", "pool button");
html = replaceRequired(html, "Пустынный аванпост v5", "Пустынный аванпост v6", "version");
html = replaceRequired(
  html,
  "Павильон сохраняет ширину 55 тайлов и одноблочный пол y20. Вместо\n            шеститайлового фундамента под ним теперь безопасная сервисная комната,\n            а мостик и бассейн подняты на уровень y27/y28.",
  "Под люком теперь находится единая центральная шахта. Отдельный\n            «поднятый рыболовный зал» удалён: бассейн, мостик и сундуки входят в\n            одну сервисную зону слева от шахты.",
  "inspector intro",
);
html = replaceRequired(
  html,
  "Пол павильона — одна полоса блоков на y20. Под ним находится комната\n          высотой шесть тайлов с безопасной фоновой стеной, поэтому мобы внутри не\n          спавнятся. Вода занимает x28–47, y28–43; дверь спуска — y24–26, а\n          платформы шахты идут y27/34/41/48/55/62/69.",
  "Люк x49–50 открывается прямо в шахту x49–54. Через боковую дверь x48\n          можно выйти к сундукам и бассейну 20×16. Справа больше нет отдельной\n          шахты, сервисной площадки или помещения с названием «рыболовный зал».",
  "inspector note",
);
html = html.replace(
  "Под комнатами безопасная сервисная комната; пол павильона — 1",
  "Бассейн и сундуки — часть сервисной зоны; отдельного зала нет",
);
write("desert.html", html);

let docs = read("docs/desert-outpost.md");
docs = docs.replace(/## Геометрия v5[\s\S]*?\n## Данные/, [
  "## Геометрия v6",
  "",
  "- поверхностный люк находится на `x49…50, y20`;",
  "- шахта расположена непосредственно под ним: внутреннее пространство `x49…54`;",
  "- отдельная правая шахта полностью удалена;",
  "- боковая дверь `x48, y24…26` соединяет шахту с сервисной зоной;",
  "- отдельного модуля «Поднятый пустынный рыболовный зал» больше нет;",
  "- сервисная зона занимает `x14…47, y21…26` и содержит три нижних сундука;",
  "- мостик находится на `y27`, бассейн 20×16 — на `x28…47, y28…43`;",
  "- сундук DESERT перенесён на правую половину мостика;",
  "- платформы центральной шахты: `y27 / y34 / y41 / y48 / y55 / y62 / y69`;",
  "- правая стена шахты находится на `x55`, естественный песок начинается с `x56`;",
  "- безопасная фоновая стена закрывает сервисную комнату и центральную шахту.",
  "",
  "## Данные",
].join("\n"));
docs = docs.replace(
  "Проверка фиксирует два NPC, один пилон, пять сундуков, отсутствие фундаментных блоков, безопасную комнату 41×6, бассейн 20×16 на y28–43 и платформы прямой шахты y27/34/41/48/55/62/69.",
  "Проверка фиксирует шесть функциональных модулей, отсутствие отдельного рыболовного зала, шахту непосредственно под люком, бассейн 20×16 и платформы y27/34/41/48/55/62/69.",
);
write("docs/desert-outpost.md", docs);

function generatedCheck() {
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
  assert(serviceWall && serviceWall.x1 === 14 && serviceWall.x2 === 47 && serviceWall.y1 === 21 && serviceWall.y2 === 26, "Service wall mismatch");
  assert(!D.solids.some((solid) => solid.name === "Правая сервисная площадка"), "Legacy right service platform must be removed");
  assert(!D.backgrounds.some((background) => background.name === "Фон правой сервисной ниши"), "Legacy right niche wall must be removed");
  const html = fs.readFileSync(path.join(root, "desert.html"), "utf8");
  assert(!html.includes("Поднятый пустынный рыболовный зал"), "Legacy fishing-hall label remains in HTML");
  assert(html.includes(">Бассейн</button"), "Pool navigation button is missing");
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
}
write("tools/check-desert.cjs", "#!/usr/bin/env node\n(" + generatedCheck.toString() + ")();");

console.log("Applied central-shaft desert redesign.");
