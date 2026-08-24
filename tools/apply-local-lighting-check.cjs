#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const write = (relative, content) =>
  fs.writeFileSync(path.join(root, relative), `${content.trimEnd()}\n`, "utf8");

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`Missing replacement target: ${label}`);
  }
  return source.replace(from, to);
}

let objects = read("js/data/underground/objects.js");
objects = objects.replace(
  /(\"id\": \"UG_GOBLIN_GREEN_TORCH\"[\s\S]*?\"lightRadius\": )7(\n\s*\})/,
  (match, prefix, suffix) => `${prefix}10${suffix}`,
);
if (!objects.includes('"id": "UG_GOBLIN_GREEN_TORCH"') || !objects.includes('"lightRadius": 10')) {
  throw new Error("Failed to raise the Goblin green torch planning radius");
}
write("js/data/underground/objects.js", objects);

let checker = read("tools/check-lighting.cjs");
checker = replaceRequired(
  checker,
  `    const influencingLights = lights.filter((light) =>\n      tiles.some((tile) => covers(light, tile.x, tile.y)),\n    );`,
  `    const localLights = lights.filter((light) => light.room === zone.room);\n    const influencingLights = localLights.filter((light) =>\n      tiles.some((tile) => covers(light, tile.x, tile.y)),\n    );`,
  "room-local light selection",
);
checker = replaceRequired(
  checker,
  `        ...lights.map((light) => {`,
  `        ...localLights.map((light) => {`,
  "darkest-tile local light selection",
);
checker = replaceRequired(
  checker,
  `      influencingLights.length >= zone.minSources,\n      \`${"${zone.name}"}: expected at least ${"${zone.minSources}"} contributing lights, found ${"${influencingLights.length}"}\`,`,
  `      localLights.length >= zone.minSources,\n      \`${"${zone.name}"}: expected at least ${"${zone.minSources}"} room-local lights, found ${"${localLights.length}"}\`,`,
  "minimum local sources assertion",
);
checker = replaceRequired(
  checker,
  `      contributingLights: influencingLights.map((light) => light.id),`,
  `      localLightCount: localLights.length,\n      contributingLights: influencingLights.map((light) => light.id),`,
  "local light count output",
);
write("tools/check-lighting.cjs", checker);

let rules = read("docs/building-rules.md");
rules = replaceRequired(
  rules,
  "- `tools/check-lighting.cjs` требует покрытия всех тайлов зоны хотя бы одним источником и минимального количества независимых источников для длинных помещений.",
  "- `tools/check-lighting.cjs` считает покрытие комнаты только от источников с совпадающим `object.room`; соседняя комната не может случайно компенсировать отсутствие собственного света. Для длинных помещений также требуется несколько независимых локальных источников.",
  "persistent local-light rule",
);
write("docs/building-rules.md", rules);

let docs = read("docs/underground-workshop.md");
docs = replaceRequired(
  docs,
  "Он также требует минимум два источника для боковых комнат, три для мастерской Гоблина и четыре для длинного рыболовного этажа.",
  "Покрытие каждой зоны считается только от источников, принадлежащих тому же модулю через `object.room`: свет соседней комнаты не может замаскировать тёмный угол. Требуются минимум два локальных источника для боковых комнат, три для мастерской Гоблина и четыре для длинного рыболовного этажа.",
  "underground lighting documentation",
);
write("docs/underground-workshop.md", docs);

console.log("Applied room-local lighting validation.");
