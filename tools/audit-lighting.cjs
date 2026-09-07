#!/usr/bin/env node
"use strict";
const {loadAudit,SCENES}=require("./lib/load-audit.cjs");
const reports=Object.fromEntries(SCENES.map(entry=>[entry,loadAudit(entry).compute().lighting]));
if(process.argv.includes('--json')) console.log(JSON.stringify(reports,null,2));
else for(const [entry,report] of Object.entries(reports)){
  console.log(`${report.status} ${entry}: project point-source coverage, not game brightness`);
  for(const zone of report.zones)console.log(`  ${zone.status} ${zone.id}: ${zone.coveragePercent}%; sources ${zone.influencingSources.join(', ') || 'none'}; dark samples ${zone.darkTiles.map(p=>`X${p.x} Y${p.y}`).join(', ') || 'none'}`);
  for(const item of [...report.errors,...report.warnings])console.log(`  ${item.rule} ${item.id ?? ''} X${item.x} Y${item.y}: ${item.message}`);
}
process.exitCode=Object.values(reports).some(report=>report.status==='FAIL'||report.status==='NOT_RUN'||
  (process.argv.includes('--strict') && report.status!=='PASS'))?1:0;
