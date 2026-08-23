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
const solids = evaluate("js/data/desert/solids.js", ["DESERT_SOLIDS"]).DESERT_SOLIDS;
const backgrounds = evaluate("js/data/desert/backgrounds.js", [
  "DESERT_BACKGROUNDS",
]).DESERT_BACKGROUNDS;
const objects = evaluate("js/data/desert/objects.js", ["DESERT_OBJECTS"]).DESERT_OBJECTS;

const hatch = objects.find((object) => object.id === "D_HATCH");
if (!hatch) throw new Error("D_HATCH is missing");
hatch.y = 21;
hatch.room = "desert_shaft";
hatch.desc =
  "Люк опущен на один тайл под пол. На старом месте x49–50, y20 стоит Palm Wood Platform; сам люк x49–50, y21 удерживается твёрдыми блоками x48 и x51.";

const nextSolids = solids.filter(
  (solid) => !solid.hatchPlatform && !solid.generatedHatchSupport,
);

const leftSupport = nextSolids.find(
  (solid) => solid.x1 <= 48 && solid.x2 >= 48 && solid.y1 <= 21 && solid.y2 >= 21,
);
if (!leftSupport) throw new Error("Left hatch support at x48 y21 is missing");
leftSupport.hatchSupport = true;

nextSolids.push(
  {
    x1: 49,
    y1: 20,
    x2: 50,
    y2: 20,
    mat: "palm_platform",
    name: "Платформа над опущенным люком",
    desc: "Palm Wood Platform занимает прежнее место люка в линии пола y20. Сам Trap Door расположен на один тайл ниже.",
    hatchPlatform: true,
  },
  {
    x1: 51,
    y1: 21,
    x2: 51,
    y2: 21,
    mat: "sandstone_block_plain",
    name: "Правая опора люка",
    desc: "Твёрдый Sandstone Block справа от люка x49–50, y21. Вместе с блоком x48 он даёт люку две реальные боковые опоры.",
    hatchSupport: true,
    generatedHatchSupport: true,
  },
);

const nextBackgrounds = backgrounds.filter((background) => !background.doorBackground);
const doorWalls = [
  {
    doorId: "D_OUTER_L",
    x1: 18,
    y1: 17,
    x2: 18,
    y2: 19,
    mat: "sandstone_wall_plain",
    name: "Фоновая стена левой наружной двери",
    desc: "Безопасная Sandstone Wall находится непосредственно за дверью.",
  },
  {
    doorId: "D_INNER_L",
    x1: 28,
    y1: 17,
    x2: 28,
    y2: 19,
    mat: "palm_wall",
    name: "Фоновая стена левой внутренней двери",
    desc: "Palm Wood Wall продолжает фон центрального хаба под дверью.",
  },
  {
    doorId: "D_INNER_R",
    x1: 54,
    y1: 17,
    x2: 54,
    y2: 19,
    mat: "palm_wall",
    name: "Фоновая стена правой внутренней двери",
    desc: "Palm Wood Wall продолжает фон центрального хаба под дверью.",
  },
  {
    doorId: "D_OUTER_R",
    x1: 64,
    y1: 17,
    x2: 64,
    y2: 19,
    mat: "sandstone_wall_plain",
    name: "Фоновая стена правой наружной двери",
    desc: "Безопасная Sandstone Wall находится непосредственно за дверью.",
  },
  {
    doorId: "DESERT_ACCESS_INNER",
    x1: 48,
    y1: 24,
    x2: 48,
    y2: 26,
    mat: "sandstone_wall_plain",
    name: "Фоновая стена двери центральной шахты",
    desc: "Безопасная Sandstone Wall закрывает все три тайла боковой двери шахты.",
  },
].map((background) => ({ ...background, doorBackground: true }));
nextBackgrounds.push(...doorWalls);

Object.assign(layout.DESERT_VALIDATION, {
  doorsWithWall: 5,
  doorWallTiles: 15,
  hatch: { x: 49, y: 21, w: 2 },
  hatchPlatformY: 20,
  hatchPlatformMaterial: "palm_platform",
  hatchSupportX: [48, 51],
  hatchShiftedBelowFloor: true,
});
layout.DESERT_NOTES = [
  "Сцена универсальна и не привязана к расположению конкретных мировых структур.",
  "За каждой из пяти дверей находится безопасная фоновая стена на всех трёх тайлах дверного проёма.",
  "На x49–50, y20 находится Palm Wood Platform; люк перенесён на x49–50, y21.",
  "Люк удерживается твёрдыми боковыми блоками x48 и x51 на уровне y21.",
  "Под Оружейником нет пустой комнаты: x14–27, y21–26 заполнены естественным Sand Block.",
  "Бассейн 20×16 сохраняет координаты x28–47, y28–43 и 320 тайлов воды.",
  "Платформы центральной шахты расположены на y27/34/41/48/55/62/69 с постоянным шагом 7.",
];

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
  "// Safe player-placed walls for rooms, every door opening and the central shaft.\n" +
    "const DESERT_BACKGROUNDS = " + JSON.stringify(nextBackgrounds, null, 2) + ";",
);
write(
  "js/data/desert/objects.js",
  "// Furniture, NPCs, local storage, pylon, water and landscape accents.\n" +
    "const DESERT_OBJECTS = " + JSON.stringify(objects, null, 2) + ";",
);

let engineering = read("js/data/desert/engineering.js");
engineering = engineering.replace(/v7/g, "v8");
write("js/data/desert/engineering.js", engineering);

let html = read("desert.html");
html = html.replace(/Пустынный аванпост v\d+/, "Пустынный аванпост v8");
html = html.replace(
  /<div class="sub" id="idesc">[\s\S]*?<\/div>/,
  `<div class="sub" id="idesc">\n            За каждой дверью теперь есть безопасная фоновая стена. В линии пола\n            y20 над шахтой стоит Palm Wood Platform, а сам люк опущен на y21 и\n            удерживается твёрдыми блоками с обеих сторон.\n          </div>`,
);
html = html.replace(
  /<div class="note">[\s\S]*?<\/div>/,
  `<div class="note">\n          Дверные проёмы x18, x28, x54, x64 и x48 полностью закрыты фоновыми\n          стенами. Люк занимает x49–50, y21; над ним на x49–50, y20 находится\n          платформа, а опорные блоки расположены на x48 и x51, y21.\n        </div>`,
);
html = html.replace(
  /<span>Под Оружейником естественный песок; пустой комнаты нет<\/span>/,
  `<span>За всеми дверями есть стены; люк опущен под платформу</span>`,
);
write("desert.html", html);

let docs = read("docs/desert-outpost.md");
docs = docs.replace(/## Геометрия v\d+[\s\S]*?\n## Данные/, [
  "## Геометрия v8",
  "",
  "- за всеми пятью дверями есть безопасные фоновые стены на каждом тайле проёма;",
  "- наружные двери используют Sandstone Wall, внутренние двери хаба — Palm Wood Wall;",
  "- боковая дверь шахты `x48, y24…26` имеет Sandstone Wall;",
  "- на прежнем месте люка `x49…50, y20` находится Palm Wood Platform;",
  "- сам Trap Door опущен на `x49…50, y21`;",
  "- люк имеет твёрдые боковые опоры `x48, y21` и `x51, y21`;",
  "- центральная шахта остаётся на `x49…54`, платформы — `y27/34/41/48/55/62/69`;",
  "- бассейн остаётся `20×16 = 320` на `x28…47, y28…43`;",
  "- под Оружейником остаётся естественный Sand Block, пустой комнаты нет.",
  "",
  "## Данные",
].join("\n"));
write("docs/desert-outpost.md", docs);

let tables = read("js/runtime/tables-desert.js");
tables = replaceRequired(
  tables,
  '    ["good", `дверей к спуску: ${v.accessDoors}`],',
  '    ["good", `дверей к спуску: ${v.accessDoors}`],\n    ["good", `двери со стеной: ${v.doorsWithWall}/${v.totalDoors}`],\n    ["good", `люк: platform y${v.hatchPlatformY} / hatch y${v.hatch.y}`],',
  "status badges",
);
write("js/runtime/tables-desert.js", tables);

let check = read("tools/check-desert.cjs");
check = replaceRequired(
  check,
  '  assert(D.objects.filter((object) => object.kind === "door").length === 5, "Expected five doors");',
  `  assert(D.objects.filter((object) => object.kind === "door").length === 5, "Expected five doors");\n  const backgroundAt = (x, y) => [...D.backgrounds].reverse().find((background) => x >= background.x1 && x <= background.x2 && y >= background.y1 && y <= background.y2);\n  const doors = D.objects.filter((object) => object.kind === "door");\n  let coveredDoorTiles = 0;\n  for (const door of doors) {\n    for (let y = door.y; y < door.y + door.h; y++) {\n      const wall = backgroundAt(door.x, y);\n      assert(Boolean(wall), "Missing background wall behind " + door.id + " at y" + y);\n      if (wall) coveredDoorTiles += 1;\n    }\n  }\n  assert(coveredDoorTiles === 15, "All 15 door tiles must have background walls");\n  assert(D.validation.doorsWithWall === 5 && D.validation.doorWallTiles === 15, "Door-wall validation snapshot mismatch");`,
  "door assertions",
);
check = replaceRequired(
  check,
  '  const hatch = D.objects.find((object) => object.id === "D_HATCH");\n  assert(hatch && hatch.x === 49 && hatch.w === 2 && hatch.y === 20, "Hatch coordinates changed unexpectedly");',
  `  const hatch = D.objects.find((object) => object.id === "D_HATCH");\n  assert(hatch && hatch.x === 49 && hatch.w === 2 && hatch.y === 21, "Hatch must be x49–50 y21");\n  const hatchPlatform = D.solids.find((solid) => solid.hatchPlatform);\n  assert(hatchPlatform && hatchPlatform.x1 === 49 && hatchPlatform.x2 === 50 && hatchPlatform.y1 === 20 && hatchPlatform.y2 === 20 && hatchPlatform.mat === "palm_platform", "Palm platform must replace the old hatch position");\n  const solidAt = (x, y) => D.solids.find((solid) => x >= solid.x1 && x <= solid.x2 && y >= solid.y1 && y <= solid.y2);\n  assert(Boolean(solidAt(48, 21)), "Left solid hatch support x48 y21 is missing");\n  assert(Boolean(solidAt(51, 21)), "Right solid hatch support x51 y21 is missing");\n  assert(D.validation.hatchShiftedBelowFloor === true && D.validation.hatchPlatformY === 20, "Hatch validation snapshot mismatch");`,
  "hatch assertions",
);
check = replaceRequired(
  check,
  '  assert(html.includes("Под Оружейником больше нет пустого пространства"), "HTML must explain the filled area under Arms Dealer");',
  '  assert(html.includes("За каждой дверью теперь есть безопасная фоновая стена"), "HTML must explain door walls");\n  assert(html.includes("сам люк опущен на y21"), "HTML must explain the shifted hatch");',
  "HTML assertions",
);
write("tools/check-desert.cjs", check);

console.log("Applied door-wall and shifted-hatch corrections.");
