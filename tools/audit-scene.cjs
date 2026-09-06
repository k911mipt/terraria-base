#!/usr/bin/env node
'use strict';
const {loadAudit, SCENES} = require('./lib/load-audit.cjs');
const reports = Object.fromEntries(SCENES.map(entry => [entry, loadAudit(entry).compute()]));
if (process.argv.includes('--json')) console.log(JSON.stringify(reports, null, 2));
else for (const [entry, report] of Object.entries(reports)) {
  console.log(`${report.status} ${entry}: ${report.errors.length} errors, ${report.warnings.length} incomplete records`);
  for (const warning of report.warnings) console.log(`  WARN ${warning.rule}: ${warning.message}`);
  for (const error of report.errors) console.log(`  ${error.rule} ${error.id ?? ''}: ${error.message}`);
}
process.exitCode = Object.values(reports).some(report => report.status === 'FAIL') ? 1 : 0;
