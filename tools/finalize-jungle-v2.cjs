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

function writeConst(relative, comment, name, value) {
  write(relative, `${comment}\nconst ${name} = ${JSON.stringify(value, null, 2)};`);
}

const solidsPath = "js/data/jungle/solids.js";
const solids = evaluate(solidsPath, "JUNGLE_SOLIDS").filter(
  (solid) => solid.name !== "Бамбуковая перемычка святилища",
);
writeConst(
  solidsPath,
  "// Surface Jungle terrain, treehouse shell, canopy, roots and temple-access shaft.",
  "JUNGLE_SOLIDS",
  solids,
);

const backgroundsPath = "js/data/jungle/backgrounds.js";
const backgrounds = evaluate(backgroundsPath, "JUNGLE_BACKGROUNDS").filter(
  (wall) => wall.jungleHubAccent !== true,
);
backgrounds.push(
  {
    x1: 24,
    y1: 25,
    x2: 24,
    y2: 29,
    mat: "bamboo_wall",
    name: "Левая бамбуковая вставка святилища",
    desc: "Узкая Bamboo Wall-панель подчёркивает живую стойку, не блокируя проход к студии.",
    jungleHubAccent: true,
  },
  {
    x1: 36,
    y1: 25,
    x2: 36,
    y2: 29,
    mat: "bamboo_wall",
    name: "Правая бамбуковая вставка святилища",
    desc: "Зеркальная декоративная панель рядом с резервом поверхностного телепортера.",
    jungleHubAccent: true,
  },
);
writeConst(
  backgroundsPath,
  "// Safe player-placed walls for the Jungle treehouse, doors, platforms and shaft.",
  "JUNGLE_BACKGROUNDS",
  backgrounds,
);

const objectsPath = "js/data/jungle/objects.js";
const objects = evaluate(objectsPath, "JUNGLE_OBJECTS");
const byId = new Map(objects.map((object) => [object.id, object]));
const required = (id) => {
  const object = byId.get(id);
  if (!object) throw new Error(`Missing Jungle object ${id}`);
  return object;
};
required("JG_DRYAD_LANTERN").lightRadius = 11;
Object.assign(required("JG_HUB_LANTERN_L"), {
  x: 24,
  lightRadius: 12,
  desc: "Подвесной Jungle Lantern находится между левой стойкой и шахтой студии; над ним сплошной потолок y22.",
});
Object.assign(required("JG_HUB_LANTERN_R"), {
  x: 36,
  lightRadius: 12,
  desc: "Второй фонарь висит слева от правой живой стойки и освещает резерв поверхностного телепортера.",
});
required("JG_PAINTER_LANTERN").lightRadius = 11;
required("JG_WITCH_LANTERN").lightRadius = 12;
writeConst(
  objectsPath,
  "// Doors, residents, pylon, furniture, decor, measured lights and teleporter reserves.",
  "JUNGLE_OBJECTS",
  objects,
);

const checkPath = "tools/check-jungle.cjs";
let check = read(checkPath).replace(
  /solid\.x1 <= 52 && solid\.x2 >= 8 && solid\.y1 === 35/g,
  "solid.x1 <= 51 && solid.x2 >= 8 && solid.y1 === 35",
);
write(checkPath, check);

const jungleTab =
  '        <a class="scene-tab" href="./jungle.html">Джунглевый аванпост</a>';
for (const page of ["index.html", "desert.html", "underground.html"]) {
  let source = read(page);
  if (!source.includes('./jungle.html')) {
    if (!source.includes("</nav>")) throw new Error(`${page} has no scene navigation`);
    source = source.replace("</nav>", `${jungleTab}\n      </nav>`);
    write(page, source);
  }
}

const tabBootstrap = `

// Keep the Jungle scene visible even when an older cached HTML shell is still open.
(function ensureJungleSceneTab() {
  const nav = document.querySelector(".scene-tabs");
  if (!nav || nav.querySelector('a[href="./jungle.html"]')) return;
  const link = document.createElement("a");
  link.className = "scene-tab";
  link.href = "./jungle.html";
  link.textContent = "Джунглевый аванпост";
  nav.appendChild(link);
})();`;
for (const relative of [
  "js/runtime/start.js",
  "js/runtime/start-desert.js",
  "js/runtime/start-underground.js",
]) {
  let source = read(relative);
  if (!source.includes("ensureJungleSceneTab")) {
    source += tabBootstrap;
    write(relative, source);
  }
}

const readmePath = "README.md";
let readme = read(readmePath);
if (!readme.includes("- Джунглевый аванпост:")) {
  readme = readme.replace(
    "- Снежная мастерская Гоблина: https://k911mipt.github.io/terraria-base/underground.html",
    "- Снежная мастерская Гоблина: https://k911mipt.github.io/terraria-base/underground.html\n- Джунглевый аванпост: https://k911mipt.github.io/terraria-base/jungle.html",
  );
}
if (!readme.includes("[docs/jungle-outpost.md]")) {
  readme = readme.replace(
    "- Снежная мастерская Гоблина: [docs/underground-workshop.md](docs/underground-workshop.md).",
    "- Снежная мастерская Гоблина: [docs/underground-workshop.md](docs/underground-workshop.md).\n- Джунглевый аванпост: [docs/jungle-outpost.md](docs/jungle-outpost.md).",
  );
}
if (!readme.includes("`http://localhost:8000/jungle.html`")) {
  readme = readme.replace(
    "- `http://localhost:8000/underground.html` — подземная мастерская Гоблина.",
    "- `http://localhost:8000/underground.html` — подземная мастерская Гоблина.\n- `http://localhost:8000/jungle.html` — поверхностный джунглевый аванпост.",
  );
}
if (!readme.includes("node tools/check-jungle.cjs")) {
  readme = readme.replace(
    "node tools/check-lighting.cjs",
    "node tools/check-lighting.cjs\nnode tools/check-jungle.cjs",
  );
}
if (!readme.includes("`jungle.html` — поверхностный джунглевый аванпост")) {
  readme = readme.replace(
    "`underground.html` — снежная мастерская Гоблина.",
    "`underground.html` — снежная мастерская Гоблина, `jungle.html` — поверхностный джунглевый аванпост.",
  );
}
write(readmePath, readme);

console.log("Deterministic Jungle finalization complete.");
