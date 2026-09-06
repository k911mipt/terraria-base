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
