#!/usr/bin/env node
'use strict';
const {loadScene,SCENES}=require('./lib/load-scene.cjs');
const reports={};
for(const entry of SCENES) {
  const {run,runFile}=loadScene(entry);
  runFile('js/runtime/validation.js');
  runFile('js/runtime/building-audit.js');
  reports[entry]=run(`(() => {
    const report=auditBuilding(D,BLOCK_SPECS);
    for(const message of validateUsedMaterialSpecs(D,BLOCK_SPECS,WALL_SPECS,MAT,WALL))
      report.errors.push({scene:D.sceneId,rule:'material-contract',x:null,y:null,id:null,message});
    return report;
  })()`);
}
if (process.argv.includes('--json')) console.log(JSON.stringify(reports,null,2));
else for(const [entry,report] of Object.entries(reports)) {
  console.log(`${report.errors.length ? 'FAIL' : 'PASS'} ${entry}: ${report.errors.length} construction diagnostics`);
  for(const error of report.errors) console.log(`  ${error.rule} ${error.id} X${error.x} Y${error.y}: ${error.message}`);
}
process.exitCode=Object.values(reports).some(report=>report.errors.length) ? 1 : 0;
