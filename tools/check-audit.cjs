#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const {loadAudit, SCENES} = require('./lib/load-audit.cjs');
let cases = 0;
for (const entry of SCENES) {
  const {run, runFile, compute} = loadAudit(entry);
  runFile("js/runtime/formatters.js");
  const original = run('JSON.stringify(D)');
  const baseline = JSON.stringify(compute());
  assert.equal(compute().errors.length, 0, entry);
  assert.equal(compute().status, 'WARN', 'Incomplete item metadata must not become a full PASS');
  assert.equal(run("Object.hasOwn(D, 'validation')"), false, 'Legacy PASS lives only in designHistory');
  run('globalThis.original = D; globalThis.originalFields = {...D};');
  function reset() {
    run('for (const key of Object.keys(D)) delete D[key]; Object.assign(D, originalFields);');
  }
  function rejected(change, rule) {
    try {
      run(change);
      const report = compute();
      assert.equal(report.status, 'FAIL', `${entry}: ${rule}`);
      assert(report.errors.some(error => error.rule === rule), JSON.stringify(report.errors));
      run('globalThis.testElement = {dataset:{}, innerHTML:""};');
      run(`renderSceneAudit(${JSON.stringify(report)}, testElement)`);
      assert.equal(run('testElement.dataset.auditStatus'), 'FAIL');
      assert(!run('testElement.innerHTML').includes('class="badge good"'), 'Failed report cannot use the successful badge');
      cases++;
    } finally { reset(); }
  }
  rejected('D.backgrounds = []; D.validation = {status:"PASS", materialAudit:{status:"PASS"}};', 'closed-wall');
  rejected(`D.solids=[...D.solids,{...D.solids[0],mat:'AUDIT_UNKNOWN_MATERIAL'}]`, 'material-contract');
  rejected(`D.objects = D.objects.filter(object => object !== D.objects.find(o => o.kind === 'npc'));`, 'resident-markers');
  rejected(`D.objects = D.objects.map((object,i) => i ? object : {...object, w:0});`, 'object-contract');
  rejected(`const door = D.objects.find(object => object.kind === 'door');
    D.solids = [...D.solids,{x1:door.x,x2:door.x,y1:door.y,y2:door.y,mat:'gray_brick'}];`, 'object-overlap');
  if (['desert.html', 'underground.html'].includes(entry)) {
    rejected("D.objects=D.objects.map(object => object.kind==='water' ? {...object,w:19} : object);", 'pool-size');
    rejected("D.objects=D.objects.filter(object => object.kind!=='water');", 'pool-size');
    rejected("D.objects=D.objects.map(object => object.kind==='water' ? {...object,tiles:1} : object);", 'water-declaration');
  }
  if (entry === 'index.html') {
    rejected("D.rooms = D.rooms.map(room => room.id==='craft' ? {...room,x2:89} : room);", 'room-size');
    rejected("D.objects=D.objects.filter(object => object!==D.objects.find(o=>o.kind==='chest' && o.room==='craft' && o.storageFloor));", 'working-storage');
  }
  // A forged status alone cannot turn a warning into PASS, or affect any numbers.
  run('D.validation={status:"PASS"};');
  assert.equal(JSON.stringify(compute()), baseline);
  reset(); cases++;
  run('globalThis.testElement={dataset:{},innerHTML:""};');
  run(`renderSceneAudit(${baseline},testElement)`);
  assert.equal(run('testElement.dataset.auditStatus'), 'WARN');
  assert(run('testElement.innerHTML').includes('Цели проекта — не результаты аудита'));
  assert(!run('testElement.innerHTML').includes('class="badge good"'));
  // Error text and goals remain text, not executable HTML.
  run(`globalThis.report=JSON.parse(${JSON.stringify(baseline)});report.errors=[{message:'<img src=x onerror=alert(1)>'}];
    report.status='FAIL';renderSceneAudit(report,testElement);`);
  assert(!run('testElement.innerHTML').includes('<img'));
  cases++;
  assert.equal(run('JSON.stringify(D)'), original, 'Audits and regressions must not modify model data');
  console.log(`PASS ${entry}: shared computed audit, false PASS rejection, UI diagnostics and unchanged data`);
}
const cli = spawnSync(process.execPath, [path.join(__dirname, 'audit-scene.cjs'), '--json'], {encoding:'utf8', maxBuffer:16*1024*1024});
assert.ifError(cli.error);
assert.equal(cli.status, 0, cli.stderr);
const reports = JSON.parse(cli.stdout);
const textCli = spawnSync(process.execPath, [path.join(__dirname, 'audit-scene.cjs')], {encoding:'utf8', maxBuffer:16*1024*1024});
assert.ifError(textCli.error);
assert.equal(textCli.status, 0, textCli.stderr);
for (const report of Object.values(reports)) {
  for (const warning of report.warnings) assert(textCli.stdout.includes(warning.message), 'Default CLI must identify every incomplete record');
}

for (const entry of SCENES) assert.equal(JSON.stringify(reports[entry]), JSON.stringify(loadAudit(entry).compute()));
console.log(`PASS ${cases} computed-audit regressions and CLI parity`);

// Exercise the actual CLI exit path against a damaged copy, not a mocked exitCode.
const fs = require('node:fs'), os = require('node:os');
const root = path.resolve(__dirname, '..'), temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'planner-audit-'));
try {
  for (const dir of ['js', 'tools']) fs.cpSync(path.join(root, dir), path.join(temporary, dir), {recursive:true});
  for (const entry of SCENES) fs.copyFileSync(path.join(root, entry), path.join(temporary, entry));
  fs.writeFileSync(path.join(temporary, 'js/data/backgrounds/index.js'), 'export const BACKGROUNDS = [];\n');
  const failed = spawnSync(process.execPath, [path.join(temporary, 'tools/audit-scene.cjs'), '--json'], {encoding:'utf8', maxBuffer:16*1024*1024});
  assert.ifError(failed.error);
  assert.equal(failed.status, 1, failed.stderr);
  const damaged = JSON.parse(failed.stdout)['index.html'];
  assert.equal(damaged.status, 'FAIL');
  assert(damaged.errors.some(error => error.rule === 'closed-wall'));
  console.log('PASS strict CLI returns 1 on a damaged copy with original historical PASS');
} finally { fs.rmSync(temporary, {recursive:true, force:true}); }
