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
