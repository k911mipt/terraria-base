#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const target = path.join(__dirname, "apply-jungle-canopy-pillars.cjs");
let source = fs.readFileSync(target, "utf8");

for (const [from, to] of [
  ["x${x1}…${x2} y${y1}", "x\\${x1}…\\${x2} y\\${y1}"],
  ["x${x} y${y}", "x\\${x} y\\${y}"],
  ["${lantern.id} must hang", "\\${lantern.id} must hang"],
]) {
  if (!source.includes(from)) throw new Error(`Missing applicator fragment: ${from}`);
  source = source.split(from).join(to);
}

fs.writeFileSync(target, source);
require(target);

const checkerPath = path.join(__dirname, "check-jungle.cjs");
let checker = fs.readFileSync(checkerPath, "utf8");
const oldVersionCheck =
  'assert(html.includes("Джунглевый аванпост v1"), "Jungle v1 title is missing");';
const newVersionCheck =
  'assert(html.includes("Джунглевый аванпост v2"), "Jungle v2 title is missing");';
if (!checker.includes(oldVersionCheck)) {
  throw new Error("Missing Jungle v1 HTML assertion in checker");
}
checker = checker.replace(oldVersionCheck, newVersionCheck);
fs.writeFileSync(checkerPath, checker);
