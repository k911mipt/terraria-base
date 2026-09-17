#!/usr/bin/env node
'use strict';
const {loadAudit, SCENES} = require('./lib/load-audit.cjs');
const {auditSpawnSurfaces, formatSpawnReport} = require('./lib/spawn-surfaces.mjs');
const includeSpawn = process.argv.includes('--spawn');
const reports = Object.fromEntries(SCENES.map(entry => {
  const loaded = loadAudit(entry), report = loaded.compute();
  if (includeSpawn && entry === 'index.html') {
    const {D, BLOCK_SPECS, WALL_SPECS} = loaded.planner;
    try { report.spawnDiagnostics = auditSpawnSurfaces(D, BLOCK_SPECS, WALL_SPECS); }
    catch (error) {
      report.status = 'FAIL';
      report.errors.push({rule: 'spawn-diagnostic-input', message: error.message});
    }
  }
  return [entry, report];
}));
if (process.argv.includes('--json')) console.log(JSON.stringify(reports, null, 2));
else for (const [entry, report] of Object.entries(reports)) {
  console.log(`${report.status} ${entry}: ${report.errors.length} errors, ${report.warnings.length} warnings`);
  if (report.spawnDiagnostics) console.log(formatSpawnReport(report.spawnDiagnostics));
  for (const warning of report.warnings) console.log(`  WARN ${warning.rule}: ${warning.message}`);
  for (const error of report.errors) console.log(`  ${error.rule} ${error.id ?? ''}: ${error.message}`);
}
process.exitCode = Object.values(reports).some(report => report.status === 'FAIL') ? 1 : 0;
