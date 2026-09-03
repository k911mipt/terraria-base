#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const write = (relative, content) =>
  fs.writeFileSync(path.join(root, relative), `${content.trimEnd()}\n`, "utf8");

const navFor = (current) => `      <nav class="scene-tabs" aria-label="Сцены проекта">
        <a class="scene-tab" href="./index.html"${current === "index" ? ' aria-current="page"' : ""}>Основная база</a>
        <a class="scene-tab" href="./desert.html"${current === "desert" ? ' aria-current="page"' : ""}>Пустынный аванпост</a>
        <a class="scene-tab" href="./underground.html"${current === "underground" ? ' aria-current="page"' : ""}>Мастерская Гоблина</a>
        <a class="scene-tab" href="./jungle.html"${current === "jungle" ? ' aria-current="page"' : ""}>Джунглевый аванпост</a>
      </nav>`;

function replaceNav(relative, current) {
  let html = read(relative);
  const navPattern = /\s*<nav class="scene-tabs" aria-label="Сцены проекта">[\s\S]*?<\/nav>/;
  if (navPattern.test(html)) {
    html = html.replace(navPattern, `\n${navFor(current)}`);
  } else {
    const toolbar = '    <div class="toolbar">';
    if (!html.includes(toolbar)) throw new Error(`Toolbar missing in ${relative}`);
    html = html.replace(toolbar, `${toolbar}\n${navFor(current)}`);
  }
  if (!html.includes('./scene-tabs.css')) {
    html = html.replace(
      '    <link rel="stylesheet" href="./styles.css" />',
      '    <link rel="stylesheet" href="./styles.css" />\n    <link rel="stylesheet" href="./scene-tabs.css" />',
    );
  }
  write(relative, html);
}

replaceNav("index.html", "index");
replaceNav("desert.html", "desert");
replaceNav("underground.html", "underground");
replaceNav("jungle.html", "jungle");

let index = read("index.html");
index = index.replace(
  '<script src="./js/runtime/start.js"></script>',
  '<script src="./js/runtime/start.js?v=20260903-jungle-tabs"></script>',
);
write("index.html", index);

let start = read("js/runtime/start.js");
const begin = start.indexOf("// Scene navigation.");
const end = start.indexOf("// Cache construction, table population and initial arena focus.");
if (begin < 0 || end < 0 || end <= begin) {
  throw new Error("Could not locate scene-navigation block in start.js");
}
const navigation = `// Scene navigation is present in HTML so a cached JavaScript file cannot hide
// a newly deployed scene. The fallback keeps standalone/local copies resilient.
let sceneTabs = document.querySelector(".scene-tabs");
if (!sceneTabs) {
  const sceneTabsCss = document.createElement("link");
  sceneTabsCss.rel = "stylesheet";
  sceneTabsCss.href = "./scene-tabs.css";
  document.head.append(sceneTabsCss);

  sceneTabs = document.createElement("nav");
  sceneTabs.className = "scene-tabs";
  sceneTabs.setAttribute("aria-label", "Сцены проекта");
  document.querySelector(".toolbar").prepend(sceneTabs);
}

const sceneLinks = [
  ["./index.html", "Основная база"],
  ["./desert.html", "Пустынный аванпост"],
  ["./underground.html", "Мастерская Гоблина"],
  ["./jungle.html", "Джунглевый аванпост"],
];
for (const [href, label] of sceneLinks) {
  if (sceneTabs.querySelector(\`a[href="${href}"]\`)) continue;
  sceneTabs.insertAdjacentHTML(
    "beforeend",
    \`<a class="scene-tab" href="${href}">${label}</a>\`,
  );
}

`;
start = `${start.slice(0, begin)}${navigation}${start.slice(end)}`;
write("js/runtime/start.js", start);

let renderingCheck = read("tools/check-jungle-rendering.cjs");
const oldCheck = `for (const relative of [
  "js/runtime/start.js",
  "js/runtime/start-desert.js",
  "js/runtime/start-underground.js",
]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert(
    source.includes("./jungle.html"),
    \`${"${relative}"} must expose the Jungle scene tab\`,
  );
}`;
const newCheck = `for (const relative of [
  "index.html",
  "desert.html",
  "underground.html",
  "jungle.html",
]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert(
    source.includes('<a class="scene-tab" href="./jungle.html"'),
    \`${"${relative}"} must contain a static Jungle scene tab\`,
  );
  assert(
    source.includes('./scene-tabs.css'),
    \`${"${relative}"} must load scene-tabs.css statically\`,
  );
}`;
if (!renderingCheck.includes(oldCheck)) {
  throw new Error("Could not locate navigation assertions in rendering checker");
}
renderingCheck = renderingCheck.replace(oldCheck, newCheck);
write("tools/check-jungle-rendering.cjs", renderingCheck);

console.log("Applied static scene tabs and cache-safe main startup.");
