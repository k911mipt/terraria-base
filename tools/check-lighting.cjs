#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const {spawnSync} = require("node:child_process");
const {loadAudit, SCENES} = require("./lib/load-audit.cjs");
let cases = 0;
for (const entry of SCENES) {
  const {run, runFile, compute} = loadAudit(entry);
  runFile("js/runtime/formatters.js");
  const original = run("JSON.stringify(D)");
  const baseline = compute().lighting;
  assert.equal(baseline.errors.length, 0, entry);
  assert.equal(baseline.zones.length, {"index.html":16,"desert.html":5,"underground.html":4,"jungle.html":5}[entry]);
  if (["underground.html","jungle.html"].includes(entry)) {
    assert.equal(baseline.status, "PASS", "existing measured zones must remain unchanged");
    assert(baseline.zones.every(zone => zone.coverage === 1));
    assert.deepEqual(Array.from(baseline.zones,zone=>zone.influencingSources.length),
      entry === "underground.html" ? [2,3,2,4] : [2,2,2,2,4]);
  } else assert.equal(baseline.status, "WARN", "new dark zones must not be silently promoted to PASS");
  run("globalThis.savedObjects=D.objects;globalThis.light=D.objects.find(o=>o.kind==='light');");
  function mutation(source, inspect) {
    try {run(source);inspect(compute().lighting);cases++;}
    finally {run("D.objects=savedObjects;");}
  }
  mutation("D.objects=D.objects.filter(o=>!LIGHT_KINDS.has(o.kind));", report=>{
    assert.equal(report.status,"WARN");
    assert(report.zones.every(zone=>zone.covered===0 && zone.influencingSources.length===0));
  });
  for (const radius of ["0","-1","NaN","1000000","'7'"]) mutation(
    `D.objects=D.objects.map(o=>o===light?{...o,lightRadius:${radius}}:o);`, report=>{
      assert.equal(report.status,"FAIL");
      assert(report.errors.some(e=>e.id===run("light.id")&&e.rule==='lighting-contract'&&Number.isInteger(e.x)&&Number.isInteger(e.y)));
    });
  mutation("D.objects=D.objects.map(o=>o===light?{...o,style:'UNKNOWN_LIGHT'}:o);", report=>{
    assert.equal(report.status,"NOT_RUN", "malformed scene objects are rejected before lighting");
    assert.equal(compute().status,"FAIL");
  });
  assert.equal(run("JSON.stringify(D)"),original);
  // Standalone positive fixture: no existing scene errors can mask a mutation.
  run(`globalThis.fixture={sceneId:'fixture',bounds:{xMin:0,xMax:40,yMin:0,yMax:15},
    rooms:[{id:'room',x1:0,x2:40,y1:0,y2:15},{id:'other',x1:0,x2:40,y1:0,y2:15}],
    solids:[],backgrounds:[{x1:0,x2:40,y1:0,y2:15,mat:'boreal_wall'}],objects:[
      {id:'left',kind:'light',style:'white_torch',x:3,y:3,w:1,h:1,room:'room'},
      {id:'right',kind:'light',style:'white_torch',x:4,y:4,w:1,h:1,room:'room'}]};
    globalThis.zones=[{id:'sample',name:'Sample',room:'room',x1:2,y1:2,x2:5,y2:5,minSources:2,minCoverage:1}];
    globalThis.config={closedRooms:[],passages:[],platformRuns:[]};
    globalThis.sample=()=>auditLighting(fixture,BLOCK_SPECS,zones,auditBuilding(fixture,BLOCK_SPECS,config));
    globalThis.resetFixture=JSON.stringify(fixture);globalThis.resetZones=JSON.stringify(zones);`);
  const sample = () => run("sample()");
  assert.equal(sample().status,"PASS"); cases++;
  function test(source, inspect) {
    try {run(source);inspect(sample());cases++;}
    finally {run("fixture=JSON.parse(resetFixture);zones=JSON.parse(resetZones);");}
  }
  test("fixture.objects[0].style='UNKNOWN_LIGHT';",report=>{
    assert.equal(report.status,"FAIL");
    assert(report.errors.some(e=>e.rule==='lighting-contract'&&e.id==='left'));
  });
  const onlyOne = report => {
    assert.equal(report.status,"WARN");
    assert.equal(report.zones[0].coverage,1,"minSources must be tested independently of coverage");
    assert.equal(report.zones[0].influencingSources.length,1);
    assert(report.warnings.some(e=>e.rule==='lighting-sources'));
  };
  test("fixture.objects.pop();",onlyOne);
  test("fixture.objects[1].x=35;",onlyOne);
  test("fixture.objects[1].room='other';",onlyOne);
  test("fixture.solids.push({x1:3,x2:3,y1:3,y2:3,mat:'gray_brick'});", report=>{
    assert.equal(report.status,"FAIL");
    assert(report.excludedSources.some(source=>source.id==='left'&&source.rules.includes('object-overlap')));
  });
  // Both participants in an overlap are unusable, regardless of source ordering.
  test("fixture.objects.push({...fixture.objects[0],id:'duplicate'});", report=>{
    assert.equal(report.status,"FAIL");
    assert.deepEqual(Array.from(report.excludedSources,source=>source.id).sort(),['duplicate','left']);
  });
  test("fixture.backgrounds=[];", report=>{
    assert.equal(report.status,"FAIL");
    assert.equal(report.sources.length,0);
    assert(report.excludedSources.every(source=>source.rules.includes('torch-attachment')));
  });
  for (const source of ["zones=[];","zones=null;","zones.push({...zones[0]});",
    "zones[0].x2=1000000;","zones[0].minCoverage=0;","zones[0].minCoverage=2;",
    "zones[0].minSources=0;","zones[0].minSources=1.5;","zones[0].room='missing';"]) {
    test(source,report=>{assert.equal(report.status,'FAIL');assert(report.errors.some(e=>e.rule==='lighting-contract'));});
  }
  run("globalThis.exception=LIGHT_RADIUS_EXCEPTIONS.values().next().value;globalThis.savedReason=exception.reason;exception.reason='';");
  try {assert.throws(()=>run("lightingRadius('underground',{id:'UG_GOBLIN_GREEN_TORCH',kind:'light',style:'green_torch',lightRadius:10})"),/exception/);cases++;}
  finally {run("exception.reason=savedReason;");}
  run(`globalThis.htmlReport=sample();htmlReport.zones[0].name='<img onerror=bad>';`);
  assert(!run("renderLightingAudit(htmlReport)").includes('<img'));cases++;
  console.log(`PASS ${entry}: ${baseline.zones.length} computed zones; ${baseline.status} is the current design result`);
}
const cli=spawnSync(process.execPath,[require('node:path').join(__dirname,'audit-lighting.cjs'),'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});
assert.ifError(cli.error);assert.equal(cli.status,0,cli.stderr);
const reports=JSON.parse(cli.stdout);
for(const entry of SCENES)assert.equal(JSON.stringify(reports[entry]),JSON.stringify(loadAudit(entry).compute().lighting));
const strict=spawnSync(process.execPath,[require('node:path').join(__dirname,'audit-lighting.cjs'),'--strict'],{encoding:'utf8'});
assert.equal(strict.status,1,'Unmet project goals must fail strict mode');
console.log(`PASS ${cases} lighting regressions, shared CLI parity and strict goal exit`);
// Exercise the real CLI on a damaged source copy, not a mocked exitCode.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'planner-light-'));
try {
  for(const dir of ['js','tools'])fs.cpSync(path.join(root,dir),path.join(temporary,dir),{recursive:true});
  for(const entry of SCENES)fs.copyFileSync(path.join(root,entry),path.join(temporary,entry));
  fs.appendFileSync(path.join(temporary,'js/data/index.js'),"\nD.objects.find(o=>o.kind==='light').lightRadius=0;\n");
  const broken=spawnSync(process.execPath,[path.join(temporary,'tools/audit-lighting.cjs'),'--json'],{encoding:'utf8',maxBuffer:16*1024*1024});
  assert.ifError(broken.error);assert.equal(broken.status,1,broken.stderr);
  const report=JSON.parse(broken.stdout)['index.html'];
  assert.equal(report.status,'FAIL');assert(report.errors.some(e=>e.rule==='lighting-contract'));
  console.log('PASS real lighting CLI exits 1 for invalid radius in copied source');
} finally {fs.rmSync(temporary,{recursive:true,force:true});}
