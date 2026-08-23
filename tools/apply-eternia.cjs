#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const write = (relative, content) => {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.endsWith("\n") ? content : content + "\n", "utf8");
};

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`Missing replacement target: ${label}`);
  }
  const next = source.replace(from, to);
  if (next === source) throw new Error(`Replacement did not change file: ${label}`);
  return next;
}

const ETERNIA_OBJECTS = "// Dual-purpose Old One's Army layout inside the existing left boss arena.\n// No new physical floors or ceilings are required: the current Gray Brick floor\n// and four Boreal Wood Platform rows already satisfy both use cases.\n\nconst bossArenaBast = OBJECTS_ARENA.find((object) => object.id === \"BOSS_BAST_C\");\nif (bossArenaBast) {\n  Object.assign(bossArenaBast, {\n    x: -123,\n    y: 38,\n    desc:\n      \"Bast Statue перенесена с пола на платформу y41, чтобы центр пола оставался свободен под Eternia Crystal Stand.\",\n  });\n}\n\nconst OBJECTS_ETERNIA = [\n  {\n    id: \"ETERNIA_PORTAL_L\",\n    name: \"Ожидаемая зона левого портала\",\n    x: -200,\n    y: 49,\n    w: 5,\n    h: 5,\n    kind: \"zone\",\n    style: \"spawn\",\n    short: \"PORTAL L\",\n    room: \"boss_left\",\n    stage: \"Армия Древних\",\n    bossArenaLeft: true,\n    arenaSpec: true,\n    eterniaSpec: true,\n    hideLabel: false,\n    desc:\n      \"Ориентировочная зона Mysterious Portal у левого края пола. Реальная позиция выбирается игрой в допустимом диапазоне от центра стойки.\",\n  },\n  {\n    id: \"ETERNIA_PORTAL_R\",\n    name: \"Ожидаемая зона правого портала\",\n    x: -37,\n    y: 49,\n    w: 5,\n    h: 5,\n    kind: \"zone\",\n    style: \"spawn\",\n    short: \"PORTAL R\",\n    room: \"boss_left\",\n    stage: \"Армия Древних\",\n    bossArenaLeft: true,\n    arenaSpec: true,\n    eterniaSpec: true,\n    hideLabel: false,\n    desc:\n      \"Ориентировочная зона Mysterious Portal у правого края пола. Реальная позиция выбирается игрой в допустимом диапазоне от центра стойки.\",\n  },\n  {\n    id: \"ETERNIA_SENTRY_L\",\n    name: \"Левая площадка турелей\",\n    x: -161,\n    y: 28,\n    w: 5,\n    h: 3,\n    kind: \"zone\",\n    style: \"summon\",\n    short: \"SENTRY L\",\n    room: \"boss_left\",\n    stage: \"Армия Древних\",\n    bossArenaLeft: true,\n    arenaSpec: true,\n    eterniaSpec: true,\n    desc:\n      \"Рекомендуемая зона Ballista / Flameburst на существующей платформе y31, примерно посередине между стойкой и левым порталом.\",\n  },\n  {\n    id: \"ETERNIA_SENTRY_R\",\n    name: \"Правая площадка турелей\",\n    x: -77,\n    y: 28,\n    w: 5,\n    h: 3,\n    kind: \"zone\",\n    style: \"summon\",\n    short: \"SENTRY R\",\n    room: \"boss_left\",\n    stage: \"Армия Древних\",\n    bossArenaLeft: true,\n    arenaSpec: true,\n    eterniaSpec: true,\n    desc:\n      \"Рекомендуемая зона Ballista / Flameburst на существующей платформе y31, примерно посередине между стойкой и правым порталом.\",\n  },\n  {\n    id: \"ETERNIA_STAND\",\n    name: \"Стойка для кристалла Этернии\",\n    x: -119,\n    y: 51,\n    w: 5,\n    h: 3,\n    kind: \"station\",\n    style: \"summon\",\n    short: \"ETERNIA\",\n    room: \"boss_left\",\n    stage: \"Армия Древних\",\n    bossArenaLeft: true,\n    arenaSpec: true,\n    eterniaSpec: true,\n    centerX: -117,\n    floorY: 54,\n    requiredClearanceEachSide: 61,\n    leftClearance: 83,\n    rightClearance: 84,\n    freeHeight: 12,\n    foregroundLayer: \"Мебель события\",\n    foregroundItemRu: \"Стойка для кристалла Этернии\",\n    foregroundItemEn: \"Eternia Crystal Stand\",\n    foregroundPaintRu: \"Без краски\",\n    foregroundPaintEn: \"None\",\n    foregroundNote:\n      \"Стойка 5×3 стоит на настоящем Gray Brick floor y54; платформы не используются как опора.\",\n    desc:\n      \"Центр двойного назначения левой арены. От центра x−117 до краёв сплошного пола остаётся 83 тайла слева и 84 справа; ближайшая платформа находится на y41.\",\n  },\n];\n";
const ETERNIA_CHECK = "#!/usr/bin/env node\nconst fs = require(\"node:fs\");\nconst path = require(\"node:path\");\nconst vm = require(\"node:vm\");\n\nconst root = path.resolve(__dirname, \"..\");\nconst context = vm.createContext({ console });\nfor (const relative of [\n  \"js/data/solids/upper.js\",\n  \"js/data/solids/street.js\",\n  \"js/data/objects/arena.js\",\n  \"js/data/objects/eternia.js\",\n]) {\n  vm.runInContext(fs.readFileSync(path.join(root, relative), \"utf8\"), context, {\n    filename: relative,\n  });\n}\n\nconst data = vm.runInContext(\n  `({\n    upper: JSON.parse(JSON.stringify(SOLIDS_UPPER)),\n    street: JSON.parse(JSON.stringify(SOLIDS_STREET)),\n    arena: JSON.parse(JSON.stringify(OBJECTS_ARENA)),\n    eternia: JSON.parse(JSON.stringify(OBJECTS_ETERNIA)),\n  })`,\n  context,\n);\n\nconst errors = [];\nconst assert = (condition, message) => {\n  if (!condition) errors.push(message);\n};\n\nconst stand = data.eternia.find((object) => object.id === \"ETERNIA_STAND\");\nassert(Boolean(stand), \"ETERNIA_STAND is missing\");\nassert(\n  stand?.x === -119 && stand?.y === 51 && stand?.w === 5 && stand?.h === 3,\n  \"Eternia Crystal Stand must occupy x-119…-115, y51…53\",\n);\nassert(stand?.centerX === -117, \"Stand center must be x-117\");\nassert(\n  stand?.foregroundPaintEn === \"None\",\n  \"Eternia stand must remain unpainted\",\n);\n\nconst floor = data.street.find(\n  (solid) => solid.name === \"Пол левой босс-арены\",\n);\nassert(\n  floor &&\n    floor.x1 === -200 &&\n    floor.x2 === -33 &&\n    floor.y1 === 54 &&\n    floor.y2 === 54 &&\n    floor.mat === \"gray_brick\",\n  \"Left boss-arena floor must remain a continuous Gray Brick row x-200…-33 y54\",\n);\n\nconst leftClearance = stand.centerX - floor.x1;\nconst rightClearance = floor.x2 - stand.centerX;\nassert(leftClearance === 83, `Expected 83 left tiles, found ${leftClearance}`);\nassert(rightClearance === 84, `Expected 84 right tiles, found ${rightClearance}`);\nassert(\n  leftClearance >= stand.requiredClearanceEachSide &&\n    rightClearance >= stand.requiredClearanceEachSide,\n  \"Stand must have at least 61 floor tiles on both sides\",\n);\n\nconst supportingTiles = [];\nfor (let x = stand.x; x < stand.x + stand.w; x += 1) {\n  const support = [...data.upper, ...data.street].find(\n    (solid) =>\n      x >= solid.x1 &&\n      x <= solid.x2 &&\n      stand.floorY >= solid.y1 &&\n      stand.floorY <= solid.y2,\n  );\n  supportingTiles.push(support?.mat || null);\n}\nassert(\n  supportingTiles.every((material) => material === \"gray_brick\"),\n  \"All five stand tiles must be supported by solid Gray Brick, not platforms\",\n);\n\nconst obstructingSolids = [...data.upper, ...data.street].filter((solid) => {\n  if (solid.mat.includes(\"platform\") || solid.mat === \"bubble\") return false;\n  const overlapsX = solid.x2 >= stand.centerX - 61 && solid.x1 <= stand.centerX + 61;\n  const overlapsClearHeight = solid.y2 >= 44 && solid.y1 <= 53;\n  return overlapsX && overlapsClearHeight;\n});\nassert(\n  obstructingSolids.length === 0,\n  `Solid obstruction inside the 10-tile event clearance: ${obstructingSolids\n    .map((solid) => solid.name || solid.mat)\n    .join(\", \")}`,\n);\n\nfor (const y of [11, 21, 31, 41]) {\n  const platform = data.upper.find(\n    (solid) =>\n      solid.bossArenaLeft &&\n      solid.mat === \"boreal_platform_plain\" &&\n      solid.x1 === -198 &&\n      solid.x2 === -35 &&\n      solid.y1 === y &&\n      solid.y2 === y,\n  );\n  assert(Boolean(platform), `Boss platform y${y} must remain unchanged`);\n}\n\nconst bast = data.arena.find((object) => object.id === \"BOSS_BAST_C\");\nassert(\n  bast && bast.x === -123 && bast.y === 38,\n  \"Bast Statue must move onto the y41 platform and clear the event floor\",\n);\n\nfor (const [id, x] of [\n  [\"ETERNIA_SENTRY_L\", -161],\n  [\"ETERNIA_SENTRY_R\", -77],\n]) {\n  const zone = data.eternia.find((object) => object.id === id);\n  assert(\n    zone && zone.x === x && zone.y === 28 && zone.w === 5 && zone.h === 3,\n    `${id} geometry mismatch`,\n  );\n}\n\nfor (const [id, x] of [\n  [\"ETERNIA_PORTAL_L\", -200],\n  [\"ETERNIA_PORTAL_R\", -37],\n]) {\n  const zone = data.eternia.find((object) => object.id === id);\n  assert(\n    zone && zone.x === x && zone.y === 49 && zone.w === 5 && zone.h === 5,\n    `${id} geometry mismatch`,\n  );\n}\n\nassert(\n  data.eternia.every((object) => object.arenaSpec && object.bossArenaLeft),\n  \"Every Eternia object must appear in the left-arena specification\",\n);\nassert(\n  new Set(data.eternia.map((object) => object.id)).size === data.eternia.length,\n  \"Eternia object IDs must be unique\",\n);\nassert(data.eternia.length === 5, \"Expected one stand and four planning zones\");\n\nconst html = fs.readFileSync(path.join(root, \"index.html\"), \"utf8\");\nconst arenaScript = html.indexOf('./js/data/objects/arena.js');\nconst eterniaScript = html.indexOf('./js/data/objects/eternia.js');\nconst objectIndexScript = html.indexOf('./js/data/objects/index.js');\nassert(\n  arenaScript >= 0 && eterniaScript > arenaScript && objectIndexScript > eterniaScript,\n  \"index.html must load arena.js, eternia.js and objects/index.js in that order\",\n);\nassert(\n  html.includes('<button id=\"bossLeft\">Босс / Этерия</button'),\n  \"Left-arena navigation button was not renamed\",\n);\n\nconst objectIndex = fs.readFileSync(\n  path.join(root, \"js/data/objects/index.js\"),\n  \"utf8\",\n);\nassert(\n  objectIndex.includes(\"...OBJECTS_ETERNIA\"),\n  \"OBJECTS_ETERNIA is missing from foreground-object assembly\",\n);\n\nconst checkData = fs.readFileSync(path.join(root, \"tools/check-data.cjs\"), \"utf8\");\nassert(\n  checkData.includes('\"js/data/objects/eternia.js\"'),\n  \"check-data.cjs must load the Eternia object module\",\n);\n\nif (errors.length) {\n  console.error(\"ETERNIA CHECK: FAIL\");\n  for (const error of errors) console.error(`- ${error}`);\n  process.exit(1);\n}\n\nconsole.log(\"ETERNIA CHECK: PASS\");\nconsole.log(\n  JSON.stringify(\n    {\n      stand: \"5×3 · x-119…-115 · y51…53\",\n      centerX: stand.centerX,\n      floorY: stand.floorY,\n      clearances: { left: leftClearance, right: rightClearance },\n      firstPlatformY: 41,\n      sentryZones: 2,\n      portalZones: 2,\n      paints: 0,\n    },\n    null,\n    2,\n  ),\n);\n";
const ETERNIA_DOC = "# Совмещённая босс-арена и арена Армии Древних\n\nСхема рассчитана для Terraria 1.4.5.6.\n\nОтдельная постройка не нужна. Существующая левая босс-арена уже имеет сплошной пол `x−200…−33, y54`, четыре длинных платформенных яруса и достаточную высоту. В неё добавляется только функциональная разметка события.\n\n## Центральная стойка\n\n- Eternia Crystal Stand: `x−119…−115, y51…53`, размер `5×3`.\n- Центр стойки: `x−117`.\n- Опора: настоящий Gray Brick floor на `y54`; платформы под стойкой не используются.\n- До левого края пола: 83 тайла.\n- До правого края пола: 84 тайла.\n- Ближайший верхний ярус: Boreal Wood Platform на `y41`, то есть над полом остаётся 12 свободных рядов.\n- Краска не используется.\n\n## Использование старых ярусов\n\nСуществующие уровни `y41 / y31 / y21 / y11` сохраняются для боёв с боссами. Платформы не мешают проверке открытой местности Армии Древних.\n\nНа уровне `y31` отмечены две рекомендуемые зоны турелей:\n\n- слева: `x−161…−157, y28…30`;\n- справа: `x−77…−73, y28…30`.\n\nЭто приблизительные середины между стойкой и ожидаемыми порталами. Точные sentry placements игрок выбирает уже под доступный жезл и текущую волну.\n\n## Порталы\n\nНа концах пола отмечены ориентировочные зоны:\n\n- левый портал: `x−200…−196, y49…53`;\n- правый портал: `x−37…−33, y49…53`.\n\nЭто не физические блоки и не обещание точного тайла появления. Игра выбирает позицию порталов по доступной длине пола; зоны нужны для понимания направления потоков и подготовки атак у краёв.\n\n## Перенос Bast Statue\n\nBast Statue переносится с центрального пола на `x−123…−122, y38…40`, непосредственно над платформой `y41`. Так она продолжает давать бафф, но не пересекается со стойкой.\n\n## Инварианты\n\n- Пол `x−200…−33, y54` остаётся непрерывным.\n- В пределах 61 тайла в каждую сторону от центра стойки нет твёрдых препятствий в десяти тайлах над полом.\n- Boreal Wood Platform не заменяет опорные блоки стойки.\n- Существующие медовые пузыри, павильоны лечения и четыре боссовых яруса не передвигаются.\n- Никаких красок в арене не добавляется.\n\nОфициальные справочные страницы:\n\n- https://terraria.wiki.gg/wiki/Eternia_Crystal_Stand\n- https://terraria.wiki.gg/wiki/Old_One%27s_Army\n- https://terraria.wiki.gg/wiki/Guide:Old_One%27s_Army_strategies\n";

write("js/data/objects/eternia.js", ETERNIA_OBJECTS);
write("tools/check-eternia.cjs", ETERNIA_CHECK);
write("docs/eternia-arena.md", ETERNIA_DOC);

let index = read("index.html");
index = replaceRequired(
  index,
  "<title>Terraria — база, музей и наружные ямы-ловушки</title>",
  "<title>Terraria — база, музей, Этерия и наружные ямы-ловушки</title>",
  "page title",
);
index = replaceRequired(
  index,
  '><button id="bossLeft">Левая босс-арена</button',
  '><button id="bossLeft">Босс / Этерия</button',
  "left-arena button",
);
index = replaceRequired(
  index,
  "<b>База · музей · босс-арена · две наружные ямы-ловушки</b>",
  "<b>База · музей · босс/Этерия-арена · две наружные ямы-ловушки</b>",
  "map heading",
);
index = replaceRequired(
  index,
  '    <script src="./js/data/objects/arena.js"></script>\n    <script src="./js/data/objects/museum.js"></script>',
  '    <script src="./js/data/objects/arena.js"></script>\n    <script src="./js/data/objects/eternia.js"></script>\n    <script src="./js/data/objects/museum.js"></script>',
  "Eternia script order",
);
index = replaceRequired(
  index,
  "Арены: левая четырёхъярусная босс-колоннада и внутренняя улица M1",
  "Арены: левая совмещённая босс/Этерия-колоннада и внутренняя улица M1",
  "arena specification summary",
);
write("index.html", index);

let objectIndex = read("js/data/objects/index.js");
objectIndex = replaceRequired(
  objectIndex,
  "  ...OBJECTS_ARENA,\n  ...OBJECTS_MUSEUM,",
  "  ...OBJECTS_ARENA,\n  ...OBJECTS_ETERNIA,\n  ...OBJECTS_MUSEUM,",
  "object assembly",
);
write("js/data/objects/index.js", objectIndex);

let readme = read("README.md");
readme = replaceRequired(
  readme,
  "- Постоянные строительные инварианты: [docs/building-rules.md](docs/building-rules.md).",
  "- Постоянные строительные инварианты: [docs/building-rules.md](docs/building-rules.md).\n- Совмещённая босс/Этерия-арена: [docs/eternia-arena.md](docs/eternia-arena.md).",
  "README arena link",
);
readme = replaceRequired(
  readme,
  "node tools/check-data.cjs\nnode tools/check-desert.cjs",
  "node tools/check-data.cjs\nnode tools/check-desert.cjs\nnode tools/check-eternia.cjs",
  "README checks",
);
write("README.md", readme);

let checkData = read("tools/check-data.cjs");
checkData = replaceRequired(
  checkData,
  '  "js/data/objects/arena.js",\n  "js/data/objects/museum.js",',
  '  "js/data/objects/arena.js",\n  "js/data/objects/eternia.js",\n  "js/data/objects/museum.js",',
  "check-data module order",
);
checkData = replaceRequired(
  checkData,
  'assert(\n  new Set(D.objects.map((object) => object.id)).size === D.objects.length,\n  "Duplicate object ids",\n);',
  'assert(\n  new Set(D.objects.map((object) => object.id)).size === D.objects.length,\n  "Duplicate object ids",\n);\nassert(\n  D.objects.filter((object) => object.eterniaSpec).length === 5,\n  "Expected one Eternia stand and four planning zones",\n);',
  "check-data Eternia count",
);
write("tools/check-data.cjs", checkData);

let codeMap = read("docs/code-map.md");
codeMap = replaceRequired(
  codeMap,
  "- `js/data/objects/` — маршруты, станции, комнаты, склад, теплица, красители, арены, музей и ямы.",
  "- `js/data/objects/` — маршруты, станции, комнаты, склад, теплица, красители, арены, отдельная разметка Этерии, музей и ямы.",
  "code-map object modules",
);
codeMap = replaceRequired(
  codeMap,
  "node tools/check-data.cjs\npython3 -m http.server 8000",
  "node tools/check-data.cjs\nnode tools/check-eternia.cjs\npython3 -m http.server 8000",
  "code-map checks",
);
write("docs/code-map.md", codeMap);

console.log("Applied dual-purpose Eternia arena integration.");
