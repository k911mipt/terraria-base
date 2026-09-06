// Runtime audits and engineering invariant checks.
function validatePitConfiguration() {
  const traps = ENG.devices.filter((o) => o.kind === "trap" && o.pitSide),
    bridges = ENG.devices.filter((o) => o.kind === "bridge"),
    levers = ENG.devices.filter((o) => o.kind === "lever" && o.pitSide);
  const trapOk = traps.filter((o) => o.actuatorInstalled === false).length;
  const bridgeOk = bridges.filter(
    (o) => o.actuatorInstalled === true && o.w === 16,
  ).length;
  const expectedCols = [
    [-18, "E"],
    [-1, "W"],
    [136, "E"],
    [153, "W"],
  ];
  let columnsOk = 0;
  for (const [x, facing] of expectedCols) {
    const col = traps
      .filter((o) => o.x === x && o.facing === facing)
      .map((o) => o.y)
      .sort((a, b) => a - b);
    if (col.length === 8 && col.every((y, i) => y === 56 + i)) columnsOk++;
  }
  const leverOk = levers.filter(
    (o) =>
      o.w === 2 &&
      o.h === 2 &&
      ((o.x === 1 && o.y === 56) || (o.x === 133 && o.y === 56)),
  ).length;
  const timersOk = ENG.devices.filter(
    (o) =>
      o.kind === "timer" &&
      o.pitSide &&
      ((o.x === 1 && o.y === 55) || (o.x === 134 && o.y === 55)),
  ).length;
  ENG.validation.pitStates = `traps ${trapOk}/32 · columns ${columnsOk}/4 · bridges ${bridgeOk}/2 · levers ${leverOk}/2 · timers ${timersOk}/2`;
  if (traps.length !== 32 || trapOk !== 32)
    ENG.validation.errors.push(
      "В ямах должно быть ровно 32 твёрдых Dart Trap без Actuator",
    );
  if (columnsOk !== 4)
    ENG.validation.errors.push(
      "Четыре столбца должны содержать по 8 Dart Trap на y56–63",
    );
  if (bridgeOk !== 2)
    ENG.validation.errors.push(
      "Оба актуируемых моста должны иметь по 16 блоков",
    );
  if (leverOk !== 2)
    ENG.validation.errors.push(
      "Lever должны стоять x1–2/y56–57 и x133–134/y56–57",
    );
  if (timersOk !== 2)
    ENG.validation.errors.push("Таймеры должны стоять x1/y55 и x134/y55");
  ENG.validation.status = ENG.validation.errors.length ? "FAIL" : "PASS";
}

// Small shared contract for material specs; gameplay/object rules are separate.
function materialSpecProblems(spec, background) {
  if (!spec || typeof spec !== "object" || Array.isArray(spec))
    return ["missing material specification"];
  const errors = [];
  for (const field of ["itemRu", "itemEn", "paintRu", "paintEn", "note"]) {
    if (!Object.hasOwn(spec, field) || typeof spec[field] !== "string" || !spec[field].trim())
      errors.push(`missing or invalid ${field}`);
  }
  if (background) {
    if (!Object.hasOwn(spec, "safe") || typeof spec.safe !== "boolean")
      errors.push("missing or invalid safe (expected boolean)");
  } else if (!Object.hasOwn(spec, "layer") || ![
    "Блок", "Твёрдый блок", "Блок с травой", "Поверхность", "Платформа",
    "Проходимый блок-мебель", "Блок-механизм", "Механизм-блок",
  ].includes(spec.layer)) errors.push("missing or invalid layer");
  return errors;
}

// The palettes currently use six-digit hex and rgba; do not silently accept a
// different format that Canvas/shading helpers would interpret differently.
function validMaterialColor(value) {
  if (typeof value !== "string") return false;
  if (/^#[0-9a-f]{6}$/i.test(value)) return true;
  const match = value.match(/^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*(0|1|0?\.\d+)\s*\)$/);
  return !!match && match.slice(1, 4).every(v => Number(v) <= 255) && Number(match[4]) <= 1;
}

function validMaterialPalette(palette, background) {
  return background
    ? Array.isArray(palette) && palette.length === 2 && [0, 1].every(i => Object.hasOwn(palette, i) && validMaterialColor(palette[i]))
    : !!palette && !Array.isArray(palette) && ["base", "dark", "light"].every(
      key => Object.hasOwn(palette, key) && validMaterialColor(palette[key]));
}

// Retain the wall-only API used by existing regression checks.
function validateUsedWallSpecs(scene, specs) {
  const errors = [], checked = new Set();
  for (const region of scene.backgrounds) {
    if (checked.has(region.mat)) continue;
    checked.add(region.mat);
    const spec = Object.hasOwn(specs, region.mat) ? specs[region.mat] : null;
    const where = `${scene.title}: wall ${region.mat} at X${region.x1} Y${region.y1}`;
    for (const problem of materialSpecProblems(spec, true)) errors.push(`${where}: ${problem}`);
  }
  return errors;
}

// Pure, shared by CLI and runtime. Rectangle order is not changed, so intentional
// last-write-wins overlays and open areas without backgrounds remain valid.
function validateUsedMaterialSpecs(scene, blockSpecs, wallSpecs, materials, walls) {
  const errors = [];
  for (const [background, regions, specs, palettes] of [
    [false, scene.solids, blockSpecs, materials],
    [true, scene.backgrounds, wallSpecs, walls],
  ]) {
    const checked = new Set();
    for (const region of regions) {
      const where = `${scene.title}: ${background ? "wall" : "block"} ${region.mat} at X${region.x1} Y${region.y1}`;
      if (![region.x1, region.y1, region.x2, region.y2].every(Number.isSafeInteger) ||
          region.x2 < region.x1 || region.y2 < region.y1)
        errors.push(`${where}: invalid rectangle`);
      if (checked.has(region.mat)) continue;
      checked.add(region.mat);
      const spec = Object.hasOwn(specs, region.mat) ? specs[region.mat] : null;
      for (const problem of materialSpecProblems(spec, background)) errors.push(`${where}: ${problem}`);
      if (!Object.hasOwn(palettes, region.mat) || !validMaterialPalette(palettes[region.mat], background))
        errors.push(`${where}: missing or invalid palette`);
    }
  }
  return errors;
}

// Small adapter for existing object metadata. No item names or paints are guessed.
const OBJECT_ROLE_LABELS = {
  item: "Предмет", zone: "Планировочная зона", npc: "Маркер жителя",
  liquid: "Жидкость", reserve: "Будущий резерв", landscape: "Элемент ландшафта",
  proposal: "Эскиз декора — предмет не выбран", unknown: "Неизвестный тип",
};
const NON_ITEM_ROLES = {
  zone: "zone", npc: "npc", water: "liquid", lava: "liquid", honey: "liquid",
  teleporter: "reserve", palm_tree: "landscape", cactus: "landscape", jungle_vine: "landscape",
  jungle_plant: "proposal", jungle_canvas: "proposal", jungle_totem: "proposal",
};
const PHYSICAL_OBJECT_KINDS = new Set([
  "chest", "station", "door", "hatch", "furniture", "bed", "personal_storage", "pylon",
  "planter", "light", "museum_trophy", "museum_mannequin", "museum_weapon_rack",
  "museum_item_frame", "display", "honey_bubble", "star_bottle", "statue", "campfire",
  "heart_lantern", "jungle_sign",
]);

// Frozen migration exceptions from 75db86cc: sceneId + ID + kind/style.
// Never inferred from current D. Remove the row/ID when its specification is completed.
const LEGACY_ITEM_METADATA = new Map([
  ["main", "door/route", "D_LT_TRANSPORT D_TRANSPORT_P1 D_P1_CRAFT D_CRAFT_P2 D_P2_PRE D_PRE_RT F_DOOR_1 F_DOOR_2 C_DOOR_1 C_DOOR_2 M_DOOR D_LT_MUSEUM D_RT_MUSEUM"],
  ["main", "hatch/route", "H_GREEN H_TOP_L H_TOP_C H_TOP_R H_MUS_L H_MUS_C H_MUS_R H_P1 H_P2 H_MUSH"],
  ["main", "station/special", "C_STMP C_LIZ C_BONE C_GLASS C_HONEY C_ICE C_LIVING C_SKY C_SOLID C_FLESH"],
  ["main", "station/advanced", "C_ANCIENT C_AUTO C_ORB C_BOOK"],
  ["main", "station/buff", "C_SHARP C_BEWITCH C_WAR C_AMMO"],
  ["main", "station/alchemy", "C_ALCH C_IMBUE C_DYE C_SINK"],
  ["main", "station/food", "C_KITCH"],
  ["main", "station/core", "C_FURNACE C_SAW C_WB C_ANVIL C_TINKER C_HEAVY C_LOOM C_EXTRACT"],
  ["main", "furniture/furniture", "ZT ZC GT GC GUIDET GUIDEC MT MC AT AC NT NC TRUFFLE_T TRUFFLE_C"],
  ["main", "light/light", "ZL GL GUIDEL ML AL NL TRAVEL_LIGHT PRE_LIGHT TRUFFLE_L"],
  ["main", "pylon/pylon", "PYLON"],
  ["main", "personal_storage/player1", "P1_PIGGY P1_SAFE P1_FORGE P1_VOID"],
  ["main", "bed/player1", "P1_BED"],
  ["main", "display/player1", "P1_MAN P1_RACK P1_FLAG"],
  ["main", "chest/curator", "P1_CHEST"],
  ["main", "personal_storage/player2", "P2_VOID P2_FORGE P2_SAFE P2_PIGGY"],
  ["main", "bed/player2", "P2_BED"],
  ["main", "display/player2", "P2_MAN P2_RACK P2_FLAG"],
  ["main", "chest/player2", "P2_CHEST"],
  ["main", "light/lantern_warm", "P1_LIGHT_UP P2_LIGHT_UP"],
  ["main", "light/star_light", "P1_LIGHT_LOW P2_LIGHT_LOW"],
  ["main", "light/pink_torch", "P1_TORCH_L P1_TORCH_R"],
  ["main", "light/ice_torch", "P2_TORCH_L P2_TORCH_R L_RACK_LIGHT_F2 R_RACK_LIGHT_F4"],
  ["main", "chest/ammo", "AMMO_C"],
  ["main", "chest/alchemy", "POTION_C"],
  ["main", "chest/mushroom", "MUSH_CHEST"],
  ["main", "light/white_torch", "L_RACK_LIGHT_F1 L_RACK_LIGHT_F4 R_RACK_LIGHT_F2 R_RACK_LIGHT_F5 GH_WHITE_1 GH_WHITE_2 GH_WHITE_3 GH_WHITE_4 GH_WHITE_5 GH_WHITE_6"],
  ["main", "light/red_torch", "L_RACK_LIGHT_F3"],
  ["main", "light/purple_torch", "L_RACK_LIGHT_F5 R_RACK_LIGHT_F3"],
  ["main", "light/ultrabright_torch", "R_RACK_LIGHT_F1"],
  ["main", "planter/planter_day", "HERB_1_DAY HERB_2_DAY HERB_3_DAY HERB_4_DAY"],
  ["main", "planter/planter_blink", "HERB_1_BLINK HERB_2_BLINK HERB_3_BLINK HERB_4_BLINK"],
  ["main", "planter/planter_moon", "HERB_1_MOON HERB_2_MOON HERB_3_MOON HERB_4_MOON"],
  ["main", "planter/planter_water", "HERB_1_WATER HERB_2_WATER HERB_3_WATER"],
  ["main", "planter/planter_fire", "HERB_1_FIRE HERB_2_FIRE HERB_3_FIRE HERB_4_FIRE"],
  ["main", "planter/planter_death", "HERB_1_DEATH HERB_2_DEATH HERB_3_DEATH HERB_4_DEATH"],
  ["main", "planter/planter_shiver", "HERB_1_SHIVER HERB_2_SHIVER HERB_3_SHIVER HERB_4_SHIVER"],
  ["main", "light/mushroom", "MUSH_TL1 MUSH_TR1 MUSH_TL2 MUSH_TR2 MUSH_TL3 MUSH_TR3"],
  ["main", "statue/heart_statue", "HEART_STAT_L HEART_STAT_R"],
  ["main", "heart_lantern/heal", "HEART_C BOSS_HEART_LANTERN_L BOSS_HEART_LANTERN_R"],
  ["main", "star_bottle/star_light", "STAR_C BOSS_STAR_L BOSS_STAR_R"],
  ["main", "campfire/buff", "FIRE_C BOSS_FIRE_L BOSS_FIRE_R"],
  ["main", "statue/bast", "BAST_C BOSS_BAST_C"],
  ["desert", "door/route", "D_OUTER_L D_INNER_L D_INNER_R D_OUTER_R DESERT_ACCESS_INNER"],
  ["desert", "hatch/route", "D_HATCH"],
  ["desert", "furniture/desert_furniture", "DESERT_ARMS_TABLE DESERT_ARMS_CHAIR DESERT_DYE_TABLE DESERT_DYE_CHAIR"],
  ["desert", "light/lantern_warm", "DESERT_ARMS_LIGHT DESERT_DYE_LIGHT DESERT_HUB_LIGHT_L DESERT_HUB_LIGHT_R DESERT_SERVICE_LIGHT_L DESERT_SERVICE_LIGHT_R DESERT_ACCESS_LIGHT DESERT_ACCESS_LIGHT_1 DESERT_ACCESS_LIGHT_2 DESERT_ACCESS_LIGHT_3 DESERT_ACCESS_LIGHT_4 DESERT_ACCESS_LIGHT_5 DESERT_ACCESS_LIGHT_6"],
  ["underground", "door/route", "UG_OUTER_L UG_MECH_GOBLIN UG_GOBLIN_PRINCESS UG_OUTER_R UG_FISHING_DOOR"],
  ["underground", "hatch/route", "UG_HATCH"],
  ["underground", "furniture/mechanic", "UG_MECHANIC_TABLE UG_MECHANIC_CHAIR"],
  ["underground", "furniture/tinkerer_station", "UG_GOBLIN_TABLE UG_GOBLIN_CHAIR"],
  ["underground", "personal_storage/special", "UG_SAFE"],
  ["underground", "furniture/princess_room", "UG_PRINCESS_TABLE UG_PRINCESS_CHAIR"],
  ["underground", "furniture/fishing_blue", "UG_FISH_CHAIR"],
  ["underground", "light/lantern_warm", "UG_SHAFT_LIGHT"],
  ["underground", "light/ice_torch", "UG_MECH_WALL_LIGHT"],
  ["underground", "light/ice_lantern", "UG_FISH_LIGHT_L UG_FISH_LIGHT_R UG_FISH_SERVICE_LIGHT"],
  ["jungle", "door/jungle_route", "JG_OUTER_L JG_DRYAD_HUB JG_HUB_WITCH JG_WITCH_SHAFT"],
  ["jungle", "hatch/jungle_route", "JG_PAINTER_HATCH"],
  ["jungle", "furniture/jungle_dryad", "JG_DRYAD_TABLE JG_DRYAD_CHAIR"],
  ["jungle", "chest/jungle_dryad", "JG_DRYAD_CHEST"],
  ["jungle", "light/jungle_lantern", "JG_DRYAD_LANTERN JG_HUB_LANTERN_L JG_HUB_LANTERN_R"],
  ["jungle", "light/jungle_torch", "JG_DRYAD_TORCH JG_SHAFT_LIGHT_1 JG_SHAFT_LIGHT_2 JG_SHAFT_LIGHT_3 JG_SHAFT_LIGHT_4"],
  ["jungle", "chest/jungle_hub", "JG_EXPEDITION_CHEST"],
  ["jungle", "furniture/jungle_painter", "JG_PAINTER_TABLE JG_PAINTER_CHAIR"],
  ["jungle", "chest/jungle_painter", "JG_PAINTER_CHEST"],
  ["jungle", "light/painter_lantern", "JG_PAINTER_LANTERN"],
  ["jungle", "light/painter_torch", "JG_PAINTER_TORCH"],
  ["jungle", "furniture/jungle_witch", "JG_WITCH_TABLE JG_WITCH_CHAIR"],
  ["jungle", "station/witch_cauldron", "JG_WITCH_CAULDRON"],
  ["jungle", "chest/jungle_witch", "JG_WITCH_CHEST"],
  ["jungle", "light/tiki_lantern", "JG_WITCH_LANTERN"],
  ["jungle", "light/tiki_torch", "JG_WITCH_TORCH"],
  ["jungle", "jungle_sign/jungle_hub", "JG_TEMPLE_SIGN"],
].flatMap(([scene, pair, ids]) => ids.split(" ").map(id => [`${scene}:${id}`, pair])));

function objectRole(object) {
  if (Object.hasOwn(NON_ITEM_ROLES, object?.kind)) return NON_ITEM_ROLES[object.kind];
  return PHYSICAL_OBJECT_KINDS.has(object?.kind) ? "item" : "unknown";
}

function hasObjectSpec(object, prefix) {
  const fields = ["ItemRu", "ItemEn", "PaintRu", "PaintEn", ...(prefix === "foreground" ? ["Layer", "Note"] : [])];
  return !!object && fields.some(suffix =>
    Object.hasOwn(object, prefix + suffix));
}

function objectSpecPrefix(object) {
  // Preserve foreground priority, then reuse existing chest specifications.
  return ["foreground", "chest"].find(prefix => hasObjectSpec(object, prefix)) || null;
}

function objectSpecProblems(object, prefix = objectSpecPrefix(object)) {
  if (!prefix) return ["Не указана предметная спецификация; название и краска не выбираются автоматически."];
  const errors = [];
  for (const suffix of ["ItemRu", "ItemEn", "PaintRu", "PaintEn"]) {
    const field = prefix + suffix;
    if (!object || !Object.hasOwn(object, field) || typeof object[field] !== "string" || !object[field].trim())
      errors.push(`Отсутствует или некорректно поле ${field}`);
  }
  return errors;
}

function objectMetadata(object) {
  const role = objectRole(object), prefix = objectSpecPrefix(object);
  const problems = role === "item" || prefix ? objectSpecProblems(object) : [];
  if (role === "unknown") problems.push("Неизвестный тип объекта; проверьте данные.");
  // Markers, liquids, landscapes and future/decorative proposals do not replace
  // the effective foreground block. They get their own explicit inspector row.
  if (!["item", "unknown"].includes(role)) return { role, problems, foreground: null };
  const text = (suffix, fallback) => {
    const field = prefix + suffix;
    return prefix && Object.hasOwn(object, field) && typeof object[field] === "string" && object[field].trim()
      ? object[field] : fallback;
  };
  return {
    role, problems,
    foreground: {
      layer: role === "unknown" ? "Ошибка данных" : problems.length
        ? "Объект · неполная спецификация" : object.foregroundLayer || "Объект",
      itemRu: text("ItemRu", "Предмет не указан"),
      itemEn: text("ItemEn", "Unspecified item"),
      paintRu: text("PaintRu", "Краска не указана"),
      paintEn: text("PaintEn", "Unspecified"),
      note: object?.foregroundNote || problems.join("; "),
      surfaceRu: null, surfaceEn: null,
    },
  };
}

function validateObjectData(scene) {
  const errors = [], warnings = [], ids = new Set();
  const bounds = scene.bounds;
  if (!bounds || !["xMin", "xMax", "yMin", "yMax"].every(key => Number.isSafeInteger(bounds[key])) ||
      bounds.xMin > bounds.xMax || bounds.yMin > bounds.yMax)
    return {errors: [`${scene.title}: invalid scene bounds`], warnings};
  if (typeof scene.sceneId !== "string" || !scene.sceneId.trim())
    errors.push(`${scene.title}: missing sceneId`);
  for (const object of scene.objects) {
    const where = `${scene.title}: object ${object?.id} at X${object?.x} Y${object?.y}`;
    const error = message => errors.push(`${where}: ${message}`);
    if (!object || typeof object !== "object" || Array.isArray(object)) {
      error("expected object record");
      continue;
    }
    for (const field of ["id", "name", "kind", "style"]) {
      if (!Object.hasOwn(object, field) || typeof object[field] !== "string" || !object[field].trim())
        error(`missing or invalid ${field}`);
    }
    if (ids.has(object.id)) error("duplicate object id");
    ids.add(object.id);
    if (!["x", "y", "w", "h"].every(field => Object.hasOwn(object, field) && Number.isSafeInteger(object[field])) ||
        object.w < 1 || object.h < 1 || !Number.isSafeInteger(object.x + object.w) || !Number.isSafeInteger(object.y + object.h) ||
        object.x < bounds.xMin || object.y < bounds.yMin ||
        object.x + object.w - 1 > bounds.xMax || object.y + object.h - 1 > bounds.yMax)
      error("invalid object rectangle");
    if (objectRole(object) === "unknown") error(`unknown object kind ${object.kind}`);
    if (Object.hasOwn(object, "room") && object.room !== "" &&
        !scene.rooms.some(room => room.id === object.room)) error(`unknown room ${object.room}`);
    for (const prefix of ["foreground", "chest"]) {
      if (hasObjectSpec(object, prefix))
        for (const problem of objectSpecProblems(object, prefix)) error(problem);
    }
    if (objectRole(object) === "item") {
      const legacy = LEGACY_ITEM_METADATA.get(`${scene.sceneId}:${object.id}`) === `${object.kind}/${object.style}`;
      if (!objectSpecPrefix(object)) {
        if (legacy) warnings.push(`${where}: ${objectSpecProblems(object)[0]}`);
        else error("missing item specification (not a legacy exception)");
      } else if (legacy && objectSpecProblems(object).length === 0) {
        error("completed specification: remove the legacy exception");
      }
    }
    for (const field of ["foregroundLayer", "foregroundNote"]) {
      if (Object.hasOwn(object, field) && typeof object[field] !== "string")
        error(`invalid ${field}`);
    }
    // Colors passed to shade() or directly to Canvas must use the existing
    // supported format; this does not turn a procedural style into an item.
    for (const field of ["paintColor", "accent"]) {
      if (Object.hasOwn(object, field) && (typeof object[field] !== "string" || !/^#[0-9a-f]{6}$/i.test(object[field])))
        error(`invalid ${field} palette color`);
    }
  }
  return { errors, warnings };
}
