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

const replacedSolidNames = new Set([
  "Правый верхний грунт",
  "Левая часть потолка рыболовного зала",
  "Правая часть потолка рыболовного зала",
  "Верх левой стены рыболовного зала",
  "Левая стеклянная стенка резервуара",
  "Верх общей стены зала и шахты",
  "Общая стена рыболовного зала и прямой шахты",
  "Дно рыболовного зала",
  "Правая сервисная площадка",
  "Правая стеклянная стенка резервуара",
  "Левый рыболовный мостик",
  "Правый рыболовный мостик",
  "Крыша прямого спуска",
  "Правая стена прямого спуска",
]);

const nextSolids = solids
  .filter(
    (solid) =>
      !solid.foundation &&
      solid.platformGroup !== "central" &&
      solid.platformGroup !== "descent" &&
      !replacedSolidNames.has(solid.name),
  )
  .map((solid) => {
    if (solid.name !== "Правая масса пустыни") return solid;
    return {
      ...solid,
      y1: 21,
      name: "Правая естественная масса пустыни",
      desc: "Естественный Sand Block начинается сразу за правой стеной прямой шахты; отдельного пустого кармана под павильоном нет.",
    };
  });

nextSolids.push(
  {
    x1: 27,
    y1: 27,
    x2: 27,
    y2: 27,
    mat: "sandstone_block_plain",
    name: "Левый бортик рыболовного этажа",
    desc: "Один Sandstone Block соединяет естественный грунт с первым участком Palm Wood Platform.",
  },
  {
    x1: 27,
    y1: 28,
    x2: 27,
    y2: 43,
    mat: "glass",
    name: "Левая стеклянная стенка резервуара",
    desc: "Бассейн 20×16 начинается сразу за этой стенкой на x28; отдельной боковой ниши нет.",
  },
  {
    x1: 28,
    y1: 27,
    x2: 35,
    y2: 27,
    mat: "palm_platform",
    name: "Левый рыболовный мостик",
    desc: "Восемь Palm Wood Platform над левой половиной воды; проём начинается с x36.",
    platformGroup: "fishing_deck",
    platformLevel: 27,
  },
  {
    x1: 40,
    y1: 27,
    x2: 47,
    y2: 27,
    mat: "palm_platform",
    name: "Правый рыболовный мостик",
    desc: "Восемь платформ над правой половиной воды; проём x36–39 остаётся свободным.",
    platformGroup: "fishing_deck",
    platformLevel: 27,
  },
  {
    x1: 48,
    y1: 27,
    x2: 53,
    y2: 27,
    mat: "sandstone_block_plain",
    name: "Правая сервисная площадка",
    desc: "Твёрдый шеститайловый пол сразу после бассейна; здесь стоят локальный склад и выход к шахте.",
  },
  {
    x1: 48,
    y1: 28,
    x2: 48,
    y2: 43,
    mat: "glass",
    name: "Правая стеклянная стенка резервуара",
    desc: "Правый борт бассейна 20×16; сервисная ниша начинается с x49.",
  },
  {
    x1: 27,
    y1: 44,
    x2: 53,
    y2: 44,
    mat: "sandstone_block_plain",
    name: "Дно поднятого рыболовного зала",
    desc: "Одноблочное дно под водой x28–47 и сервисной нишей x49–53.",
  },
  {
    x1: 54,
    y1: 21,
    x2: 54,
    y2: 23,
    mat: "sandstone_block_plain",
    name: "Верх стены у прямого спуска",
    desc: "Проём y24–26 оставлен под единственную дверь вертикальной шахты.",
  },
  {
    x1: 54,
    y1: 27,
    x2: 54,
    y2: 69,
    mat: "sandstone_block_plain",
    name: "Общая стена бассейна и прямого спуска",
    desc: "Ниже двери стена продолжается вдоль бассейна и всей показанной шахты.",
  },
  {
    x1: 62,
    y1: 21,
    x2: 62,
    y2: 69,
    mat: "sandstone_block_plain",
    name: "Правая стена прямого спуска",
    desc: "Естественный песок начинается сразу за стеной на x63.",
  },
);

for (const level of [27, 34, 41, 48, 55, 62, 69]) {
  nextSolids.push({
    x1: 55,
    y1: level,
    x2: 61,
    y2: level,
    mat: "palm_platform",
    name: `Площадка прямого спуска y${level}`,
    desc:
      level === 27
        ? "Верхняя площадка совпадает с новым рыболовным этажом y27."
        : "Площадка прямого спуска с шагом ровно семь тайлов.",
    platformGroup: "descent",
    platformLevel: level,
  });
}

const replacedBackgroundNames = new Set([
  "Фон сервисной шахты",
  "Фон компактной сервисной галереи",
  "Фон правой сервисной ниши",
  "Прозрачный фон резервуара",
  "Фон прямого спуска",
]);
const nextBackgrounds = backgrounds.filter(
  (background) => !replacedBackgroundNames.has(background.name),
);
nextBackgrounds.push(
  {
    x1: 14,
    y1: 21,
    x2: 54,
    y2: 26,
    mat: "sandstone_wall_plain",
    name: "Фон нижней сервисной комнаты",
    desc: "Безопасная поставленная игроком стена превращает пространство под домами в обычную комнату и исключает спавн противников.",
  },
  {
    x1: 48,
    y1: 21,
    x2: 51,
    y2: 26,
    mat: "sandstone_wall_plain",
    name: "Фон сервисной шахты",
    desc: "Безопасная стена за единственным семитайловым спуском от пола y20 к этажу y27.",
  },
  {
    x1: 28,
    y1: 28,
    x2: 47,
    y2: 43,
    mat: "glass_wall",
    name: "Прозрачный фон резервуара",
    desc: "Glass Wall следует за поднятым бассейном 20×16 на y28–43.",
  },
  {
    x1: 49,
    y1: 28,
    x2: 53,
    y2: 43,
    mat: "sandstone_wall_plain",
    name: "Фон правой сервисной ниши",
    desc: "Безопасная стена за единственной нишей после бассейна.",
  },
  {
    x1: 55,
    y1: 21,
    x2: 61,
    y2: 69,
    mat: "sandstone_wall_plain",
    name: "Фон прямого спуска",
    desc: "Безопасная стена закрывает шахту от верхней двери до последней показанной платформы.",
  },
);

const nextObjects = objects.map((object) => {
  const next = { ...object };
  switch (object.id) {
    case "DESERT_BAIT":
    case "DESERT_CATCH":
    case "DESERT_LOOT":
      next.y = 25;
      next.desc = `${object.desc.replace(/\.$/, "")} На поднятом сервисном этаже предмет стоит непосредственно над полом y27.`;
      break;
    case "DESERT_SERVICE_LIGHT_L":
    case "DESERT_SERVICE_LIGHT_R":
      next.y = 21;
      next.desc = "Свет нижней безопасной комнаты между потолком y20 и полом y27.";
      break;
    case "DESERT_WATER":
      next.y = 28;
      next.desc = "320 тайлов воды: 20×16 на y28–43. Рыболовный уровень поднят вплотную под одноблочный пол павильона.";
      next.foregroundNote = "Искусственный водоём x28–47, y28–43 внутри существующего пустынного биома.";
      break;
    case "DESERT_ACCESS_INNER":
      next.y = 24;
      next.desc = "Дверь y24–26 соединяет нижнюю сервисную комнату с верхней платформой прямого спуска y27.";
      break;
    case "DESERT_ACCESS_LIGHT":
      next.y = 21;
      next.desc = "Свет над дверью y24–26 и верхней площадкой y27.";
      break;
    case "DESERT_ACCESS_LIGHT_1":
      next.y = 30;
      next.desc = "Свет между площадками y27 и y34.";
      break;
    case "DESERT_ACCESS_LIGHT_2":
      next.y = 37;
      next.desc = "Свет между площадками y34 и y41.";
      break;
    case "DESERT_ACCESS_LIGHT_3":
      next.y = 44;
      next.desc = "Свет между площадками y41 и y48.";
      break;
    case "DESERT_ACCESS_LIGHT_4":
      next.y = 51;
      next.desc = "Свет между площадками y48 и y55.";
      break;
    case "DESERT_ACCESS_LIGHT_5":
      next.y = 58;
      next.desc = "Свет между площадками y55 и y62.";
      break;
  }
  return next;
});
nextObjects.push({
  id: "DESERT_ACCESS_LIGHT_6",
  name: "Свет прямого спуска 6",
  x: 61,
  y: 65,
  w: 1,
  h: 1,
  kind: "light",
  style: "lantern_warm",
  short: "",
  hideLabel: true,
  room: "desert_access",
  desc: "Свет между площадками y62 и y69.",
});

const roomById = new Map(layout.DESERT_ROOMS.map((room) => [room.id, { ...room }]));
Object.assign(roomById.get("desert_surface"), {
  desc: "Компактный аванпост с двумя NPC-комнатами, Desert Pylon и одноблочным полом y20; под ним находится безопасная сервисная комната, а не массивный фундамент.",
});
Object.assign(roomById.get("desert_shaft"), {
  y2: 27,
  short: "ШАХТА 7",
  desc: "Один семитайловый спуск: верхний пол y20 и полноценный нижний этаж y27. Промежуточная платформа больше не нужна.",
});
Object.assign(roomById.get("desert_service"), {
  x1: 14,
  y1: 20,
  x2: 54,
  y2: 27,
  name: "Нижняя сервисная комната",
  short: "СЕРВИС 6",
  desc: "Шесть тайлов чистой высоты y21–26 под одноблочным полом. Безопасная фоновая стена исключает спавн противников.",
});
Object.assign(roomById.get("desert_fishing"), {
  y1: 27,
  y2: 44,
  name: "Поднятый пустынный рыболовный зал",
  desc: "Мостик находится на y27, вода 20×16 — на y28–43, дно — на y44. Бассейн поднят на семь тайлов без изменения ширины.",
});
Object.assign(roomById.get("desert_access"), {
  y1: 20,
  desc: "Дверь y24–26 открывается на платформу y27; далее площадки идут на y34/41/48/55/62/69 с постоянным шагом 7.",
});
layout.DESERT_ROOMS = [...roomById.values()];
Object.assign(layout.DESERT_VALIDATION, {
  fishingHall: "28×18",
  centralLevels: [20, 27],
  descentPlatforms: [27, 34, 41, 48, 55, 62, 69],
  foundationTiles: 0,
  oneTileFloorY: 20,
  lowerRoomInterior: "41×6",
  lowerRoomWallTiles: 246,
  waterY: [28, 43],
  accessDoorY: [24, 26],
});
layout.DESERT_NOTES = [
  "Сцена универсальна и не привязана к расположению конкретных мировых структур.",
  "Пол поверхностного павильона остаётся одноблочным на y20; шеститайловый заполненный фундамент полностью удалён.",
  "Пространство x14–54, y21–26 стало безопасной нижней сервисной комнатой с поставленной игроком фоновой стеной.",
  "Сервисный спуск теперь использует только уровни y20 и y27 — ровно один шаг в семь тайлов.",
  "Рыболовный мостик поднят на y27, бассейн 20×16 занимает x28–47, y28–43, а дно находится на y44.",
  "Прямой спуск начинается за дверью y24–26; платформы стоят на y27/34/41/48/55/62/69.",
];

write(
  "js/data/desert/layout.js",
  `// Desert outpost bounds, rooms and design metadata.\nconst DESERT_BOUNDS = ${JSON.stringify(layout.DESERT_BOUNDS, null, 2)};\n\nconst DESERT_ROOMS = ${JSON.stringify(layout.DESERT_ROOMS, null, 2)};\n\nconst DESERT_RESERVES = ${JSON.stringify(layout.DESERT_RESERVES, null, 2)};\n\nconst DESERT_VALIDATION = ${JSON.stringify(layout.DESERT_VALIDATION, null, 2)};\n\nconst DESERT_NOTES = ${JSON.stringify(layout.DESERT_NOTES, null, 2)};\n\nconst DESERT_TITLE = ${JSON.stringify(layout.DESERT_TITLE)};`,
);
write(
  "js/data/desert/solids.js",
  `// Foreground blocks and platforms for the one-floor desert outpost.\nconst DESERT_SOLIDS = ${JSON.stringify(nextSolids, null, 2)};`,
);
write(
  "js/data/desert/backgrounds.js",
  `// Safe player-placed walls for housing, the lower service room, fishing and the direct shaft.\nconst DESERT_BACKGROUNDS = ${JSON.stringify(nextBackgrounds, null, 2)};`,
);
write(
  "js/data/desert/objects.js",
  `// Furniture, NPCs, local storage, pylon, water and landscape accents.\nconst DESERT_OBJECTS = ${JSON.stringify(nextObjects, null, 2)};`,
);

let engineering = read("js/data/desert/engineering.js")
  .replace(/Desert v4/g, "Desert v5")
  .replace(/аванпост v4/g, "аванпост v5");
write("js/data/desert/engineering.js", engineering);

write(
  "js/runtime/interactions-desert.js",
  `// Replace only scene-navigation handlers; pointer, wheel, history and search\n// remain provided by the shared interactions.js.\ndocument.getElementById("upper").onclick = () => focusRect(12, 1, 70, 28, 2);\ndocument.getElementById("greenhouse").onclick = () => focusRect(16, 6, 66, 21, 2);\ndocument.getElementById("craft").onclick = () => focusRect(12, 19, 56, 29, 2);\ndocument.getElementById("arena").onclick = () => focusRect(25, 19, 56, 46, 2);\ndocument.getElementById("pitsBtn").onclick = () => focusRect(51, 19, 64, 71, 2);`,
);

let tables = read("js/runtime/tables-desert.js");
tables = tables
  .replace(
    '["good", `фундамент: ${v.foundationTiles} тайлов`],',
    '["good", `фундамент: ${v.foundationTiles}`],\n    ["good", `нижняя комната: ${v.lowerRoomInterior}`],\n    ["good", `одноблочный пол: y${v.oneTileFloorY}`],',
  );
write("js/runtime/tables-desert.js", tables);

let html = read("desert.html");
html = html
  .replace(/Пустынный аванпост v4/g, "Пустынный аванпост v5")
  .replace(
    /Павильон сохраняет ширину 55 тайлов, а рыболовный зал сжат до 28\.\s*Бассейн 20×16 прижат к левой стене; сразу после него расположены\s*сервисная площадка и прямой спуск с платформами через 7 тайлов\./,
    "Павильон сохраняет ширину 55 тайлов и одноблочный пол y20. Вместо\\n            шеститайлового фундамента под ним теперь безопасная сервисная комната,\\n            а мостик и бассейн подняты на уровень y27/y28.",
  )
  .replace(
    /Бассейн 20×16 начинается сразу за левой стеной зала — пустого кармана\s*перед водой больше нет\. Проём x36–39 оставляет по восемь Palm Wood\s*Platform с каждой стороны\. Всё, что было справа от бассейна, сдвинуто\s*следом за ним: склад, дверь и вертикальная шахта\./,
    "Пол павильона — одна полоса блоков на y20. Под ним находится комната\\n          высотой шесть тайлов с безопасной фоновой стеной, поэтому мобы внутри не\\n          спавнятся. Вода занимает x28–47, y28–43; дверь спуска — y24–26, а\\n          платформы шахты идут y27/34/41/48/55/62/69.",
  )
  .replace(
    "Под комнатами сплошной фундамент без зон спавна",
    "Под комнатами безопасная сервисная комната; пол павильона — 1 блок",
  );
write("desert.html", html);

let docs = read("docs/desert-outpost.md");
docs = docs
  .replace(/## Геометрия v4[\s\S]*?\n## Данные/, `## Геометрия v5\n\n- поверхностный павильон сохраняет ширину 55 тайлов;\n- пол павильона — одна полоса Sandstone Block на \`y20\`;\n- шеститайловый заполненный фундамент полностью удалён;\n- пространство \`x14…54, y21…26\` стало безопасной нижней сервисной комнатой;\n- нижняя комната имеет 6 тайлов чистой высоты и поставленную игроком Sandstone Wall;\n- сервисный спуск использует только уровни \`y20 → y27\`, шаг ровно 7 тайлов;\n- рыболовный мостик находится на \`y27\`;\n- вода занимает \`x28…47, y28…43\`: ровно \`20×16 = 320\` тайлов;\n- дно бассейна находится на \`y44\`;\n- проём для заброса остаётся на \`x36…39\`;\n- сервисная площадка после бассейна занимает \`x48…53, y27\`;\n- одна дверь на \`x54, y24…26\` открывается прямо на шахту \`x55…61\`;\n- площадки прямого спуска: \`y27 / y34 / y41 / y48 / y55 / y62 / y69\`;\n- безопасная фоновая стена закрывает нижнюю комнату и всю показанную шахту.\n\n## Данные`)
  .replace(
    "`js/data/desert/solids.js` — павильон, заполненный фундамент, компактный рыболовный зал и платформы шахт;",
    "`js/data/desert/solids.js` — павильон с одноблочным полом, поднятый рыболовный зал и платформы шахт;",
  )
  .replace(
    /Проверка фиксирует[^\n]+/,
    "Проверка фиксирует два NPC, один пилон, пять сундуков, отсутствие фундаментных блоков, безопасную комнату 41×6, бассейн 20×16 на y28–43 и платформы прямой шахты y27/34/41/48/55/62/69.",
  );
write("docs/desert-outpost.md", docs);

const check = `#!/usr/bin/env node
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
  assert(solid.x1 >= D.bounds.xMin && solid.x2 <= D.bounds.xMax && solid.y1 >= D.bounds.yMin && solid.y2 <= D.bounds.yMax, `${solid.name || solid.mat} outside bounds`);
for (const background of D.backgrounds)
  assert(background.x1 >= D.bounds.xMin && background.x2 <= D.bounds.xMax && background.y1 >= D.bounds.yMin && background.y2 <= D.bounds.yMax, `${background.name || background.mat} outside bounds`);
for (const object of D.objects)
  assert(object.x >= D.bounds.xMin && object.x + object.w - 1 <= D.bounds.xMax && object.y >= D.bounds.yMin && object.y + object.h - 1 <= D.bounds.yMax, `${object.id} outside bounds`);

const serialized = JSON.stringify(D).toLowerCase();
assert(!serialized.includes("skeletron") && !serialized.includes("данж"), "World-specific location leaked into scene");
const html = fs.readFileSync(path.join(root, "desert.html"), "utf8");
assert(html.includes("Пустынный аванпост v5"), "HTML version must be v5");
assert(html.includes("одноблочный пол") || html.includes("одна полоса"), "HTML must describe the one-tile floor");

if (errors.length) {
  console.error("DESERT CHECK: FAIL");
  for (const error of errors) console.error(`- ${error}`);
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
`;
write("tools/check-desert.cjs", check);

console.log("Applied one-tile-floor desert redesign.");
