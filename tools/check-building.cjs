#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {loadScene,SCENES}=require('./lib/load-scene.cjs');
let cases=0;
for (const entry of SCENES) {
  const {run,runFile}=loadScene(entry);
  runFile('js/runtime/placement-contract.js');runFile('js/runtime/building-audit.js');
  runFile('js/runtime/model.js');
  assert(run(`(() => {
    const grid=buildingGrid(D,BLOCK_SPECS);
    for(let y=D.bounds.yMin;y<=D.bounds.yMax;y++) for(let x=D.bounds.xMin;x<=D.bounds.xMax;x++) {
      if((grid.foreground(x,y)||null)!==rectAt(D.solids,x,y))return false;
      if((grid.wall(x,y)||null)!==rectAt(D.backgrounds,x,y))return false;
    }
    return true;
  })()`),'Audit tile resolution must equal the actual runtime model everywhere');

  const original=run('JSON.stringify(D)');
  run(`globalThis.originalObjects=D.objects;globalThis.originalBackgrounds=D.backgrounds;
       globalThis.originalSolids=D.solids;globalThis.config=BUILDING_SCENES[D.sceneId];`);
  const audit=()=>run('auditBuilding(D,BLOCK_SPECS)');
  const baseline=audit();
  console.log(`${entry}: ${baseline.errors.length} existing construction diagnostics (not a design PASS)`);
  const rejects=(change,rule,id)=>{
    try {
      run(change);
      const errors=audit().errors;
      assert(errors.some(error=>error.rule===rule && (!id || error.id===id)),`${entry}: missed ${rule} / ${id}`);
      for(const error of errors) {
        assert.equal(error.scene,run('D.sceneId'));assert(error.message && error.rule);
        if(error.rule!=='geometry' && !['closed-room','configuration'].includes(error.rule))
          assert(Number.isInteger(error.x)&&Number.isInteger(error.y),JSON.stringify(error));
      }
      cases++;
    } finally {run('D.solids=originalSolids; D.backgrounds=originalBackgrounds; D.objects=originalObjects;');}
  };
  rejects('D.backgrounds=[]','closed-wall');
  rejects(`D.solids=[...D.solids,{x1:D.bounds.xMin,x2:D.bounds.xMin,y1:D.bounds.yMin,y2:D.bounds.yMin,mat:'AUDIT_UNKNOWN_MATERIAL'}];`,'geometry');

  run("globalThis.door=D.objects.find(o=>o.kind==='door');");
  rejects(`D.solids=[...D.solids,...[door.x-1,door.x+door.w].map(x=>({x1:x,x2:x,y1:door.y,y2:door.y+door.h-1,mat:'gray_brick'}))];`,'door-clearance');
  run("globalThis.hatch=D.objects.find(o=>o.kind==='hatch');");
  rejects(`D.solids=[...D.solids,{x1:hatch.x-1,x2:hatch.x-1,y1:hatch.y,y2:hatch.y,mat:'boreal_platform'}];`,'hatch-support');
  rejects(`D.solids=[...D.solids,{x1:hatch.x,x2:hatch.x+1,y1:hatch.y-1,y2:hatch.y-1,mat:'gray_brick'}];`,'hatch-platform');
  // Clip one wall tile out of every overlapping source region, preserving order.
  run(`globalThis.removeWall=(tx,ty)=>D.backgrounds.flatMap(r=>{
    if(!buildingContains(r,tx,ty))return [r];
    return [
      {...r,y2:ty-1},{...r,y1:ty+1},
      {...r,y1:ty,y2:ty,x2:tx-1},{...r,y1:ty,y2:ty,x1:tx+1}
    ].filter(q=>q.x1<=q.x2&&q.y1<=q.y2);
  });`);
  rejects('D.backgrounds=removeWall(hatch.x,hatch.y-1);','hatch-wall');
  rejects('D.backgrounds=removeWall(hatch.x,hatch.y-1);','platform-wall');
  run("globalThis.runConfig=config.platformRuns[0];");
  rejects(`D.solids=[...D.solids,{x1:runConfig.x,x2:runConfig.x,y1:runConfig.levels[1],y2:runConfig.levels[1],mat:'gray_brick'}];`,'platform-level');
  rejects(`D.solids=[...D.solids,{x1:runConfig.x,x2:runConfig.x,y1:runConfig.levels[0]+2,y2:runConfig.levels[0]+2,mat:'boreal_platform'}];`,'platform-level');
  run("globalThis.passage=config.passages[0];");
  rejects(`D.solids=[...D.solids,{x1:passage.x1,x2:passage.x1,y1:passage.y1,y2:passage.y1,mat:'gray_brick'}];`,'passage');
  rejects(`D.objects=[{...D.objects[0],w:1000000000}];`,'geometry');
  if(entry==='jungle.html') {
    // Original audit regression: support at Y23 remains while footprint X25/Y24 is blocked.
    run("globalThis.lantern=D.objects.find(o=>o.id==='JG_HUB_LANTERN_L');");
    assert(run('buildingGrid(D,BLOCK_SPECS).support(25,23)'));
    rejects(`D.solids=[...D.solids,{x1:25,x2:25,y1:24,y2:24,mat:'gray_brick'}];`,'object-overlap','JG_HUB_LANTERN_L');
    rejects(`D.solids=D.solids.flatMap(r=>{
      if(!buildingContains(r,25,23)) return [r];
      return [{...r,y2:22},{...r,y1:24},{...r,y1:23,y2:23,x2:24},{...r,y1:23,y2:23,x1:26}]
        .filter(q=>q.x1<=q.x2&&q.y1<=q.y2);
    });`,'ceiling-attachment','JG_HUB_LANTERN_L');
  }
  // Isolated positive fixture avoids accepting existing real design errors as PASS.
  run(`globalThis.fixture={sceneId:'fixture',bounds:{xMin:0,xMax:12,yMin:0,yMax:12},rooms:[],
    solids:[{x1:0,x2:12,y1:8,y2:8,mat:'gray_brick'},{x1:4,x2:6,y1:8,y2:8,mat:'boreal_platform'}],
    backgrounds:[],objects:[]};globalThis.emptyConfig={closedRooms:[],passages:[],platformRuns:[]};`);
  assert.equal(run('auditBuilding(fixture,BLOCK_SPECS,emptyConfig).errors.length'),0,'open external canopy');cases++;
  assert.equal(run('buildingGrid(fixture,BLOCK_SPECS).platform(5,8)'),true,'late material must win');cases++;
  run(`fixture.backgrounds=[{x1:4,x2:6,y1:7,y2:9,mat:'boreal_wall'}];`);
  assert.equal(run('auditBuilding(fixture,BLOCK_SPECS,emptyConfig).errors.length'),0,'wall continues behind platform');cases++;
  run(`fixture.objects=[{id:'torch',kind:'light',style:'white_torch',x:5,y:7,w:1,h:1}];`);
  assert.equal(run('auditBuilding(fixture,BLOCK_SPECS,emptyConfig).errors.length'),0,'passable wall-mounted torch');cases++;
  for (const mat of ['boreal_platform','bubble']) {
    run(`fixture.solids.push({x1:5,x2:5,y1:7,y2:7,mat:${JSON.stringify(mat)}});`);
    try { assert(run("auditBuilding(fixture,BLOCK_SPECS,emptyConfig).errors.some(e=>e.rule==='object-overlap' && e.id==='torch')")); cases++; }
    finally {run('fixture.solids.pop()');}
  }
  run("fixture.objects.push({id:'second-torch',kind:'light',style:'white_torch',x:5,y:7,w:1,h:1})");
  try { assert(run("auditBuilding(fixture,BLOCK_SPECS,emptyConfig).errors.some(e=>e.rule==='object-object-overlap' && e.id==='second-torch' && e.message.includes('torch'))")); cases++; }
  finally {run('fixture.objects.pop()');}
  // Non-physical planning annotations are allowed to overlap the same tile.
  run("fixture.objects.push({id:'annotation',kind:'zone',style:'spawn',x:5,y:7,w:1,h:1})");
  assert.equal(run('auditBuilding(fixture,BLOCK_SPECS,emptyConfig).errors.length'),0); cases++;
  run('fixture.objects.pop()');
  run(`fixture.objects=[{id:'hatch',kind:'hatch',style:'route',x:5,y:9,w:2,h:1}];
    fixture.solids.push({x1:4,x2:4,y1:9,y2:9,mat:'gray_brick'},{x1:7,x2:7,y1:9,y2:9,mat:'gray_brick'});`);
  assert.equal(run('auditBuilding(fixture,BLOCK_SPECS,emptyConfig).errors.length'),0,'correct platform and solid hatch anchors');cases++;
  assert.equal(run('JSON.stringify(D)'),original,'audit/mutations must not change scene data');
}
console.log(`PASS ${cases} construction regressions; use audit-building.cjs for strict real-design status`);

const {spawnSync}=require('node:child_process');
const cli=spawnSync(process.execPath,[require('node:path').join(__dirname,'audit-building.cjs'),'--json'],{encoding:'utf8'});
assert.equal(cli.error,undefined);
const computed=JSON.parse(cli.stdout);
assert.equal(cli.status,Object.values(computed).some(report=>report.errors.length)?1:0,'Strict CLI must fail for actual computed errors');
