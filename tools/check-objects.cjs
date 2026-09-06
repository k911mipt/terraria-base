#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const {loadScene, SCENES} = require("./lib/load-scene.cjs");
let mutations = 0, warnings = 0;
for (const entry of SCENES) {
  const {run, runFile} = loadScene(entry);
  for (const file of ["core", "validation", "model", "render-base", "render-objects",
    ...(entry === "index.html" ? [] : [entry.replace(".html", "") + "-extensions"])])
    runFile(`js/runtime/${file}.js`);
  const original = run("JSON.stringify(D)");
  const check = () => Array.from(run("validateObjectData(D).errors"));
  assert.deepEqual(check(), [], entry);
  const count = run("D.objects.length");
  const warningCount = run("validateObjectData(D).warnings.length");
  warnings += warningCount;
  for (let i = 0; i < count; i++) {
    run(`globalThis.saved = D.objects[${i}]; globalThis.currentIndex = ${i};`);
    const id = run("saved.id");
    function rejected(change, expected) {
      try {
        run("D.objects[currentIndex] = {...saved};" + change);
        assert(Array.from(run("validateObjectData({...D, objects:[D.objects[currentIndex]]}).errors")).some(message => message.includes(expected) && message.includes(run("D.title")) && /X.* Y/.test(message)),
          `${entry} ${id}: ${expected} not diagnosed`);
        mutations++;
      } finally { run("D.objects[currentIndex] = saved;"); }
    }
    for (const field of ["id", "name", "kind", "style"]) {
      rejected(`delete D.objects[currentIndex].${field}`, field);
      rejected(`D.objects[currentIndex].${field} = {}`, field);
    }
    for (const change of ["w = 0", "h = -1", "x = NaN", "y = .5", "x = Number.MAX_SAFE_INTEGER"])
      rejected(`D.objects[currentIndex].${change}`, "rectangle");
    rejected('D.objects[currentIndex].room = "MISSING_ROOM"', "unknown room");
    rejected('D.objects[currentIndex].paintColor = "rgba(1,2,3,.5)"', "paintColor");
    rejected('D.objects[currentIndex].accent = [1,2,3]', "accent");
    rejected('D.objects[currentIndex].foregroundNote = {}', "foregroundNote");
    for (const prefix of ["foreground", "chest"]) {
      if (!run(`hasObjectSpec(saved, ${JSON.stringify(prefix)})`)) continue;
      for (const suffix of ["ItemRu", "ItemEn", "PaintRu", "PaintEn"]) {
        rejected(`delete D.objects[currentIndex].${prefix + suffix}`, prefix + suffix);
        rejected(`D.objects[currentIndex].${prefix + suffix} = " "`, prefix + suffix);
      }
    }
    const metadata = run("objectMetadata(saved)");
    if (metadata.role === "item") {
      assert(metadata.foreground, `${id} must not be represented as air`);
      if (run("objectSpecPrefix(saved) === null")) {
        assert.match(metadata.foreground.itemRu, /не указан/);
        assert.equal(metadata.foreground.paintRu, "Краска не указана");
        assert(metadata.problems.length);
      } else {
        assert.equal(metadata.problems.length, 0);
        assert.equal(metadata.foreground.itemRu, run("saved[objectSpecPrefix(saved) + 'ItemRu']"));
      }
    } else assert.equal(metadata.foreground, null, `${id}: marker/liquid/reserve must not replace foreground`);
  }
  for (const invalid of ["null", "[]", "5", "Object.create(D.objects[0])"]) {
    run(`globalThis.first = D.objects[0]; D.objects[0] = ${invalid}`);
    try { assert(check().length, invalid); mutations++; }
    finally { run("D.objects[0] = first"); }
  }
  run("D.objects.push({...D.objects[0]})");
  try { assert(check().some(e => e.includes("duplicate object id"))); mutations++; }
  finally { run("D.objects.pop()"); }
  // Existing legacy holes stay visible warnings. Explicit partial specs fail.
  run(`globalThis.fixture = {id:'FIXTURE',name:'fixture',kind:'chest',style:'nature',x:1,y:1,w:2,h:2};
    globalThis.scene = {title:'fixture',rooms:[],objects:[fixture]};`);
  assert.equal(run("validateObjectData(scene).warnings.length"), 1);
  assert.equal(run("validateObjectData(scene).errors.length"), 0);
  run(`fixture.chestItemRu = 'Сундук'; fixture.chestItemEn = 'Chest';
       fixture.chestPaintRu = 'Без краски'; fixture.chestPaintEn = 'None';`);
  assert.equal(run("objectMetadata(fixture).foreground.paintEn"), "None");
  assert.equal(run("validateObjectData(scene).warnings.length"), 0);
  run("fixture.foregroundItemRu = 'Явный предмет'");
  assert.equal(run("objectMetadata(fixture).foreground.itemRu"), "Явный предмет");
  assert(run("validateObjectData(scene).errors.length > 0"), "partial foreground cannot fall back to complete chest");
  assert.equal(run("objectMetadata(null).foreground.layer"), "Ошибка данных");
  assert.equal(run("objectMetadata({kind:'__proto__'}).role"), "unknown");
  assert.equal(run("inspectorObjectRoom(D, null)"), null);
  assert.match(run("inspectorObjectRoom(D, {...D.objects[0], room:'MISSING_ROOM'}).error"), /unknown room/);
  assert.throws(() => run("roomForObject(D, {...D.objects[0], room:'MISSING_ROOM'})"), /unknown room/);
  assert.equal(run("JSON.stringify(D)"), original, "checks mutated scene data");
  // Rejection before the first Canvas access: actual complete runtime contract.
  run(`globalThis.elements = Object.fromEntries(['iname','idesc','ikv'].map(id=>[id,{}]));
    globalThis.document = {getElementById:id=>elements[id]};
    globalThis.viewport = {removeAttribute:name=>{ globalThis.removed = name; }};
    globalThis.startupComplete = true; globalThis.first = D.objects[0];
    D.objects[0] = {...first, w:0};`);
  assert.throws(() => run("buildBaseCaches()"), /Object data contract:.*rectangle/);
  assert.equal(run("startupComplete"), false);
  assert.equal(run("removed"), "data-ready");
  assert.equal(run("elements.iname.textContent"), "Ошибка данных объектов");
  run("D.objects[0] = first");
  assert.deepEqual(check(), []);
  console.log(`PASS ${entry}: ${count} objects; ${warningCount} explicitly incomplete item descriptions`);
}
console.log(`PASS ${mutations} object mutations; ${warnings} legacy metadata warnings are NOT a complete item catalogue`);
