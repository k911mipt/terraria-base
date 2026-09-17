import { buildingGrid, buildingContains, buildingObjectContains } from '../../js/runtime/building-audit.js';
import { validateUsedWallSpecs } from '../../js/runtime/validation.js';

// Diagnostic only: these are inspected surfaces, not approved construction edits.
export const MAIN_SPAWN_SURFACES = [
  {id: 'npc-roof-left', role: 'unwanted', x1: 9, x2: 44, y: 27},
  {id: 'npc-roof-right', role: 'unwanted', x1: 91, x2: 126, y: 27},
  {id: 'combat-street', role: 'allowed', x1: 1, x2: 134, y: 54},
];

// Opt-in reference, NOT verified against the 1.4.5.6 executable. See docs/spawn-surfaces.md.
export const WIKI_145_RANGES = {
  name: 'wiki-1.4.5',
  spawn: {west: 84, east: 83, up: 52, down: 51},
  safe: {west: 62, east: 61, up: 39, down: 38},
};
const DIRECTIONS = ['west', 'east', 'up', 'down'];
const inWindow = (player, point, window) => point.x >= player.x - window.west &&
  point.x <= player.x + window.east && point.y >= player.y - window.up && point.y <= player.y + window.down;

function checkOptions(scene, targets, players, ranges, excluded) {
  if (!Array.isArray(players) || players.length < 1 || players.length > 2 ||
      players.some(p => !p || !Number.isSafeInteger(p.x) || !Number.isSafeInteger(p.y)))
    throw new Error('Specify one or two players with integer top-left tile coordinates');
  if (ranges !== null) {
    if (!ranges || typeof ranges.name !== 'string' || !ranges.name.trim() ||
        ['spawn', 'safe'].some(key => !ranges[key] || DIRECTIONS.some(d =>
          !Number.isSafeInteger(ranges[key][d]) || ranges[key][d] < 0)) ||
        DIRECTIONS.some(d => ranges.safe[d] > ranges.spawn[d]))
      throw new Error('Invalid range profile');
    for (const p of players) for (const extent of [ranges.spawn, ranges.safe])
      if (![p.x - extent.west, p.x + extent.east, p.y - extent.up, p.y + extent.down].every(Number.isSafeInteger))
        throw new Error('Range coordinates overflow');
  }
  const ids = new Set();
  if (!Array.isArray(targets) || !targets.length) throw new Error('No target surfaces');
  for (const t of targets) {
    if (!t || typeof t.id !== 'string' || !t.id.trim() || ids.has(t.id) ||
        !['allowed', 'unwanted'].includes(t.role) || ![t.x1, t.x2, t.y].every(Number.isSafeInteger) ||
        t.x1 > t.x2 || !buildingContains({x1: scene.bounds.xMin, x2: scene.bounds.xMax,
          y1: scene.bounds.yMin, y2: scene.bounds.yMax}, t.x1, t.y) ||
        t.x2 > scene.bounds.xMax) throw new Error('Invalid or duplicate target surface');
    ids.add(t.id);
  }
  if (!Array.isArray(excluded) || excluded.some(id => !ids.has(id)) || new Set(excluded).size !== excluded.length)
    throw new Error('Unknown or duplicate excluded surface');
}

// Coordinate arithmetic is tile-based. Shape-, platform-, liquid- and object-specific
// game rules are deliberately not inferred from a procedural sprite or room label.
export function auditSpawnSurfaces(scene, blockSpecs, wallSpecs, options = {}) {
  const {players = [{x: 67, y: 51}], ranges = null,
    targets = MAIN_SPAWN_SURFACES, excluded = []} = options;
  if (scene.sceneId !== 'main' && options.targets === undefined)
    throw new Error('Default spawn targets are defined only for the main scene');
  const grid = buildingGrid(scene, blockSpecs);
  const wallErrors = validateUsedWallSpecs(scene, wallSpecs);
  if (wallErrors.length) throw new Error(wallErrors.join('\n'));
  checkOptions(scene, targets, players, ranges, excluded);
  const bounds = scene.bounds;
  const known = (x, y) => x >= bounds.xMin && x <= bounds.xMax && y >= bounds.yMin && y <= bounds.yMax;
  const liquidAt = (x, y) => scene.objects.find(o =>
    ['water', 'honey', 'lava', 'honey_bubble'].includes(o.kind) && buildingObjectContains(o, x, y));
  const uncertainTile = (x, y) => {
    const t = grid.foreground(x, y);
    return t && (!grid.solid(x, y) || Boolean(t.shape) || t.inactive || t.actuated);
  };
  const fullBlock = (x, y) => grid.solid(x, y) && !uncertainTile(x, y);

  function geometryAt(x, y) {
    if (!grid.foreground(x, y)) return {geometry: 'no-ground', reason: 'No foreground support at this coordinate'};
    if (!fullBlock(x, y)) return {geometry: 'unknown', reason: 'Platform, shaped or passable support needs game verification'};
    let unknown = false;
    for (let cy = y - 3; cy < y; cy++) for (let cx = x - 1; cx <= x; cx++) {
      if (!known(cx, cy)) { unknown = true; continue; }
      if (fullBlock(cx, cy)) return {geometry: 'blocked', reason: 'Full block in the reference 2x3 clearance'};
      if (uncertainTile(cx, cy) || liquidAt(cx, cy)) unknown = true;
    }
    return unknown ? {geometry: 'unknown', reason: 'Clearance includes unknown boundary, liquid or non-full tile'}
      : {geometry: 'candidate', reason: 'Full support with empty reference 2x3 clearance'};
  }

  function rangeAt(x, y) {
    if (ranges === null) return {range: 'not-checked', seed: null};
    // This is ONLY the supplied safe-window approximation, not the game's final
    // pixel/hitbox check. Every active player contributes an exclusion window.
    if (players.some(p => inWindow(p, {x, y}, ranges.safe)))
      return {range: 'inside-reference-safe-window', seed: null};
    let boundaryUnknown = false, routeUnknown = false, within = false;
    for (const [index, player] of players.entries()) {
      if (!inWindow(player, {x, y}, ranges.spawn)) continue;
      within = true;
      const top = player.y - ranges.spawn.up;
      // Walk UP from the support. A full block interrupts the downward route
      // from every seed above it; a background wall rejects only that seed.
      let uncertainRoute = false, interrupted = false;
      for (let sy = y - 1; sy >= Math.max(top, bounds.yMin); sy--) {
        if (fullBlock(x, sy)) { interrupted = true; break; }
        if (uncertainTile(x, sy) || liquidAt(x, sy)) uncertainRoute = true;
        const wall = grid.wall(x, sy);
        if (wall && wallSpecs[wall.mat].safe) continue;
        if (!uncertainRoute) return {range: 'reference-candidate', seed: {player: index + 1, x, y: sy}};
        routeUnknown = true;
      }
      if (!interrupted && top < bounds.yMin) boundaryUnknown = true;
    }
    return {range: boundaryUnknown || routeUnknown ? 'unknown-seed-route'
      : within ? 'no-seed-in-reference-window' : 'outside-reference-spawn-window', seed: null};
  }

  const surfaces = targets.map(target => {
    if (excluded.includes(target.id)) return {...target, excluded: true, reason: 'Explicit caller exclusion; not inspected', runs: []};
    const runs = [];
    for (let x = target.x1; x <= target.x2; x++) {
      const geometry = geometryAt(x, target.y);
      const cell = {...geometry, ...(['candidate', 'unknown'].includes(geometry.geometry)
        ? rangeAt(x, target.y) : {range: 'not-applicable', seed: null})};
      // Group adjacent tiles with identical findings; keep one representative
      // seed per run, not a claim that every tile has the same seed coordinate.
      const previous = runs.at(-1);
      if (previous && previous.geometry === cell.geometry && previous.range === cell.range && previous.reason === cell.reason)
        previous.x2 = x;
      else runs.push({x1: x, x2: x, y: target.y, ...cell});
    }
    return {...target, excluded: false, runs};
  });
  return {
    version: '1.4.5.6', status: 'NOT_VERIFIED', players: structuredClone(players),
    rangeProfile: structuredClone(ranges), surfaces,
    limitations: [
      'Diagnostic candidates, never a guarantee of enemy spawning or its absence.',
      'Ranges are not checked by default. The opt-in wiki-1.4.5 profile is not executable-verified for 1.4.5.6.',
      'Tile coordinates denote the top-left player hitbox tile; final pixel/hitbox exclusions are not simulated.',
      'Only listed surfaces and known scene tiles are inspected; scene bounds are NOT world borders.',
      'Platform support, slopes, liquids, actuated terrain and invasion-specific, flying or teleporting NPC rules need game verification.',
      'Town NPC counts, torches and player-made walls at the landing tile alone do not prove spawn prevention.',
    ],
  };
}

export function formatSpawnReport(report) {
  const lines = [`${report.status} spawn surfaces / Terraria ${report.version} / profile: ${report.rangeProfile?.name ?? 'none'}`];
  for (const s of report.surfaces) {
    lines.push(`${s.id} [${s.role}] X${s.x1}..${s.x2} Y${s.y}${s.excluded ? ' EXCLUDED: ' + s.reason : ''}`);
    for (const r of s.runs) lines.push(`  X${r.x1}..${r.x2} Y${r.y}: ${r.geometry}; ${r.range}; ${r.reason}` +
      (r.seed ? `; example seed P${r.seed.player} X${r.seed.x} Y${r.seed.y}` : ''));
  }
  return [...lines, ...report.limitations.map(s => 'LIMIT: ' + s)].join('\n');
}
