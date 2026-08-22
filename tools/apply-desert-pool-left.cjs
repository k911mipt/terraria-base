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
  if (!source.includes(from)) {
    throw new Error(`Missing replacement target: ${label}`);
  }
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

// Move the 20×16 pool six tiles left, delete the empty left niche and move
// every lower-level element on its right directly behind the pool.
const nextSolids = [];
for (const solid of solids) {
  if (solid.name === "Правая масса пустыни") {
    nextSolids.push(
      {
        ...solid,
        x1: 69,
        y1: 23,
        x2: 79,
        y2: 26,
        name: "Правый верхний грунт",
        desc: "Естественный песок под поверхностным подходом и правым краем павильона.",
      },
      {
        ...solid,
        x1: 63,
        y1: 27,
        x2: 79,
        y2: 70,
        name: "Правая масса пустыни",
        desc: "Естественный грунт начинается сразу за сдвинутой стеной прямого спуска на x63.",
      },
    );
    continue;
  }

  if (solid.name === "Левая стена рыболовного зала") {
    nextSolids.push(
      {
        ...solid,
        y2: 34,
        name: "Верх левой стены рыболовного зала",
        desc: "Песчаниковая часть стены заканчивается на уровне мостика y34.",
      },
      {
        ...solid,
        y1: 35,
        y2: 50,
        mat: "glass",
        name: "Левая стеклянная стенка резервуара",
        desc: "Бассейн начинается сразу за внешней стеной зала; отдельной пустой ниши слева больше нет.",
      },
    );
    continue;
  }

  if (
    solid.name === "Левая сервисная площадка" ||
    solid.name === "Левая стеклянная стенка резервуара"
  ) {
    continue;
  }

  const next = { ...solid };
  switch (solid.name) {
    case "Правая часть потолка рыболовного зала":
      next.x2 = 54;
      next.desc = "Короткий потолок заканчивается у сдвинутой двери прямого спуска.";
      break;
    case "Верх общей стены зала и шахты":
      next.x1 = 54;
      next.x2 = 54;
      next.desc = "Проём y31–33 оставлен под дверь прямого спуска на x54.";
      break;
    case "Общая стена рыболовного зала и прямой шахты":
      next.x1 = 54;
      next.x2 = 54;
      next.desc = "Стена следует сразу за правой сервисной площадкой и продолжается вдоль шахты.";
      break;
    case "Дно рыболовного зала":
      next.x2 = 54;
      next.desc = "Сплошное дно под бассейном 20×16 и правой сервисной площадкой.";
      break;
    case "Правая сервисная площадка":
      next.x1 = 48;
      next.x2 = 53;
      next.desc = "Шесть тайлов твёрдого пола сразу после бассейна; здесь стоит локальный пустынный склад.";
      break;
    case "Правая стеклянная стенка резервуара":
      next.x1 = 48;
      next.x2 = 48;
      next.desc = "Правая стеклянная стенка теперь находится сразу после воды x28–47.";
      break;
    case "Левый рыболовный мостик":
      next.x1 = 28;
      next.x2 = 35;
      next.desc = "Восемь Palm Wood Platform над левой половиной воды; проём начинается с x36.";
      break;
    case "Правый рыболовный мостик":
      next.x1 = 40;
      next.x2 = 47;
      next.desc = "Восемь платформ над правой половиной воды; проём x36–39 остаётся свободным.";
      break;
    case "Крыша прямого спуска":
      next.x1 = 55;
      next.x2 = 62;
      next.desc = "Шахта начинается сразу за сдвинутой стеной рыболовного зала.";
      break;
    case "Правая стена прямого спуска":
      next.x1 = 62;
      next.x2 = 62;
      next.desc = "Непрерывная стена; естественный песок начинается сразу за ней на x63.";
      break;
  }
  if (solid.platformGroup === "descent") {
    next.x1 = 55;
    next.x2 = 61;
  }
  nextSolids.push(next);
}

const nextBackgrounds = backgrounds
  .filter((background) => background.name !== "Фон левой сервисной ниши")
  .map((background) => {
    const next = { ...background };
    switch (background.name) {
      case "Фон компактной сервисной галереи":
        next.x2 = 53;
        next.desc = "Светлый безопасный фон от левой стены до двери прямого спуска.";
        break;
      case "Фон правой сервисной ниши":
        next.x1 = 49;
        next.x2 = 53;
        next.desc = "Безопасная стена за единственной сервисной нишей после бассейна.";
        break;
      case "Прозрачный фон резервуара":
        next.x1 = 28;
        next.x2 = 47;
        next.desc = "Glass Wall следует за сдвинутым бассейном 20×16 без пустой ниши слева.";
        break;
      case "Фон прямого спуска":
        next.x1 = 55;
        next.x2 = 61;
        next.desc = "Безопасная стена блокирует спавн внутри сдвинутой вертикальной шахты.";
        break;
    }
    return next;
  });

const nextObjects = objects.map((object) => {
  const next = { ...object };
  switch (object.id) {
    case "DESERT_WATER":
      next.x = 28;
      next.desc = "320 тайлов воды: 20×16. Бассейн прижат к левой стене зала, поэтому пустого кармана перед ним больше нет.";
      next.foregroundNote = "Искусственный водоём x28–47 внутри существующего пустынного биома.";
      break;
    case "DESERT_LOOT":
      next.x = 50;
      next.desc = "Сундук стоит на шеститайловой площадке сразу после правой стенки бассейна.";
      break;
    case "DESERT_SERVICE_LIGHT_R":
      next.x = 50;
      next.desc = "Свет над сдвинутой правой сервисной площадкой и локальным складом.";
      break;
    case "DESERT_ACCESS_INNER":
      next.x = 54;
      next.desc = "За дверью на x54 сразу находится верхняя платформа прямого спуска; бокового коридора нет.";
      break;
    case "DESERT_ACCESS_LIGHT":
      next.x = 58;
      break;
    case "DESERT_ACCESS_LIGHT_1":
    case "DESERT_ACCESS_LIGHT_2":
    case "DESERT_ACCESS_LIGHT_3":
    case "DESERT_ACCESS_LIGHT_4":
    case "DESERT_ACCESS_LIGHT_5":
      next.x = 61;
      break;
  }
  return next;
});

const roomById = new Map(layout.DESERT_ROOMS.map((room) => [room.id, { ...room }]));
Object.assign(roomById.get("desert_service"), {
  x2: 54,
  desc: "Галерея шириной 28 тайлов: два рыболовных сундука стоят над левой частью воды, а склад и дверь спуска следуют сразу после бассейна.",
});
Object.assign(roomById.get("desert_fishing"), {
  x2: 54,
  desc: "Камера без левой пустой ниши: вода 20×16 занимает x28–47 сразу за внешней стеной, затем идут сервисная площадка и прямой спуск.",
});
Object.assign(roomById.get("desert_access"), {
  x1: 54,
  x2: 62,
  desc: "Одна дверь на x54 открывается прямо на безопасную шахту x55–61. Площадки остаются на y34/41/48/55/62/69.",
});
layout.DESERT_ROOMS = [...roomById.values()];
Object.assign(layout.DESERT_VALIDATION, {
  fishingHall: "28×25",
  leftPoolGap: 0,
  poolX: [28, 47],
  accessX: [54, 62],
});
layout.DESERT_NOTES = [
  "Сцена проектирует универсальный пустынный аванпост и не привязана к расположению конкретных мировых структур.",
  "Павильон сохраняет ширину 55 тайлов; нижний рыболовный модуль дополнительно сжат справа и слева.",
  "Под NPC-комнатами и центральным хабом нет пустых полостей: фундамент заполнен Sandstone Block, кроме безопасной сервисной шахты.",
  "Сервисный спуск использует уровни y20, y27 и y34, поэтому каждый вертикальный шаг равен семи тайлам.",
  "Бассейн 20×16 занимает x28–47 и начинается сразу за левой стеной зала: зазора и пустой ниши слева нет.",
  "Четырёхтайловый проём x36–39 оставляет по восемь Palm Wood Platform с каждой стороны.",
  "Сразу после бассейна находятся шеститайловая сервисная площадка, одна дверь и прямой спуск x55–61.",
];

write(
  "js/data/desert/layout.js",
  `// Desert outpost bounds, rooms and design metadata.\nconst DESERT_BOUNDS = ${JSON.stringify(layout.DESERT_BOUNDS, null, 2)};\n\nconst DESERT_ROOMS = ${JSON.stringify(layout.DESERT_ROOMS, null, 2)};\n\nconst DESERT_RESERVES = ${JSON.stringify(layout.DESERT_RESERVES, null, 2)};\n\nconst DESERT_VALIDATION = ${JSON.stringify(layout.DESERT_VALIDATION, null, 2)};\n\nconst DESERT_NOTES = ${JSON.stringify(layout.DESERT_NOTES, null, 2)};\n\nconst DESERT_TITLE = ${JSON.stringify(layout.DESERT_TITLE)};`,
);
write(
  "js/data/desert/solids.js",
  `// Foreground blocks and platforms for the compact desert outpost.\nconst DESERT_SOLIDS = ${JSON.stringify(nextSolids, null, 2)};`,
);
write(
  "js/data/desert/backgrounds.js",
  `// Safe player-placed walls for housing, service spaces, fishing and both shafts.\nconst DESERT_BACKGROUNDS = ${JSON.stringify(nextBackgrounds, null, 2)};`,
);
write(
  "js/data/desert/objects.js",
  `// Furniture, NPCs, local storage, pylon, water and landscape accents.\nconst DESERT_OBJECTS = ${JSON.stringify(nextObjects, null, 2)};`,
);

let engineering = read("js/data/desert/engineering.js");
engineering = replaceRequired(engineering, "Desert v3", "Desert v4", "engineering comment");
engineering = replaceRequired(
  engineering,
  "Компактный пустынный аванпост v3",
  "Компактный пустынный аванпост v4",
  "engineering stage",
);
write("js/data/desert/engineering.js", engineering);

let interactions = read("js/runtime/interactions-desert.js");
interactions = replaceRequired(
  interactions,
  'document.getElementById("craft").onclick = () => focusRect(25, 25, 62, 36, 2);',
  'document.getElementById("craft").onclick = () => focusRect(25, 25, 56, 36, 2);',
  "service focus",
);
interactions = replaceRequired(
  interactions,
  'document.getElementById("arena").onclick = () => focusRect(25, 25, 62, 53, 2);',
  'document.getElementById("arena").onclick = () => focusRect(25, 25, 56, 53, 2);',
  "fishing focus",
);
interactions = replaceRequired(
  interactions,
  'document.getElementById("pitsBtn").onclick = () => focusRect(57, 25, 70, 71, 2);',
  'document.getElementById("pitsBtn").onclick = () => focusRect(51, 25, 64, 71, 2);',
  "descent focus",
);
write("js/runtime/interactions-desert.js", interactions);

let tables = read("js/runtime/tables-desert.js");
tables = replaceRequired(
  tables,
  '    ["good", `проём заброса: ${v.fishingOpeningWidth}`],',
  '    ["good", `проём заброса: ${v.fishingOpeningWidth}`],\n    ["good", `зазор слева: ${v.leftPoolGap}`],',
  "left-gap badge",
);
write("js/runtime/tables-desert.js", tables);

let html = read("desert.html");
html = replaceRequired(html, "Пустынный аванпост v3", "Пустынный аванпост v4", "HTML version");
html = replaceRequired(
  html,
  "Павильон сжат до 55 тайлов, рыболовный зал — до 34. Под ним находится\n            бассейн 20×16 на 320 тайлов воды, а справа сохраняется прямой спуск с\n            платформами через 7 тайлов.",
  "Павильон сохраняет ширину 55 тайлов, а рыболовный зал сжат до 28.\n            Бассейн 20×16 прижат к левой стене; сразу после него расположены\n            сервисная площадка и прямой спуск с платформами через 7 тайлов.",
  "HTML inspector description",
);
html = replaceRequired(
  html,
  "Бассейн повторяет удобную компактную пропорцию 20×16. По обе стороны\n          центрального четырёхтайлового проёма остаётся по восемь Palm Wood\n          Platform. Под жилыми комнатами нет пустых карманов, а одна дверь справа\n          по-прежнему открывается сразу в вертикальную шахту.",
  "Бассейн 20×16 начинается сразу за левой стеной зала — пустого кармана\n          перед водой больше нет. Проём x36–39 оставляет по восемь Palm Wood\n          Platform с каждой стороны. Всё, что было справа от бассейна, сдвинуто\n          следом за ним: склад, дверь и вертикальная шахта.",
  "HTML note",
);
write("desert.html", html);

let docs = read("docs/desert-outpost.md");
docs = docs.replace(
  /## Геометрия v3[\s\S]*?\n## Данные/,
  `## Геометрия v4\n\n- поверхностный павильон сохраняет ширину 55 тайлов;\n- под жилыми комнатами и хабом расположен сплошной Sandstone-фундамент;\n- единственная пустота в фундаменте — безопасная сервисная шахта;\n- уровни сервисного спуска: \`y20 → y27 → y34\`, шаг ровно 7 тайлов;\n- рыболовный зал занимает \`x27…54\`, то есть 28 тайлов;\n- левая пустая ниша полностью удалена;\n- вода занимает \`x28…47, y35…50\`: ровно \`20×16 = 320\` тайлов;\n- четырёхтайловый проём для заброса расположен на \`x36…39\`;\n- по обе стороны проёма остаётся по восемь Palm Wood Platform;\n- сразу после бассейна находятся стеклянная стенка и сервисная площадка \`x48…53\`;\n- одна дверь на \`x54, y31…33\` открывается прямо на шахту \`x55…61\`;\n- площадки прямого спуска: \`y34 / y41 / y48 / y55 / y62 / y69\`;\n- безопасная фоновая стена закрывает всю показанную шахту.\n\n## Данные`,
);
write("docs/desert-outpost.md", docs);

let check = read("tools/check-desert.cjs");
const replacements = [
  ["fishingHall?.x1 === 27 && fishingHall?.x2 === 60", "fishingHall?.x1 === 27 && fishingHall?.x2 === 54", "hall bounds"],
  ["Fishing hall must span x27–60", "Fishing hall must span x27–54", "hall message"],
  ["=== 34, \"Fishing hall must be 34 tiles wide\"", "=== 28, \"Fishing hall must be 28 tiles wide\"", "hall width"],
  ["water?.x === 34 && water?.y === 35", "water?.x === 28 && water?.y === 35", "water start"],
  ["fishingDeck[0]?.x1 === 34 &&\n    fishingDeck[0]?.x2 === 41 &&\n    fishingDeck[1]?.x1 === 46 &&\n    fishingDeck[1]?.x2 === 53", "fishingDeck[0]?.x1 === 28 &&\n    fishingDeck[0]?.x2 === 35 &&\n    fishingDeck[1]?.x1 === 40 &&\n    fishingDeck[1]?.x2 === 47", "deck geometry"],
  ["solid.x1 === 61 && solid.x2 === 67", "solid.x1 === 55 && solid.x2 === 61", "descent platforms"],
  ["accessRoom?.x1 === 60 && accessRoom?.x2 === 68", "accessRoom?.x1 === 54 && accessRoom?.x2 === 62", "access room"],
  ["accessDoor?.x === 60 && accessDoor?.y === 31", "accessDoor?.x === 54 && accessDoor?.y === 31", "access door"],
  ["shaftWall?.x1 === 61 &&\n    shaftWall?.x2 === 67", "shaftWall?.x1 === 55 &&\n    shaftWall?.x2 === 61", "shaft wall"],
];
for (const [from, to, label] of replacements) {
  check = replaceRequired(check, from, to, label);
}
check = replaceRequired(
  check,
  'assert(D.validation.fishingWaterTiles === 320, "Validation water snapshot must be 320");',
  'assert(D.validation.fishingWaterTiles === 320, "Validation water snapshot must be 320");\nassert(D.validation.leftPoolGap === 0, "Pool must have no left-side gap");\nassert(JSON.stringify(D.validation.poolX) === JSON.stringify([28, 47]), "Pool X snapshot mismatch");\nassert(!D.backgrounds.some((background) => background.name === "Фон левой сервисной ниши"), "Legacy left service niche must stay removed");',
  "pool-gap assertions",
);
write("tools/check-desert.cjs", check);

console.log("Applied desert pool-left compaction.");
