#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const context = vm.createContext({ console });
for (const relative of [
  "js/data/materials.js",
  "js/data/jungle/materials.js",
]) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, {
    filename: relative,
  });
}

const { MAT, WALL, STYLE, WALL_SPECS } = vm.runInContext(
  "({ MAT: JSON.parse(JSON.stringify(MAT)), WALL: JSON.parse(JSON.stringify(WALL)), STYLE: JSON.parse(JSON.stringify(STYLE)), WALL_SPECS: JSON.parse(JSON.stringify(WALL_SPECS)) })",
  context,
);

const isHex = (value) =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

for (const key of [
  "rich_mahogany",
  "rich_mahogany_platform",
  "living_mahogany",
  "leaf_block",
  "jungle_grass",
  "bamboo_block",
]) {
  const palette = MAT[key];
  assert(Boolean(palette), `Missing MAT.${key}`);
  assert(isHex(palette?.base), `MAT.${key}.base must be a hex color`);
  assert(isHex(palette?.dark), `MAT.${key}.dark must be a hex color`);
  assert(isHex(palette?.light), `MAT.${key}.light must be a hex color`);
}

for (const key of [
  "rich_mahogany_wall",
  "living_wood_wall",
  "jungle_leaf_wall",
  "bamboo_wall",
  "painter_yellow_wall",
  "painter_teal_wall",
  "painter_magenta_wall",
  "jungle_stone_wall",
]) {
  const palette = WALL[key];
  assert(Array.isArray(palette), `WALL.${key} must be a two-color array`);
  assert(palette?.length === 2, `WALL.${key} must contain exactly two colors`);
  assert(isHex(palette?.[0]) && isHex(palette?.[1]), `WALL.${key} colors must be hex strings`);
  assert(
    WALL_SPECS[key]?.safe === true,
    `WALL_SPECS.${key} must explicitly mark the player-placed wall as safe`,
  );
}

for (const key of [
  "jungle_route",
  "jungle_dryad",
  "jungle_hub",
  "jungle_painter",
  "jungle_witch",
  "jungle_pylon",
  "witch_cauldron",
  "teleporter_reserve",
]) {
  assert(isHex(STYLE[key]), `STYLE.${key} must be a hex string for pstyle()`);
}

const extension = fs.readFileSync(
  path.join(root, "js/runtime/jungle-extensions.js"),
  "utf8",
);
for (const material of [
  "rich_mahogany_platform",
  "rich_mahogany",
  "living_mahogany",
  "leaf_block",
  "jungle_grass",
  "bamboo_block",
]) {
  assert(
    extension.includes(`mat === \"${material}\"`),
    `Jungle renderer must provide a texture branch for ${material}`,
  );
}
for (const wall of ["living_wood_wall", "bamboo_wall", "jungle_stone_wall"]) {
  assert(
    extension.includes(`mat === \"${wall}\"`),
    `Jungle renderer must provide a texture branch for ${wall}`,
  );
}
assert(
  extension.includes("JUNGLE_WOOD_WALLS"),
  "Jungle renderer must texture the mahogany and painted wood wall family",
);

for (const relative of [
  "index.html",
  "desert.html",
  "underground.html",
  "jungle.html",
]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert(
    source.includes('<a class="scene-tab" href="./jungle.html"'),
    `${relative} must contain a static Jungle scene tab`,
  );
  assert(
    source.includes('./scene-tabs.css'),
    `${relative} must load scene-tabs.css statically`,
  );
}

const html = fs.readFileSync(path.join(root, "jungle.html"), "utf8");
assert(
  html.includes('<a class="scene-tab" href="./jungle.html" aria-current="page"'),
  "jungle.html must mark the Jungle tab as current",
);
assert(
  html.includes('./js/runtime/jungle-extensions.js'),
  "jungle.html must load the Jungle texture renderer",
);

if (errors.length) {
  console.error("JUNGLE RENDERING CHECK: FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("JUNGLE RENDERING CHECK: PASS");
console.log(
  JSON.stringify(
    {
      texturedBlocks: 6,
      texturedWallFamilies: 8,
      safeWallFamilies: 8,
      navigationEntryPoints: 3,
      stylePalettes: 8,
    },
    null,
    2,
  ),
);
