#!/usr/bin/env node
'use strict';
const {loadScene} = require('./lib/load-scene.cjs');
const {auditSpawnSurfaces, formatSpawnReport, WIKI_145_RANGES} = require('./lib/spawn-surfaces.mjs');

function parseOptions(args) {
  const options = {players: [], excluded: [], ranges: null};
  let json = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') json = true;
    else if (arg === '--player') {
      const value = args[++i];
      if (!/^-?\d+,-?\d+$/.test(value ?? '')) throw new Error('--player requires X,Y integer tile coordinates');
      const [x, y] = value.split(',').map(Number);
      options.players.push({x, y});
    } else if (arg === '--exclude') {
      const id = args[++i];
      if (!id || id.startsWith('--')) throw new Error('--exclude requires a target ID');
      options.excluded.push(id);
    } else if (arg === '--profile' && args[++i] === 'wiki-1.4.5') options.ranges = WIKI_145_RANGES;
    else throw new Error(`Unknown argument or profile: ${arg}`);
  }
  if (!options.players.length) delete options.players;
  return {options, json};
}
function main(args = process.argv.slice(2)) {
  try {
    const {options, json} = parseOptions(args);
    const {planner: {D, BLOCK_SPECS, WALL_SPECS}} = loadScene('index.html');
    const report = auditSpawnSurfaces(D, BLOCK_SPECS, WALL_SPECS, options);
    console.log(json ? JSON.stringify(report, null, 2) : formatSpawnReport(report));
    return 0; // Successful DIAGNOSTIC execution, not a spawn-safety PASS.
  } catch (error) {
    console.error(`ERROR spawn diagnostics: ${error.message}`);
    return 1;
  }
}
if (require.main === module) process.exitCode = main();
module.exports = {parseOptions};
