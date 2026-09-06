"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const SCENES = ["index.html", "desert.html", "underground.html", "jungle.html"];

// Read the actual entry point so checks use the same ordered data as the browser.
function loadScene(entry, root = ROOT) {
  const context = vm.createContext({ console });
  const run = (code) => vm.runInContext(code, context);
  const runFile = (file) => vm.runInContext(
    fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file },
  );
  const html = fs.readFileSync(path.join(root, entry), "utf8");
  for (const match of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
    const file = match[1].replace(/^\.\//, "").split("?")[0];
    if (file.startsWith("js/data/")) runFile(file);
  }
  return { context, run, runFile };
}

module.exports = { loadScene, SCENES, ROOT };
