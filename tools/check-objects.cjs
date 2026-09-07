#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const {loadScene, SCENES} = require("./lib/load-scene.cjs");
let mutations = 0, warnings = 0;
for (const entry of SCENES) {
  const {run, runFile} = loadScene(entry);
  for (const file of ["core", "placement-contract", "validation", "model", "render-base", "render-objects",
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
    for (const change of ["w = 0", "h = -1", "x = NaN", "y = .5", "x = Number.MAX_SAFE_INTEGER", "w = 1000000000", "h = 1000000000"])
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
    if (run("objectSpecPrefix(saved) !== null && objectRole(saved) === 'item'"))
      rejected(`for (const prefix of ['foreground','chest']) for (const suffix of ['ItemRu','ItemEn','PaintRu','PaintEn','Layer','Note'])
        delete D.objects[currentIndex][prefix+suffix]`, "missing item specification");
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
    globalThis.scene = {title:'fixture',sceneId:'fixture',bounds:{xMin:0,xMax:10,yMin:0,yMax:10},rooms:[],objects:[fixture]};`);
  assert.equal(run("validateObjectData(scene).warnings.length"), 0);
  assert(run("validateObjectData(scene).errors.some(e=>e.includes('missing item specification'))"));
  run(`globalThis.legacy = D.objects.find(o => objectRole(o)==='item' && !objectSpecPrefix(o));
    globalThis.legacyScene = {...D,objects:[{...legacy}]};`);
  assert.equal(run("validateObjectData(legacyScene).warnings.length"), 1);
  run(`Object.assign(legacyScene.objects[0], {foregroundItemRu:'Предмет',foregroundItemEn:'Wooden Door',foregroundPaintRu:'Без краски',foregroundPaintEn:'None'});`);
  assert(run("validateObjectData(legacyScene).errors.some(e=>e.includes('remove the legacy exception'))"));
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
  for (const field of ["foregroundLayer", "foregroundNote"]) {
    run(`globalThis.partial = {...legacy, [${JSON.stringify(field)}]: "only auxiliary data"};`);
    assert(run("validateObjectData({...D, objects:[partial]}).errors.some(e=>e.includes('foregroundItemRu'))"));
    mutations++;
  }
  // Reusing another scene's legacy key does not grandfather a new object.
  run("globalThis.otherScene = {...D,sceneId:'not-'+D.sceneId, objects:[{...legacy}]};");
  assert(run("validateObjectData(otherScene).errors.some(e=>e.includes('not a legacy exception'))"));
  mutations++;
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
  // No current renderer/material failure can mask whole-spec deletion or a new
  // incomplete item: both must be rejected specifically by the object guard.
  for (const change of [
    `D.objects[0] = {...D.objects[0], w:1000000000};`,
    `const index = D.objects.findIndex(o=>objectRole(o)==='item' && !objectSpecPrefix(o));
     D.objects[index] = {...D.objects[index], foregroundNote:'partial'};`,
    `const other = {...D.objects.find(o=>objectRole(o)==='item' && !objectSpecPrefix(o))};
     D.objects.push({...other,id:'ANOTHER_NEW_ITEM'});`,
    `const index = D.objects.findIndex(o=>objectRole(o)==='item' && objectSpecPrefix(o));
     D.objects[index] = {...D.objects[index]};
     for (const prefix of ['foreground','chest']) for (const suffix of ['ItemRu','ItemEn','PaintRu','PaintEn','Layer','Note'])
       delete D.objects[index][prefix+suffix];`,
    `D.objects.push({...D.objects.find(o=>objectRole(o)==='item' && !objectSpecPrefix(o)),id:'NEW_INCOMPLETE'});`,
  ]) {
    run(`globalThis.savedObjects = D.objects; D.objects = [...D.objects]; startupComplete = true;`);
    try {
      run(`{ ${change} }`);
      assert.throws(() => run("buildBaseCaches()"), /Object data contract:/);
      assert.equal(run("startupComplete"), false);
    } finally { run("D.objects = savedObjects;"); }
  }
  assert.deepEqual(check(), []);
  for (const bounds of ["null", "{xMin:0,xMax:NaN,yMin:0,yMax:1}", "{xMin:1,xMax:0,yMin:0,yMax:1}"]) {
    assert(run(`validateObjectData({...D,bounds:${bounds}}).errors.some(e=>e.includes('bounds'))`));
  }
  assert.equal(run("JSON.stringify(D)"), original);
  console.log(`PASS ${entry}: ${count} objects; ${warningCount} explicitly incomplete item descriptions`);
}
console.log(`PASS ${mutations} object mutations; ${warnings} legacy metadata warnings are NOT a complete item catalogue`);
