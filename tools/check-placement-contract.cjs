#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const {loadAudit, SCENES} = require("./lib/load-audit.cjs");
let cases = 0;
for (const entry of SCENES) {
  const {run, compute} = loadAudit(entry);
  const original = run("JSON.stringify({D,BLOCK_SPECS,WALL_SPECS,MAT,WALL})");
  assert.equal(compute().errors.length, 0, entry);
  for (const [source, specs, background] of [["solids", "BLOCK_SPECS", false], ["backgrounds", "WALL_SPECS", true]]) {
    for (const id of run(`[...new Set(D.${source}.map(r=>r.mat))]`)) {
      run(`globalThis.id=${JSON.stringify(id)}; globalThis.originalSpec=${specs}[id];`);
      const contract = run(`materialPlacementContract(id,originalSpec,${background})`);
      assert(contract && contract.identity.id, `${entry}: ${id}`);
      assert.equal(contract.paint, run("originalSpec.paintEn"));
      if (background) assert.equal(contract.safe, run("originalSpec.safe"));
      const other = background ? "Glass Wall" : "Glass";
      const alternate = background ? "Boreal Wood Wall" : "Gray Brick";
      try {
        run(`${specs}[id]={...originalSpec,itemEn:originalSpec.itemEn===${JSON.stringify(other)}?${JSON.stringify(alternate)}:${JSON.stringify(other)}}`);
        const errors = run("validateUsedMaterialSpecs(D,BLOCK_SPECS,WALL_SPECS,MAT,WALL)");
        assert(errors.some(e=>e.includes(id) && e.includes("incompatible material identity") && /X-?\d+ Y-?\d+/.test(e)));
        assert.match(run(`inspectorMaterialSpec(id,${background}).itemRu`), /Ошибка данных/);
        assert.equal(run(`materialPlacementContract(id,${specs}[id],${background})`), null);
        cases++;
      } finally {run(`${specs}[id]=originalSpec`);}
      if (background) continue;
      try {
        run("BLOCK_SPECS[id]={...originalSpec,layer:originalSpec.layer==='Платформа'?'Блок':'Платформа'}");
        assert(run("validateUsedMaterialSpecs(D,BLOCK_SPECS,WALL_SPECS,MAT,WALL).some(e=>e.includes(id)&&e.includes('collision'))"));
        assert.throws(()=>run("buildingGrid(D,BLOCK_SPECS)"), /incompatible material collision/);
        cases++;
      } finally {run("BLOCK_SPECS[id]=originalSpec");}
    }
  }
  const count = run("D.objects.length");
  const auditedFields = new Set();
  for (let i=0;i<count;i++) {
    run(`globalThis.object=D.objects[${i}];`);
    const contract = run("objectContract(object)");
    assert.deepEqual(Array.from(contract.problems), Array.from(run("objectMetadata(object).problems")));
    assert.equal(contract.renderer.kind, run("object.kind"));
    assert.equal(contract.renderer.style, run("object.style"));
    assert.deepEqual(contract.placement, run("buildingObjectTraits(object)"));
    assert.equal(run("typeof rendererForObject(object)"), "function");
    if (contract.role !== "item") {
      assert.equal(contract.identity.status,"non-item");
      assert.equal(contract.passage,"annotation");
      continue;
    }
    if (contract.identity.status === "unresolved") {
      assert.equal(contract.identity.items.length,0,"Do not invent an item for an unresolved object");
      assert(run("!objectSpecPrefix(object)"));
    } else assert(contract.identity.items.length > 0);
    for (const [field, value] of [["attachment","not-a-support"],["collision",!contract.placement.collision],["blocksDoor",!contract.placement.blocksDoor]]) {
      run(`globalThis.beforeDescriptor=Object.getOwnPropertyDescriptor(object,${JSON.stringify(field)});object[${JSON.stringify(field)}]=${JSON.stringify(value)};`);
      try {
        assert(run(`validateObjectData({...D,objects:[object]}).errors.some(e=>e.includes(object.id)&&e.includes('incompatible placement ${field}'))`));
        assert(run("objectContract(object).problems.some(e=>e.includes('incompatible placement'))"));
        // Exercise the full scene audit once for each override field; all
        // objects still run the pure contract and the real metadata validator.
        if (!auditedFields.has(field)) {
          assert(run("auditBuilding(D,BLOCK_SPECS).errors.some(e=>e.id===object.id && e.rule==='object-contract')"));
          auditedFields.add(field);
        }
        cases++;
      } finally {
        run(`if(beforeDescriptor)Object.defineProperty(object,${JSON.stringify(field)},beforeDescriptor);else delete object[${JSON.stringify(field)}];`);
      }
    }
  }
  assert.equal(run("materialBinding('__proto__')"), null);
  assert.equal(run("materialPlacementContract('glass',null)"), null);
  assert.equal(run("objectContract(null).identity.status"), "invalid");
  assert.equal(run("objectContract({kind:'__proto__'}).identity.status"), "invalid");
  assert.equal(run("materialPlacementContract('mushroom_block',BLOCK_SPECS.mushroom_block).identity.inventoryItem"), "Glowing Mushroom");
  assert.equal(run("materialBinding('bubble').collision"), "passable");
  assert.equal(run("materialBinding('boreal_platform').collision"), "platform");
  assert.equal(run("materialBinding('gray_brick').collision"), "solid");
  // Actual startup guard rejects a plausible-looking layer swap before Canvas access.
  run(`globalThis.elements=Object.fromEntries(['iname','idesc','ikv'].map(id=>[id,{}]));
       globalThis.document={getElementById:id=>elements[id]};
       globalThis.viewport={removeAttribute:name=>{globalThis.removed=name;}};
       globalThis.startupComplete=true;globalThis.first=D.solids[0].mat;globalThis.savedSpec=BLOCK_SPECS[first];
       BLOCK_SPECS[first]={...savedSpec,layer:'Платформа'};`);
  try {
    assert.throws(()=>run("buildBaseCaches()"), /Material contract:.*collision/);
    assert.equal(run("startupComplete"),false);
    assert.equal(run("removed"),"data-ready");
  } finally {run("BLOCK_SPECS[first]=savedSpec");}
  assert.equal(run("JSON.stringify({D,BLOCK_SPECS,WALL_SPECS,MAT,WALL})"),original,"Contract checks modified source data");
  assert.equal(compute().errors.length,0);
  console.log(`PASS ${entry}: shared identity, placement and collision contracts`);
}
console.log(`PASS ${cases} placement-contract mutations; geometry and source specifications unchanged`);
