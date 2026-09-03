#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function write(relative, content) {
  fs.writeFileSync(path.join(root, relative), content);
}

function replaceOnce(source, search, replacement, label) {
  const index = source.indexOf(search);
  if (index < 0) throw new Error(`Could not locate ${label}`);
  if (source.indexOf(search, index + search.length) >= 0) {
    throw new Error(`Expected unique match for ${label}`);
  }
  return `${source.slice(0, index)}${replacement}${source.slice(index + search.length)}`;
}

function replaceAllRequired(source, search, replacement, expected, label) {
  const matches = source.split(search).length - 1;
  if (matches !== expected) {
    throw new Error(`Expected ${expected} matches for ${label}, found ${matches}`);
  }
  return source.split(search).join(replacement);
}

// 1. Attach the two side canopies to the y22 roof, remove the solid shrine
// pillars, and hang the lanterns from a raised bamboo beam.
let solids = read("js/data/jungle/solids.js");
for (const [from, to, label] of [
  [
    `    x1: 6,\n    y1: 20,\n    x2: 24,\n    y2: 20,`,
    `    x1: 6,\n    y1: 21,\n    x2: 24,\n    y2: 21,`,
    "left canopy lower row",
  ],
  [
    `    x1: 8,\n    y1: 19,\n    x2: 22,\n    y2: 19,`,
    `    x1: 8,\n    y1: 20,\n    x2: 22,\n    y2: 20,`,
    "left canopy middle row",
  ],
  [
    `    x1: 11,\n    y1: 18,\n    x2: 19,\n    y2: 18,`,
    `    x1: 11,\n    y1: 19,\n    x2: 19,\n    y2: 19,`,
    "left canopy top row",
  ],
  [
    `    x1: 37,\n    y1: 20,\n    x2: 54,\n    y2: 20,`,
    `    x1: 37,\n    y1: 21,\n    x2: 54,\n    y2: 21,`,
    "right canopy lower row",
  ],
  [
    `    x1: 39,\n    y1: 19,\n    x2: 52,\n    y2: 19,`,
    `    x1: 39,\n    y1: 20,\n    x2: 52,\n    y2: 20,`,
    "right canopy middle row",
  ],
  [
    `    x1: 42,\n    y1: 18,\n    x2: 49,\n    y2: 18,`,
    `    x1: 42,\n    y1: 19,\n    x2: 49,\n    y2: 19,`,
    "right canopy top row",
  ],
]) {
  solids = replaceOnce(solids, from, to, label);
}

const leftSolidPillar = `  {\n    x1: 23,\n    y1: 24,\n    x2: 23,\n    y2: 29,\n    mat: "living_mahogany",\n    name: "Левая подвесная стойка святилища",\n    desc: "Живая древесина обрамляет Jungle Pylon, не занимая проход по полу.",\n    hubStyle: true,\n  },\n`;
const rightSolidPillar = `  {\n    x1: 37,\n    y1: 24,\n    x2: 37,\n    y2: 29,\n    mat: "living_mahogany",\n    name: "Правая подвесная стойка святилища",\n    desc: "Зеркальная стойка отделяет пилон от телепортерного резерва.",\n    hubStyle: true,\n  },\n`;
solids = replaceOnce(solids, leftSolidPillar, "", "left solid shrine pillar");
solids = replaceOnce(solids, rightSolidPillar, "", "right solid shrine pillar");

const oldLeftBeam = `  {\n    x1: 24,\n    y1: 24,\n    x2: 30,\n    y2: 24,\n    mat: "bamboo_block",\n    name: "Левая часть бамбуковой перемычки святилища",\n    desc: "Bamboo-перемычка заканчивается перед вертикальным проходом x31–32.",\n    hubStyle: true,\n  },\n`;
const newLeftBeam = `  {\n    x1: 24,\n    y1: 23,\n    x2: 29,\n    y2: 23,\n    mat: "bamboo_block",\n    name: "Левая часть бамбуковой перемычки святилища",\n    desc: "Bamboo-перемычка находится сразу под потолком, поддерживает левый фонарь и заканчивается перед твёрдой опорой люка x30.",\n    hubStyle: true,\n  },\n`;
const oldRightBeam = `  {\n    x1: 33,\n    y1: 24,\n    x2: 36,\n    y2: 24,\n    mat: "bamboo_block",\n    name: "Правая часть бамбуковой перемычки святилища",\n    desc: "Вторая часть перемычки начинается после прохода в студию Маляра.",\n    hubStyle: true,\n  },\n`;
const newRightBeam = `  {\n    x1: 34,\n    y1: 23,\n    x2: 36,\n    y2: 23,\n    mat: "bamboo_block",\n    name: "Правая часть бамбуковой перемычки святилища",\n    desc: "Вторая часть перемычки начинается после твёрдой опоры люка x33 и поддерживает правый фонарь.",\n    hubStyle: true,\n  },\n`;
solids = replaceOnce(solids, oldLeftBeam, newLeftBeam, "left bamboo shrine beam");
solids = replaceOnce(solids, oldRightBeam, newRightBeam, "right bamboo shrine beam");
write("js/data/jungle/solids.js", solids);

// 2. Replace the removed solid pillars with visibly distinct, safe and fully
// passable background strips.
let backgrounds = read("js/data/jungle/backgrounds.js");
const witchBackgroundMarker = `  {\n    x1: 40,\n    y1: 23,\n    x2: 51,\n    y2: 33,\n    mat: "bamboo_wall",`;
const pillarBackgrounds = `  {\n    x1: 23,\n    y1: 24,\n    x2: 23,\n    y2: 29,\n    mat: "living_wood_wall",\n    name: "Левая проходимая колонна святилища",\n    desc: "Поставленная игроком Living Wood Wall создаёт органическую колонну в фоне и не блокирует движение.",\n    passablePillar: true,\n  },\n  {\n    x1: 37,\n    y1: 24,\n    x2: 37,\n    y2: 29,\n    mat: "living_wood_wall",\n    name: "Правая проходимая колонна святилища",\n    desc: "Зеркальная фоновая Living Wood Wall отделяет нишу телепортера только визуально.",\n    passablePillar: true,\n  },\n`;
backgrounds = replaceOnce(
  backgrounds,
  witchBackgroundMarker,
  `${pillarBackgrounds}${witchBackgroundMarker}`,
  "Witch Doctor background insertion point",
);
write("js/data/jungle/backgrounds.js", backgrounds);

// 3. Add the real Terraria wall material and describe the changed role of
// Living Mahogany blocks.
let materials = read("js/data/jungle/materials.js");
materials = replaceOnce(
  materials,
  `  rich_mahogany_wall: ["#5d3826", "#815139"],\n`,
  `  rich_mahogany_wall: ["#5d3826", "#815139"],\n  living_wood_wall: ["#443426", "#765b3e"],\n`,
  "Living Wood Wall palette insertion",
);
materials = replaceOnce(
  materials,
  `    note: "Стены, подвесные стойки и четыре живых корня.",`,
  `    note: "Наружные стены, перегородки и четыре живых корня; внутренние колонны святилища теперь находятся в фоновом слое.",`,
  "Living Mahogany material note",
);
const wallSpecMarker = `  jungle_leaf_wall: {\n    layer: "Фоновая стена",`;
const livingWallSpec = `  living_wood_wall: {\n    layer: "Фоновая стена",\n    itemRu: "Стена из живого дерева",\n    itemEn: "Living Wood Wall",\n    paintRu: "Без краски",\n    paintEn: "None",\n    note: "Поставленная игроком безопасная и проходимая стена образует две декоративные колонны святилища.",\n  },\n`;
materials = replaceOnce(
  materials,
  wallSpecMarker,
  `${livingWallSpec}${wallSpecMarker}`,
  "Living Wood Wall specification insertion",
);
write("js/data/jungle/materials.js", materials);

// 4. Move both lanterns inward and one tile down so the raised beam is their
// actual physical support.
let objects = read("js/data/jungle/objects.js");
const oldLeftLantern = `  {\n    id: "JG_HUB_LANTERN_L",\n    name: "Левый фонарь святилища",\n    x: 23,\n    y: 23,\n    w: 1,\n    h: 2,\n    kind: "light",\n    style: "jungle_lantern",\n    short: "✦",\n    room: "jungle_hub",\n    lightRadius: 12,\n    ceilingMounted: true,\n    desc: "Подвесной Jungle Lantern освещает вход от Дриады и левую стойку святилища.",\n  },\n`;
const newLeftLantern = `  {\n    id: "JG_HUB_LANTERN_L",\n    name: "Левый фонарь святилища",\n    x: 25,\n    y: 24,\n    w: 1,\n    h: 2,\n    kind: "light",\n    style: "jungle_lantern",\n    short: "✦",\n    room: "jungle_hub",\n    lightRadius: 12,\n    ceilingMounted: true,\n    desc: "Подвесной Jungle Lantern закреплён на левой части бамбуковой перемычки y23 и освещает пилон.",\n  },\n`;
const oldRightLantern = `  {\n    id: "JG_HUB_LANTERN_R",\n    name: "Правый фонарь святилища",\n    x: 37,\n    y: 23,\n    w: 1,\n    h: 2,\n    kind: "light",\n    style: "jungle_lantern",\n    short: "✦",\n    room: "jungle_hub",\n    lightRadius: 12,\n    ceilingMounted: true,\n    desc: "Второй фонарь освещает телепортерный резерв и дверь к Шаману.",\n  },\n`;
const newRightLantern = `  {\n    id: "JG_HUB_LANTERN_R",\n    name: "Правый фонарь святилища",\n    x: 35,\n    y: 24,\n    w: 1,\n    h: 2,\n    kind: "light",\n    style: "jungle_lantern",\n    short: "✦",\n    room: "jungle_hub",\n    lightRadius: 12,\n    ceilingMounted: true,\n    desc: "Второй Jungle Lantern закреплён на правой части бамбуковой перемычки y23 и освещает резерв телепортера.",\n  },\n`;
objects = replaceOnce(objects, oldLeftLantern, newLeftLantern, "left shrine lantern");
objects = replaceOnce(objects, oldRightLantern, newRightLantern, "right shrine lantern");
write("js/data/jungle/objects.js", objects);

// 5. Give Living Wood Wall an organic wall texture instead of the generic
// fallback so the two background pillars remain readable in visual mode.
let extension = read("js/runtime/jungle-extensions.js");
const bambooWallBranch = `  if (mat === "bamboo_wall") {`;
const livingWallBranch = `  if (mat === "living_wood_wall") {\n    ctx.globalAlpha = 0.9;\n    ctx.fillStyle = p[0];\n    ctx.fillRect(x, y, t, t);\n    ctx.globalAlpha = 1;\n    ctx.strokeStyle = p[1];\n    ctx.lineWidth = 1;\n    for (const offset of [4, 11]) {\n      ctx.beginPath();\n      ctx.moveTo(x + offset, y);\n      ctx.bezierCurveTo(\n        x + offset - 3,\n        y + 5,\n        x + offset + 3,\n        y + 10,\n        x + offset - 1,\n        y + t,\n      );\n      ctx.stroke();\n    }\n    ctx.fillStyle = "rgba(31,22,16,.45)";\n    if (seeded(wx, wy, 71) > 0.45) ctx.fillRect(x + 7, y + 7, 3, 3);\n    return;\n  }\n\n`;
extension = replaceOnce(
  extension,
  bambooWallBranch,
  `${livingWallBranch}${bambooWallBranch}`,
  "Living Wood Wall texture branch",
);
write("js/runtime/jungle-extensions.js", extension);

// 6. Freeze the corrected design as scene metadata and documentation.
let layout = read("js/data/jungle/layout.js");
layout = replaceOnce(
  layout,
  `  wiringCircuits: 0,\n};`,
  `  wiringCircuits: 0,\n  sideCanopiesAttached: true,\n  sideCanopyLevels: [21, 20, 19],\n  hubPillarsPassable: true,\n  hubPillarWall: "Living Wood Wall",\n  hubBeamY: 23,\n  hubLanterns: ["x25 y24", "x35 y24"],\n};`,
  "Jungle validation metadata",
);
layout = replaceOnce(
  layout,
  `  "Архитектура повторяет мотив домика в кронах: Rich Mahogany, Living Mahogany, листья, бамбук, цветной лофт и живые корни.",`,
  `  "Архитектура повторяет мотив домика в кронах: боковые кроны физически лежат на крыше, а две органические колонны святилища выполнены проходимой Living Wood Wall.",`,
  "Jungle architecture note",
);
write("js/data/jungle/layout.js", layout);

let engineering = read("js/data/jungle/engineering.js");
engineering = replaceOnce(
  engineering,
  "Поверхностный джунглевый аванпост v1",
  "Поверхностный джунглевый аванпост v2",
  "Jungle engineering version",
);
write("js/data/jungle/engineering.js", engineering);

let html = read("jungle.html");
html = replaceAllRequired(
  html,
  "Джунглевый аванпост v1",
  "Джунглевый аванпост v2",
  1,
  "Jungle page version",
);
write("jungle.html", html);

let docs = read("docs/jungle-outpost.md");
docs = replaceOnce(docs, "## Архитектура v1", "## Архитектура v2", "Jungle docs version");
docs = replaceOnce(
  docs,
  "- Living Mahogany используется в стенах, подвесных стойках и четырёх живых корнях;",
  "- Living Mahogany используется в наружных стенах, перегородках и четырёх живых корнях;",
  "Jungle docs Living Mahogany role",
);
docs = replaceOnce(
  docs,
  "- ступенчатые Leaf Block-кроны заменяют обычную прямоугольную крышу;",
  "- ступенчатые Leaf Block-кроны заменяют обычную прямоугольную крышу, причём оба боковых навеса непосредственно лежат на потолке y22;\n- две внутренние колонны святилища сделаны из поставленной игроком Living Wood Wall: они видимы, безопасны и полностью проходимы;",
  "Jungle docs canopy and pillar rules",
);
docs = replaceOnce(
  docs,
  "Центральное святилище обрамлено Living Mahogany и Bamboo. В нём находятся Jungle Pylon, сундук `Джунгли / Храм` и резерв поверхностного телепортера.",
  "Центральное святилище оформлено двумя проходимыми полосами Living Wood Wall на `x23` и `x37`. Бамбуковая перемычка поднята на `y23`; фонари висят под ней на `x25` и `x35`. В хабе находятся Jungle Pylon, сундук `Джунгли / Храм` и резерв поверхностного телепортера.",
  "Jungle hub docs",
);
docs = replaceOnce(
  docs,
  "- подвесные источники света имеют физические опоры;",
  "- подвесные источники света имеют физические опоры; два фонаря святилища закреплены на Bamboo-балке y23;\n- декоративные колонны x23/x37 существуют только в фоновом слое и не блокируют проход;\n- нижние ряды обеих боковых крон находятся на y21 и соприкасаются с потолком y22;",
  "Jungle docs invariants",
);
write("docs/jungle-outpost.md", docs);

// 7. Add regression checks for exactly the two user-reported problems.
let checker = read("tools/check-jungle.cjs");
const teleporterMarker = `const teleporterReserves = D.objects.filter(`;
const structuralChecks = `const expectedSideCanopies = [\n  [6, 21, 24, 21],\n  [8, 20, 22, 20],\n  [11, 19, 19, 19],\n  [37, 21, 54, 21],\n  [39, 20, 52, 20],\n  [42, 19, 49, 19],\n];\nfor (const [x1, y1, x2, y2] of expectedSideCanopies) {\n  assert(\n    D.solids.some(\n      (solid) =>\n        solid.mat === "leaf_block" &&\n        solid.x1 === x1 &&\n        solid.y1 === y1 &&\n        solid.x2 === x2 &&\n        solid.y2 === y2,\n    ),\n    \`Missing attached side-canopy row x${x1}…${x2} y${y1}\`,\n  );\n}\nassert(\n  D.validation.sideCanopiesAttached === true &&\n    JSON.stringify(D.validation.sideCanopyLevels) === JSON.stringify([21, 20, 19]),\n  "Attached side-canopy snapshot mismatch",\n);\n\nfor (const x of [23, 37]) {\n  for (let y = 24; y <= 29; y += 1) {\n    assert(!effectiveSolidAt(x, y), \`Shrine pillar must be passable at x${x} y${y}\`);\n    assert(\n      backgroundAt(x, y)?.mat === "living_wood_wall",\n      \`Passable shrine pillar must use Living Wood Wall at x${x} y${y}\`,\n    );\n  }\n}\nassert(\n  D.backgrounds.filter((background) => background.passablePillar).length === 2,\n  "Expected two passable background shrine pillars",\n);\nassert(\n  D.validation.hubPillarsPassable === true &&\n    D.validation.hubPillarWall === "Living Wood Wall",\n  "Passable shrine-pillar snapshot mismatch",\n);\n\nconst leftHubBeam = D.solids.find(\n  (solid) => solid.name === "Левая часть бамбуковой перемычки святилища",\n);\nconst rightHubBeam = D.solids.find(\n  (solid) => solid.name === "Правая часть бамбуковой перемычки святилища",\n);\nassert(\n  leftHubBeam?.x1 === 24 &&\n    leftHubBeam?.x2 === 29 &&\n    leftHubBeam?.y1 === 23 &&\n    leftHubBeam?.y2 === 23,\n  "Left Bamboo beam must be x24–29 y23",\n);\nassert(\n  rightHubBeam?.x1 === 34 &&\n    rightHubBeam?.x2 === 36 &&\n    rightHubBeam?.y1 === 23 &&\n    rightHubBeam?.y2 === 23,\n  "Right Bamboo beam must be x34–36 y23",\n);\nassert(D.validation.hubBeamY === 23, "Bamboo beam snapshot must be y23");\n\nconst leftHubLantern = D.objects.find((object) => object.id === "JG_HUB_LANTERN_L");\nconst rightHubLantern = D.objects.find((object) => object.id === "JG_HUB_LANTERN_R");\nassert(\n  leftHubLantern?.x === 25 && leftHubLantern?.y === 24,\n  "Left shrine lantern must be x25 y24",\n);\nassert(\n  rightHubLantern?.x === 35 && rightHubLantern?.y === 24,\n  "Right shrine lantern must be x35 y24",\n);\nfor (const lantern of [leftHubLantern, rightHubLantern]) {\n  assert(\n    effectiveSolidAt(lantern.x, lantern.y - 1)?.mat === "bamboo_block",\n    \`${lantern.id} must hang from the Bamboo beam\`,\n  );\n}\n\n`;
checker = replaceOnce(
  checker,
  teleporterMarker,
  `${structuralChecks}${teleporterMarker}`,
  "Jungle structural-check insertion point",
);
write("tools/check-jungle.cjs", checker);

let renderingChecker = read("tools/check-jungle-rendering.cjs");
renderingChecker = replaceOnce(
  renderingChecker,
  `  "rich_mahogany_wall",\n  "jungle_leaf_wall",`,
  `  "rich_mahogany_wall",\n  "living_wood_wall",\n  "jungle_leaf_wall",`,
  "Living Wood Wall rendering palette assertion",
);
renderingChecker = replaceOnce(
  renderingChecker,
  `for (const wall of ["bamboo_wall", "jungle_stone_wall"]) {`,
  `for (const wall of ["living_wood_wall", "bamboo_wall", "jungle_stone_wall"]) {`,
  "Living Wood Wall texture assertion",
);
renderingChecker = replaceOnce(
  renderingChecker,
  `      texturedWallFamilies: 7,`,
  `      texturedWallFamilies: 8,`,
  "textured wall count",
);
write("tools/check-jungle-rendering.cjs", renderingChecker);

console.log("Applied Jungle canopy and passable-pillar design fix.");
