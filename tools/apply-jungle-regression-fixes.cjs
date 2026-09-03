#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const write = (relative, content) =>
  fs.writeFileSync(path.join(root, relative), `${content.trimEnd()}\n`, "utf8");

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`Missing replacement target: ${label}`);
  }
  return source.replace(from, to);
}

function setLightRadius(source, id, radius) {
  const pattern = new RegExp(`(id: "${id}"[\\s\\S]*?lightRadius: )\\d+`);
  if (!pattern.test(source)) throw new Error(`Missing light ${id}`);
  return source.replace(pattern, `$1${radius}`);
}

let solids = read("js/data/jungle/solids.js");
solids = replaceRequired(
  solids,
  `  {
    x1: 24,
    y1: 24,
    x2: 36,
    y2: 24,
    mat: "bamboo_block",
    name: "Бамбуковая перемычка святилища",
    desc: "Лёгкая Bamboo-перемычка объединяет центральный павильон.",
    hubStyle: true,
  },`,
  `  {
    x1: 24,
    y1: 24,
    x2: 30,
    y2: 24,
    mat: "bamboo_block",
    name: "Левая часть бамбуковой перемычки святилища",
    desc: "Bamboo-перемычка заканчивается перед вертикальным проходом x31–32.",
    hubStyle: true,
  },
  {
    x1: 33,
    y1: 24,
    x2: 36,
    y2: 24,
    mat: "bamboo_block",
    name: "Правая часть бамбуковой перемычки святилища",
    desc: "Вторая часть перемычки начинается после прохода в студию Маляра.",
    hubStyle: true,
  },`,
  "open Painter access through bamboo beam",
);
write("js/data/jungle/solids.js", solids);

let objects = read("js/data/jungle/objects.js");
for (const [id, radius] of [
  ["JG_DRYAD_LANTERN", 11],
  ["JG_HUB_LANTERN_L", 12],
  ["JG_HUB_LANTERN_R", 12],
  ["JG_PAINTER_LANTERN", 11],
  ["JG_WITCH_LANTERN", 12],
]) {
  objects = setLightRadius(objects, id, radius);
}
write("js/data/jungle/objects.js", objects);

let checker = read("tools/check-jungle.cjs");
checker = replaceRequired(
  checker,
  "solid.x1 <= 52 && solid.x2 >= 8 && solid.y1 === 35 && solid.y2 >= 42 && !solid.rootSupport",
  "solid.x1 <= 51 && solid.x2 >= 8 && solid.y1 === 35 && solid.y2 >= 42 && !solid.rootSupport",
  "exclude the shaft boundary from open-root foundation check",
);
checker = replaceRequired(
  checker,
  `for (const page of ["index.html", "desert.html", "underground.html", "jungle.html"]) {
  const source = fs.readFileSync(path.join(root, page), "utf8");
  assert(source.includes("./jungle.html"), \`${"${page}"} is missing the Jungle scene tab\`);
}`,
  `const navigationSources = {
  "index.html": fs.readFileSync(path.join(root, "js/runtime/start.js"), "utf8"),
  "desert.html":
    fs.readFileSync(path.join(root, "desert.html"), "utf8") +
    fs.readFileSync(path.join(root, "js/runtime/start-desert.js"), "utf8"),
  "underground.html":
    fs.readFileSync(path.join(root, "underground.html"), "utf8") +
    fs.readFileSync(path.join(root, "js/runtime/start-underground.js"), "utf8"),
  "jungle.html": html,
};
for (const [page, source] of Object.entries(navigationSources)) {
  assert(source.includes("./jungle.html"), \`${"${page}"} is missing the Jungle scene tab\`);
}`,
  "navigation can be static or injected by the page start script",
);
write("tools/check-jungle.cjs", checker);

let html = read("jungle.html");
html = replaceRequired(
  html,
  '<script src="./js/runtime/prepare-underground.js"></script>',
  '<script src="./js/runtime/prepare-jungle.js"></script>',
  "Jungle prepare script",
);
html = replaceRequired(
  html,
  '<script src="./js/runtime/start-underground.js"></script>',
  '<script src="./js/runtime/start-jungle.js"></script>',
  "Jungle start script",
);
write("jungle.html", html);

console.log("Applied Jungle regression fixes.");
