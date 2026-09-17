#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {loadScene, ROOT} = require('./lib/load-scene.cjs');
const {auditSpawnSurfaces, MAIN_SPAWN_SURFACES, WIKI_145_RANGES} = require('./lib/spawn-surfaces.mjs');
const {parseOptions} = require('./audit-spawn-surfaces.cjs');
const {planner: {D, BLOCK_SPECS, WALL_SPECS}} = loadScene('index.html');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS ' + name); }
const before = JSON.stringify({D, BLOCK_SPECS, WALL_SPECS, MAIN_SPAWN_SURFACES, WIKI_145_RANGES});
const report = auditSpawnSurfaces(D, BLOCK_SPECS, WALL_SPECS);
const at = (report, id, x) => report.surfaces.find(s => s.id === id).runs.find(r => r.x1 <= x && r.x2 >= x);
const fixture = () => ({sceneId: 'fixture', title: 'spawn fixture', bounds: {xMin: 0, xMax: 40, yMin: 0, yMax: 30}, rooms: [],
  solids: [{x1: 0, x2: 40, y1: 20, y2: 20, mat: 'gray_brick'}], backgrounds: [], objects: []});
const target = {id: 'roof', role: 'unwanted', x1: 14, x2: 24, y: 20};
const ranges = {name: 'synthetic-test-only', spawn: {west: 12, east: 12, up: 12, down: 12},
  safe: {west: 3, east: 3, up: 3, down: 3}};
const opts = {targets: [target], players: [{x: 10, y: 20}], ranges};
const audit = (s, overrides = {}) => auditSpawnSurfaces(s, BLOCK_SPECS, WALL_SPECS, {...opts, ...overrides});
const tile = (s, x, y, mat = 'gray_brick', extra = {}) => s.solids.push({x1: x, x2: x, y1: y, y2: y, mat, ...extra});

test('known roof ranges and permitted street are inspected explicitly', () => {
  assert.deepEqual(report.surfaces.map(s => [s.id, s.x1, s.x2, s.y, s.role]), [
    ['npc-roof-left', 9, 44, 27, 'unwanted'], ['npc-roof-right', 91, 126, 27, 'unwanted'], ['combat-street', 1, 134, 54, 'allowed']]);
  for (const id of ['npc-roof-left', 'npc-roof-right', 'combat-street'])
    assert(report.surfaces.find(s => s.id === id).runs.some(r => r.geometry === 'candidate'));
  assert.equal(at(report, 'npc-roof-left', 38).geometry, 'unknown');
});
test('default is NOT_VERIFIED with no silently assumed version-specific distances', () => {
  assert.equal(report.status, 'NOT_VERIFIED'); assert.equal(report.rangeProfile, null);
  assert.equal(at(report, 'npc-roof-left', 12).range, 'not-checked');
});
test('first valid seed and ground use the same effective geometry', () => {
  const r = at(audit(fixture()), 'roof', 15);
  assert.equal(r.geometry, 'candidate'); assert.equal(r.range, 'reference-candidate');
  assert.equal(r.seed.player, 1); assert.equal(r.seed.y, 19);
});
test('player movement changes range without moving the construction', () => {
  const scene = fixture(), original = JSON.stringify(scene);
  assert.equal(at(audit(scene), 'roof', 20).range, 'reference-candidate');
  assert.equal(at(audit(scene, {players: [{x: 20, y: 20}]}), 'roof', 20).range, 'inside-reference-safe-window');
  assert.equal(at(audit(scene, {players: [{x: -20, y: 20}]}), 'roof', 20).range, 'outside-reference-spawn-window');
  assert.equal(JSON.stringify(scene), original);
});
test('second player contributes both spawn opportunities and safe-window exclusions', () => {
  const scene = fixture();
  assert.equal(at(audit(scene), 'roof', 24).range, 'outside-reference-spawn-window');
  const pair = {players: [{x: -20, y: 20}, {x: 35, y: 20}]};
  assert.equal(at(audit(scene, pair), 'roof', 24).range, 'reference-candidate');
  const near = audit(scene, {players: [{x: 10, y: 20}, {x: 20, y: 20}]});
  assert.equal(at(near, 'roof', 20).range, 'inside-reference-safe-window');
});
test('a high seed does not bypass the reference safe-window check on its landing', () => {
  const scene = fixture(), players = [{x: 20, y: 20}];
  // X20/Y16 is an empty seed outside this player's safe window (Y17..23),
  // but the first full support X20/Y20 remains inside that window.
  assert.equal(at(audit(scene, {players}), 'roof', 20).range, 'inside-reference-safe-window');
});
test('support below the search window is rejected even with an in-window seed above it', () => {
  const scene = fixture();
  // P1 Y7 has a search bottom of Y19. The empty seed Y18 is inside;
  // its first full support Y20 is below the documented ground-search limit.
  assert.equal(at(audit(scene, {players: [{x: 10, y: 7}]}), 'roof', 20).range,
    'outside-reference-spawn-window');
  // Moving the player down one tile brings the same support onto the boundary.
  assert.equal(at(audit(scene, {players: [{x: 10, y: 8}]}), 'roof', 20).range,
    'reference-candidate');
});
test('support on the top search boundary has no in-window seed above it', () => {
  const scene = fixture();
  assert.equal(at(audit(scene, {players: [{x: 10, y: 32}]}), 'roof', 20).range,
    'no-seed-in-reference-window');
  const r = at(audit(scene, {players: [{x: 10, y: 31}]}), 'roof', 20);
  assert.equal(r.range, 'reference-candidate'); assert.equal(r.seed.y, 19);
});
test('inclusion of spawn and safe boundary coordinates is explicit', () => {
  const scene = fixture();
  assert.equal(at(audit(scene), 'roof', 22).range, 'reference-candidate');
  assert.equal(at(audit(scene), 'roof', 23).range, 'outside-reference-spawn-window');
  const r = audit(scene, {players: [{x: 17, y: 20}]});
  assert.equal(at(r, 'roof', 20).range, 'inside-reference-safe-window');
  assert.equal(at(r, 'roof', 21).range, 'reference-candidate');
});
for (const [dx, dy] of [[-1, -3], [0, -3], [-1, -2], [0, -2], [-1, -1], [0, -1]]) {
  test(`clearance blocks at offset ${dx},${dy}; removing restores candidate`, () => {
    const scene = fixture(); tile(scene, 20 + dx, 20 + dy);
    assert.equal(at(audit(scene), 'roof', 20).geometry, 'blocked'); scene.solids.pop();
    assert.equal(at(audit(scene), 'roof', 20).geometry, 'candidate');
  });
}
test('right-of-support block is outside the asymmetric reference clearance', () => {
  const scene = fixture(); tile(scene, 21, 19);
  assert.equal(at(audit(scene), 'roof', 20).geometry, 'candidate');
});
test('background at landing is not a spawn-proof roof', () => {
  const scene = fixture(); scene.backgrounds.push({x1: 14, x2: 24, y1: 17, y2: 20, mat: 'boreal_wall'});
  const r = at(audit(scene), 'roof', 20);
  assert.equal(r.range, 'reference-candidate'); assert.equal(r.seed.y, 16);
});
test('fully screened seed column differs from merely wall-covered landing', () => {
  const scene = fixture(); scene.backgrounds.push({x1: 14, x2: 24, y1: 0, y2: 19, mat: 'boreal_wall'});
  assert.equal(at(audit(scene), 'roof', 20).range, 'no-seed-in-reference-window');
});
test('unsafe wall leaves seed eligible', () => {
  const scene = fixture(); scene.backgrounds.push({x1: 14, x2: 24, y1: 0, y2: 19, mat: 'boreal_wall'});
  const specs = structuredClone(WALL_SPECS); specs.boreal_wall.safe = false;
  assert.equal(at(auditSpawnSurfaces(scene, BLOCK_SPECS, specs, opts), 'roof', 20).range, 'reference-candidate');
});
test('overhead terrain interrupts seeds from above but not seeds below it', () => {
  const scene = fixture(); tile(scene, 20, 15);
  scene.backgrounds.push({x1: 14, x2: 24, y1: 16, y2: 19, mat: 'boreal_wall'});
  assert.equal(at(audit(scene), 'roof', 20).range, 'no-seed-in-reference-window');
  scene.backgrounds = [];
  assert.equal(at(audit(scene), 'roof', 20).range, 'reference-candidate');
});
test('unknown geometry above scene bounds is not silently empty or sealed', () => {
  const scene = fixture(); scene.bounds.yMin = 17;
  scene.backgrounds.push({x1: 14, x2: 24, y1: 17, y2: 19, mat: 'boreal_wall'});
  assert.equal(at(audit(scene), 'roof', 20).range, 'unknown-seed-route');
  scene.bounds.yMin = 19; scene.backgrounds[0].y1 = 19;
  assert.equal(at(audit(scene), 'roof', 20).geometry, 'unknown');
});
test('last-write-wins platforms and slopes remain unknown, not solid spawn-proofing', () => {
  const scene = fixture(); tile(scene, 20, 20, 'boreal_platform');
  assert.equal(at(audit(scene), 'roof', 20).geometry, 'unknown');
  tile(scene, 20, 20);
  assert.equal(at(audit(scene), 'roof', 20).geometry, 'candidate');
  tile(scene, 20, 20, 'gray_brick', {shape: 'half_bottom'});
  assert.equal(at(audit(scene), 'roof', 20).geometry, 'unknown');
});
for (const kind of ['water', 'honey', 'lava', 'honey_bubble']) test(`liquid ${kind} is reported without guessing amount or enemy immunity`, () => {
  const scene = fixture(); scene.objects.push({id: 'liquid', x: 20, y: 19, w: 1, h: 1, kind});
  assert.equal(at(audit(scene), 'roof', 20).geometry, 'unknown');
});
test('torches and NPC markers are never an anti-spawn proof', () => {
  const scene = fixture(), plain = audit(scene);
  scene.objects.push({id: 'torch', x: 20, y: 19, w: 1, h: 1, kind: 'light'}, {id: 'npc', x: 21, y: 17, w: 2, h: 3, kind: 'npc'});
  assert.deepEqual(audit(scene), plain);
});
test('empty support is not a candidate; explicit exclusion stays in the report', () => {
  const scene = fixture(); scene.solids = [];
  assert.equal(at(audit(scene), 'roof', 20).geometry, 'no-ground');
  const r = audit(scene, {excluded: ['roof']});
  assert.equal(r.surfaces[0].excluded, true); assert.deepEqual(r.surfaces[0].runs, []);
  assert.equal(r.status, 'NOT_VERIFIED');
});
for (const change of [{players: []}, {players: [{x: NaN, y: 0}]}, {players: [{x: 1.5, y: 20}]},
  {players: Array(3).fill({x: 1, y: 20})}, {players: [{x: Number.MAX_SAFE_INTEGER, y: 20}]},
  {ranges: {}}, {ranges: {...ranges, safe: {...ranges.safe, up: 13}}},
  {targets: []}, {targets: [target, target]}, {targets: [{...target, y: 31}]},
  {targets: [{...target, x2: 41}]}, {excluded: ['missing']}, {excluded: ['roof', 'roof']}]) {
  test('invalid input is an error: ' + JSON.stringify(change), () => assert.throws(() => audit(fixture(), change)));
}
test('malformed wall metadata and materials cannot hide as clean geometry', () => {
  const scene = fixture(); tile(scene, 20, 20, 'UNKNOWN'); assert.throws(() => audit(scene), /Unknown material/);
  scene.solids.pop(); scene.backgrounds.push({x1: 14, x2: 24, y1: 19, y2: 19, mat: 'boreal_wall'});
  const specs = structuredClone(WALL_SPECS); delete specs.boreal_wall.safe;
  assert.throws(() => auditSpawnSurfaces(scene, BLOCK_SPECS, specs, opts), /safe/);
});
test('wiki profile is optional and the version remains exactly 1.4.5.6', () => {
  const r = auditSpawnSurfaces(D, BLOCK_SPECS, WALL_SPECS, {players: [{x: 9, y: 51}], ranges: WIKI_145_RANGES});
  assert.equal(r.rangeProfile.spawn.up, 52); assert.equal(r.status, 'NOT_VERIFIED');
  assert.equal(r.version, '1.4.5.6'); assert(r.limitations.some(s => s.includes('not executable-verified')));
});
test('CLI options reject partial/malformed values and unrecognized profiles', () => {
  for (const args of [['--player'], ['--player', 'x,1'], ['--profile', '1.4.5.7'], ['--exclude'], ['--wat']])
    assert.throws(() => parseOptions(args));
  assert.deepEqual(parseOptions(['--player', '-9,51', '--player', '126,51']).options.players, [{x: -9, y: 51}, {x: 126, y: 51}]);
});
test('actual diagnostic CLI preserves NOT_VERIFIED and rejects misuse with nonzero exit', () => {
  for (const args of [['--json'], ['--json', '--profile', 'wiki-1.4.5', '--player', '9,51', '--player', '126,51']]) {
    const result = spawnSync(process.execPath, ['tools/audit-spawn-surfaces.cjs', ...args], {cwd: ROOT, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).status, 'NOT_VERIFIED');
  }
  const bad = spawnSync(process.execPath, ['tools/audit-spawn-surfaces.cjs', '--exclude', 'missing'], {cwd: ROOT, encoding: 'utf8'});
  assert.equal(bad.status, 1); assert.match(bad.stderr, /ERROR/);
});
test('optional combined audit contains the same diagnostic without changing construction status', () => {
  const plain = spawnSync(process.execPath, ['tools/audit-scene.cjs', '--json'], {cwd: ROOT, encoding: 'utf8'});
  const withSpawn = spawnSync(process.execPath, ['tools/audit-scene.cjs', '--json', '--spawn'], {cwd: ROOT, encoding: 'utf8'});
  assert.equal(plain.status, 0, plain.stderr); assert.equal(withSpawn.status, 0, withSpawn.stderr);
  const a = JSON.parse(plain.stdout), b = JSON.parse(withSpawn.stdout);
  assert.deepEqual(b['index.html'].spawnDiagnostics, report);
  delete b['index.html'].spawnDiagnostics; assert.deepEqual(b, a);
});
test('audit and tests did not change scene data, specs or profiles', () => {
  assert.equal(JSON.stringify({D, BLOCK_SPECS, WALL_SPECS, MAIN_SPAWN_SURFACES, WIKI_145_RANGES}), before);
});
console.log(`PASS ${checks} spawn diagnostic regressions; no executable-level spawn-safety claim`);
