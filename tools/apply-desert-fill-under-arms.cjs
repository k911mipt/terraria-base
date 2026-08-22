#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const write = (relative, content) =>
  fs.writeFileSync(path.join(root, relative), `${content.trimEnd()}\n`, "utf8");

function evaluate(relative, names) {
  const context = vm.createContext({ console });
  vm.runInContext(read(relative), context, { filename: relative });
  return Object.fromEntries(
    names.map((name) => [
      name,
      vm.runInContext(`JSON.parse(JSON.stringify(${name}))`, context),
    ]),
  );
}

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`Missing replacement: ${label}`);
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
let solids = evaluate("js/data/desert/solids.js", ["DESERT_SOLIDS"]).DESERT_SOLIDS;
const backgrounds = evaluate("js/data/desert/backgrounds.js", [
  "DESERT_BACKGROUNDS",
]).DESERT_BACKGROUNDS;

const surfaceRoom = layout.DESERT_ROOMS.find((room) => room.id === "desert_surface");
surfaceRoom.desc =
  "Компактный аванпост с двумя NPC-комнатами, Desert Pylon, центральной шахтой и естественным песком под левым жилым крылом.";

const serviceRoom = layout.DESERT_ROOMS.find((room) => room.id === "desert_service");
serviceRoom.x1 = 28;
serviceRoom.desc =
  "Сервисная и рыболовная зона начинается под центральным хабом на x28. Под Оружейником x14–27 находится естественный Sand Block, поэтому пустого помещения там нет.";

Object.assign(layout.DESERT_VALIDATION, {
  lowerRoomInterior: "20×6",
  lowerRoomWallTiles: 120,
  serviceX: [28, 47],
  naturalSupportTiles: 84,
  emptyUnderArms: false,
});

layout.DESERT_NOTES = [
  "Сцена универсальна и не привязана к расположению конкретных мировых структур.",
  "Под Оружейником нет комнаты или пустой полости: x14–27, y21–26 заполнены естественным Sand Block.",
  "Сервисная и рыболовная зона начинается на x28 непосредственно над бассейном и заканчивается у двери центральной шахты x48.",
  "Люк x49–50 ведёт прямо в центральную шахту x49–54.",
  "Бассейн 20×16 сохраняет координаты x28–47, y28–43 и 320 тайлов воды.",
  "Платформы центральной шахты расположены на y27/34/41/48/55/62/69 с постоянным шагом 7.",
];

solids = solids.filter((solid) => solid.name !== "Естественный грунт под левым крылом");
const leftGroundIndex = solids.findIndex((solid) => solid.name === "Левый верхний грунт");
if (leftGroundIndex < 0) throw new Error("Left upper ground not found");
solids.splice(leftGroundIndex + 1, 0, {
  x1: 14,
  y1: 21,
  x2: 27,
  y2: 26,
  mat: "sand",
  name: "Естественный грунт под левым крылом",
  desc: "Сплошной Sand Block под комнатой Оружейника. Это продолжение естественного рельефа, а не отдельный построенный фундамент или пустая комната.",
});

const serviceWall = backgrounds.find(
  (background) => background.name === "Фон сервисной и рыболовной зоны",
);
if (!serviceWall) throw new Error("Service wall not found");
serviceWall.x1 = 28;
serviceWall.desc =
  "Безопасная стена закрывает только реально используемую сервисную зону x28–47; под Оружейником находится естественный песок.";

write(
  "js/data/desert/layout.js",
  "// Desert outpost bounds, rooms and design metadata.\n" +
    `const DESERT_BOUNDS = ${JSON.stringify(layout.DESERT_BOUNDS, null, 2)};\n\n` +
    `const DESERT_ROOMS = ${JSON.stringify(layout.DESERT_ROOMS, null, 2)};\n\n` +
    `const DESERT_RESERVES = ${JSON.stringify(layout.DESERT_RESERVES, null, 2)};\n\n` +
    `const DESERT_VALIDATION = ${JSON.stringify(layout.DESERT_VALIDATION, null, 2)};\n\n` +
    `const DESERT_NOTES = ${JSON.stringify(layout.DESERT_NOTES, null, 2)};\n\n` +
    `const DESERT_TITLE = ${JSON.stringify(layout.DESERT_TITLE)};`,
);
write(
  "js/data/desert/solids.js",
  "// Foreground blocks and platforms for the compact desert outpost.\n" +
    `const DESERT_SOLIDS = ${JSON.stringify(solids, null, 2)};`,
);
write(
  "js/data/desert/backgrounds.js",
  "// Safe player-placed walls for housing, service/fishing and the central shaft.\n" +
    `const DESERT_BACKGROUNDS = ${JSON.stringify(backgrounds, null, 2)};`,
);

let engineering = read("js/data/desert/engineering.js");
engineering = engineering.replace(/v6/g, "v7");
write("js/data/desert/engineering.js", engineering);

let html = read("desert.html");
html = replaceRequired(html, "Пустынный аванпост v6", "Пустынный аванпост v7", "HTML version");
html = replaceRequired(
  html,
  "Под люком находится единая центральная шахта. Бассейн, мостик и\n            сундуки входят в одну сервисную зону слева; отдельного рыболовного\n            помещения больше нет.",
  "Под Оружейником больше нет пустого пространства: x14–27, y21–26\n            заполнены естественным песком. Сервисная зона начинается под хабом на\n            x28 и заканчивается у центральной шахты.",
  "HTML intro",
);
html = replaceRequired(
  html,
  "Люк x49–50 открывается прямо в шахту x49–54. Через боковую дверь x48\n          можно выйти к сундукам и бассейну 20×16. Справа больше нет второй шахты\n          и отдельной сервисной площадки.",
  "Под левым NPC-домом находится сплошной Sand Block, а не комната.\n          Рабочее пространство начинается с BAIT/CATCH над бассейном x28–47. Люк\n          x49–50 по-прежнему открывается прямо в центральную шахту x49–54.",
  "HTML note",
);
html = replaceRequired(
  html,
  "<span>Бассейн и сундуки входят в одну сервисную зону</span>",
  "<span>Под Оружейником естественный песок; пустой комнаты нет</span>",
  "HTML legend",
);
write("desert.html", html);

let docs = read("docs/desert-outpost.md");
docs = docs.replace(/## Геометрия v6[\s\S]*?\n## Данные/, [
  "## Геометрия v7",
  "",
  "- под комнатой Оружейника нет отдельного помещения: `x14…27, y21…26` заполнены естественным Sand Block;",
  "- сервисная и рыболовная зона занимает только `x28…47, y21…26`;",
  "- безопасная фоновая стена поставлена только в используемой сервисной зоне;",
  "- BAIT, CATCH и DESERT остаются над бассейном и не требуют дополнительной комнаты слева;",
  "- бассейн сохраняет размер `20×16 = 320` на `x28…47, y28…43`;",
  "- люк `x49…50, y20` ведёт в центральную шахту `x49…54`;",
  "- платформы шахты: `y27 / y34 / y41 / y48 / y55 / y62 / y69`;",
  "- правая стена шахты находится на `x55`, естественный песок начинается с `x56`.",
  "",
  "## Данные",
].join("\n"));
docs = docs.replace(
  "Проверка фиксирует шесть функциональных модулей, отсутствие отдельного рыболовного зала, шахту непосредственно под люком, бассейн 20×16 и платформы y27/34/41/48/55/62/69.",
  "Проверка фиксирует отсутствие пустой комнаты под Оружейником, естественный песок x14–27, сервисную зону x28–47, бассейн 20×16 и центральную шахту под люком.",
);
write("docs/desert-outpost.md", docs);

let tables = read("js/runtime/tables-desert.js");
tables = replaceRequired(
  tables,
  '    ["good", `нижняя комната: ${v.lowerRoomInterior}`],',
  '    ["good", `сервисная зона: ${v.lowerRoomInterior}`],\n    ["good", `под Оружейником пусто: ${v.emptyUnderArms ? "да" : "нет"}`],',
  "status badge",
);
write("js/runtime/tables-desert.js", tables);

let check = read("tools/check-desert.cjs");
check = replaceRequired(
  check,
  '  assert(serviceWall && serviceWall.x1 === 14 && serviceWall.x2 === 47 && serviceWall.y1 === 21 && serviceWall.y2 === 26, "Service wall mismatch");',
  '  assert(serviceWall && serviceWall.x1 === 28 && serviceWall.x2 === 47 && serviceWall.y1 === 21 && serviceWall.y2 === 26, "Service wall mismatch");\n  const serviceRoom = D.rooms.find((room) => room.id === "desert_service");\n  assert(serviceRoom && serviceRoom.x1 === 28 && serviceRoom.x2 === 47, "Service room must start at x28");\n  const armsSupport = D.solids.find((solid) => solid.name === "Естественный грунт под левым крылом");\n  assert(armsSupport && armsSupport.x1 === 14 && armsSupport.x2 === 27 && armsSupport.y1 === 21 && armsSupport.y2 === 26 && armsSupport.mat === "sand", "Natural sand support under Arms Dealer is missing");\n  assert(D.validation.emptyUnderArms === false, "Under-Arms empty-space snapshot must be false");\n  assert(D.validation.naturalSupportTiles === 84, "Natural support must contain 84 tiles");\n  assert(D.validation.lowerRoomInterior === "20×6", "Service-zone size snapshot mismatch");',
  "check service geometry",
);
check = replaceRequired(
  check,
  '  assert(html.includes(">Бассейн</button"), "Pool navigation button is missing");',
  '  assert(html.includes(">Бассейн</button"), "Pool navigation button is missing");\n  assert(html.includes("Под Оружейником больше нет пустого пространства"), "HTML must explain the filled area under Arms Dealer");',
  "check HTML text",
);
write("tools/check-desert.cjs", check);

console.log("Applied natural sand support under the Arms Dealer room.");
