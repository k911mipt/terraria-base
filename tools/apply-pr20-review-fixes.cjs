#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const write = (relative, content) =>
  fs.writeFileSync(path.join(root, relative), `${content.trimEnd()}\n`, "utf8");

function evaluate(relative, name) {
  const context = vm.createContext({ console });
  vm.runInContext(read(relative), context, { filename: relative });
  return vm.runInContext(`JSON.parse(JSON.stringify(${name}))`, context);
}

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`Missing replacement target: ${label}`);
  }
  return source.replace(from, to);
}

const objectsPath = "js/data/underground/objects.js";
const objects = evaluate(objectsPath, "UNDERGROUND_OBJECTS");
const byId = new Map(objects.map((object) => [object.id, object]));

for (const id of ["UG_FISH_LIGHT_L", "UG_FISH_LIGHT_R", "UG_FISH_SERVICE_LIGHT"]) {
  const light = byId.get(id);
  if (!light) throw new Error(`Missing ${id}`);
  light.y = 22;
  light.desc = `${light.desc.replace(/\s*$/, "")} Фонарь теперь висит непосредственно под твёрдым полом y21.`;
}

const pylonLantern = byId.get("UG_PYLON_ICE_LANTERN");
if (!pylonLantern) throw new Error("Missing UG_PYLON_ICE_LANTERN");
pylonLantern.desc =
  "Ice Lantern освещает правую сторону мастерской и стеклянную нишу Пилона пещер; над ним установлена отдельная Glass Platform на x40, y11.";

write(
  objectsPath,
  `// Doors, residents, styled furniture, measured lights, storage, water and Cavern Pylon.\nconst UNDERGROUND_OBJECTS = ${JSON.stringify(objects, null, 2)};`,
);

const solidsPath = "js/data/underground/solids.js";
const solids = evaluate(solidsPath, "UNDERGROUND_SOLIDS").filter(
  (solid) => !solid.lanternSupport,
);
solids.push({
  x1: 40,
  y1: 11,
  x2: 40,
  y2: 11,
  mat: "glass_platform",
  name: "Стеклянная опора фонаря ниши пилона",
  desc: "Glass Platform непосредственно над Ice Lantern позволяет реально установить подвесной фонарь в стеклянной нише.",
  decorativePlatform: true,
  lanternSupport: true,
});
write(
  solidsPath,
  `// Guaranteed Ice-biome context, styled rooms, open access and artificial fishing reservoir.\nconst UNDERGROUND_SOLIDS = ${JSON.stringify(solids, null, 2)};`,
);

const lightingPath = "tools/check-lighting.cjs";
let lighting = read(lightingPath);
lighting = replaceRequired(
  lighting,
  "      localLights.length >= zone.minSources,",
  "      influencingLights.length >= zone.minSources,",
  "minimum influencing source count",
);
lighting = replaceRequired(
  lighting,
  "      `${zone.name}: expected at least ${zone.minSources} room-local lights, found ${localLights.length}`,",
  "      `${zone.name}: expected at least ${zone.minSources} room-local lights that actually influence the zone, found ${influencingLights.length}`,",
  "minimum source message",
);
lighting = replaceRequired(
  lighting,
  "      localLightCount: localLights.length,\n      contributingLights: influencingLights.map((light) => light.id),",
  "      localLightCount: localLights.length,\n      influencingLightCount: influencingLights.length,\n      contributingLights: influencingLights.map((light) => light.id),",
  "lighting result counts",
);
lighting = replaceRequired(
  lighting,
  "  const lights = D.objects.filter((object) => object.kind === \"light\");\n  for (const light of lights) {",
  `  const lights = D.objects.filter((object) => object.kind === "light");
  const ceilingMountedStyles = new Set([
    "ice_lantern",
    "copper_chandelier",
    "crystal_chandelier",
  ]);
  const solidAt = (x, y) =>
    [...D.solids]
      .reverse()
      .find(
        (solid) =>
          x >= solid.x1 && x <= solid.x2 && y >= solid.y1 && y <= solid.y2,
      );
  for (const light of lights) {`,
  "ceiling support helpers",
);
lighting = replaceRequired(
  lighting,
  "    assert(\n      Number.isFinite(light.lightRadius) && light.lightRadius > 0,\n      `${light.id} must declare a positive lightRadius`,\n    );\n  }",
  `    assert(
      Number.isFinite(light.lightRadius) && light.lightRadius > 0,
      `${light.id} must declare a positive lightRadius`,
    );
    if (ceilingMountedStyles.has(light.style)) {
      const supportX = Math.floor(light.x + light.w / 2);
      const supportY = light.y - 1;
      assert(
        Boolean(solidAt(supportX, supportY)),
        `${light.id} must have a block or platform directly above at x${supportX} y${supportY}`,
      );
    }
  }`,
  "ceiling support assertions",
);
write(lightingPath, lighting);

const rulesPath = "docs/building-rules.md";
let rules = read(rulesPath);
if (!rules.includes("## Подвесные источники света")) {
  rules += `

## Подвесные источники света

- Подвесной фонарь или люстра должны иметь реальный блок либо платформу непосредственно над точкой крепления.
- Фоновая стена не является опорой для подвесного объекта.
- Для многотайловой люстры проверяется центральная точка крепления; для однотайлового фонаря — его собственный столбец.
- \`tools/check-lighting.cjs\` проверяет опоры для Ice Lantern, Copper Chandelier и Crystal Chandelier вместе с покрытием комнат.
- Источник учитывается в минимальном количестве света комнаты только тогда, когда его радиус действительно пересекает проверяемую зону.
`;
}
write(rulesPath, rules);

console.log("Applied PR #20 review fixes.");
// Touch this file after the workflow exists so the push event is guaranteed to fire.
