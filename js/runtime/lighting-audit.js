import { auditBuilding, buildingGrid } from './building-audit.js';
import { roomForObject } from './core.js';
import { escHtml } from './formatters.js';

// Project coverage by room-local point sources; not Terraria's light engine.
// Conservative type defaults. Existing larger radii are pinned below, not inferred
// from the current data and not increased to make newly audited rooms pass.
export const LIGHT_RADII = {
  light: 7, lantern_warm: 7, star_light: 8, pink_torch: 7, ice_torch: 7,
  white_torch: 7, red_torch: 7, purple_torch: 7, ultrabright_torch: 9,
  mushroom: 7, green_torch: 7, glass_lantern: 8, ice_lantern: 7,
  copper_chandelier: 11, crystal_chandelier: 11, crystal_candelabra: 6,
  jungle_lantern: 11, jungle_torch: 8, painter_lantern: 11,
  painter_torch: 7, tiki_lantern: 12, tiki_torch: 8,
};
export const LIGHT_RADIUS_EXCEPTIONS = new Map([
  ['underground', 'UG_GOBLIN_GREEN_TORCH', 'green_torch', 10],
  ['underground', 'UG_MECH_CHANDELIER', 'copper_chandelier', 12],
  ['underground', 'UG_PYLON_ICE_LANTERN', 'ice_lantern', 9],
  ['underground', 'UG_FISH_LIGHT_L', 'ice_lantern', 10],
  ['underground', 'UG_FISH_LIGHT_R', 'ice_lantern', 10],
  ['jungle', 'JG_HUB_LANTERN_L', 'jungle_lantern', 12],
  ['jungle', 'JG_HUB_LANTERN_R', 'jungle_lantern', 12],
  ['jungle', 'JG_SHAFT_LIGHT_1', 'jungle_torch', 10],
  ['jungle', 'JG_SHAFT_LIGHT_2', 'jungle_torch', 10],
  ['jungle', 'JG_SHAFT_LIGHT_3', 'jungle_torch', 10],
].map(([scene, id, style, radius]) => [`${scene}:${id}`, {
  style, radius,
  reason: 'Сохранён прежний проектный радиус из 21ce3f3; это геометрическая эвристика, не игровая яркость.',
}]));
export const LIGHT_KINDS = new Set(['light', 'campfire', 'heart_lantern', 'star_bottle']);
export const EXTRA_LIGHTING_ZONES = {
  main: [
    ['left_tower', 1, 14, 7, 67, 1],
    ['forest_npc', 9, 28, 31, 33, 3],
    ['transport', 9, 35, 31, 40, 1],
    ['p1', 33, 28, 44, 40, 2],
    ['craft', 46, 7, 89, 40, 2],
    ['greenhouse', 46, -2, 89, 5, 2],
    ['p2', 91, 28, 102, 40, 2],
    ['clinic_npc', 104, 28, 126, 33, 3],
    ['prebattle', 104, 35, 126, 40, 1],
    ['mushroom', 104, 8, 126, 26, 2],
    ['right_tower', 128, 14, 134, 67, 1],
    ['arena', 1, 42, 134, 53, 2],
    ['boss_left', -199, 3, -34, 53, 2],
    ['museum', 9, 55, 126, 67, 1],
    ['pit_l', -18, 55, -1, 67, 1],
    ['pit_r', 136, 55, 153, 67, 1],
  ],
  desert: [
    ['desert_npc_left', 19, 9, 27, 19, 1],
    ['desert_hub', 29, 7, 53, 19, 2],
    ['desert_npc_right', 55, 9, 63, 19, 1],
    ['desert_shaft', 49, 21, 54, 69, 2],
    ['desert_service', 29, 21, 46, 26, 2],
  ],
};
export const EXISTING_LIGHTING_ZONE_IDS = {
  underground: ['mechanic_room', 'goblin_room', 'princess_room', 'fishing_floor'],
  jungle: ['dryad_room', 'pylon_hub', 'painter_loft', 'witch_room', 'jungle_shaft'],
};

export function lightingZonesFor(scene) {
  if (Object.hasOwn(EXTRA_LIGHTING_ZONES, scene.sceneId))
    return EXTRA_LIGHTING_ZONES[scene.sceneId].map(([room, x1, y1, x2, y2, minSources]) => ({
      id: room, room, x1, y1, x2, y2, minSources, minCoverage: 1,
      name: scene.rooms.find(item => item.id === room)?.name || room,
    }));
  return scene.lightingZones;
}

export function lightingRadius(sceneId, source) {
  const fallback = source.kind === 'light'
    ? (Object.hasOwn(LIGHT_RADII, source.style) ? LIGHT_RADII[source.style] : null)
    : ({campfire: 8, heart_lantern: 8, star_bottle: 8})[source.kind];
  const exception = LIGHT_RADIUS_EXCEPTIONS.get(`${sceneId}:${source.id}`);
  if (exception && (source.kind !== 'light' || exception.style !== source.style ||
      typeof exception.reason !== 'string' || !exception.reason.trim()))
    throw new Error('Invalid or stale light-radius exception');
  const radius = exception?.radius ?? fallback;
  if (!Number.isFinite(radius) || radius <= 0 || radius > 32)
    throw new Error(`Unknown or invalid light radius for ${source.kind}/${source.style}`);
  if (Object.hasOwn(source, 'lightRadius') && source.lightRadius !== radius)
    throw new Error(`lightRadius must equal the declared project radius ${radius}; got ${source.lightRadius}`);
  return {radius, reason: exception?.reason || 'Консервативный радиус типа источника.'};
}

export function auditLighting(scene, blockSpecs, zones = lightingZonesFor(scene),
  construction = auditBuilding(scene, blockSpecs)) {
  const errors = [], warnings = [], results = [], sources = [], excludedSources = [];
  const diagnostic = (rule, message, item) => ({scene: scene.sceneId, rule,
    id: item?.id ?? null, x: item?.x ?? item?.x1 ?? null, y: item?.y ?? item?.y1 ?? null, message});
  const fail = (message, item) => errors.push(diagnostic('lighting-contract', message, item));
  try { buildingGrid(scene, blockSpecs); }
  catch (error) { fail(error.message); return {status: 'FAIL', errors, warnings, zones: [], sources: [], excludedSources}; }
  if (!Array.isArray(zones) || zones.length === 0) {
    fail('Lighting zones are missing');
    return {status: 'FAIL', errors, warnings, zones: [], sources: [], excludedSources};
  }
  const expected = Object.hasOwn(EXTRA_LIGHTING_ZONES, scene.sceneId)
    ? EXTRA_LIGHTING_ZONES[scene.sceneId].map(row => row[0])
    : EXISTING_LIGHTING_ZONE_IDS[scene.sceneId];
  if (expected && JSON.stringify([...expected].sort()) !== JSON.stringify(zones.map(zone => zone?.id).sort()))
    fail('Required lighting zone IDs changed');
  const ids = new Set();
  for (const zone of zones) {
    if (!zone || typeof zone.id !== 'string' || !zone.id.trim() || ids.has(zone.id) ||
        typeof zone.name !== 'string' || !zone.name.trim() ||
        !scene.rooms.some(room => room.id === zone.room) ||
        !['x1', 'y1', 'x2', 'y2'].every(key => Number.isSafeInteger(zone[key])) ||
        zone.x1 > zone.x2 || zone.y1 > zone.y2 || zone.x1 < scene.bounds.xMin ||
        zone.x2 > scene.bounds.xMax || zone.y1 < scene.bounds.yMin || zone.y2 > scene.bounds.yMax ||
        !Number.isFinite(zone.minCoverage) || zone.minCoverage <= 0 || zone.minCoverage > 1 ||
        !Number.isSafeInteger(zone.minSources) || zone.minSources < 1 || zone.minSources > 256) {
      fail('Invalid lighting zone bounds, room, ID or target', zone); continue;
    }
    ids.add(zone.id);
  }
  if (errors.length) return {status: 'FAIL', errors, warnings, zones: [], sources: [], excludedSources};
  for (const object of scene.objects.filter(object => LIGHT_KINDS.has(object.kind))) {
    try {
      const {radius, reason} = lightingRadius(scene.sceneId, object);
      const room = roomForObject(scene, object)?.id;
      const failures = construction.errors.filter(error => error.id === object.id || error.relatedId === object.id);
      if (failures.length) {
        excludedSources.push({id: object.id, rules: [...new Set(failures.map(error => error.rule))]});
        errors.push(diagnostic('lighting-source', `Источник исключён общим строительным аудитом: ${failures.map(error => error.rule).join(', ')}`, object));
        // The common construction audit owns attachment/overlap rules. Never
        // count a floating or obstructed source as usable light.
        continue;
      }
      sources.push({id: object.id, room, x: object.x + object.w / 2,
        y: object.y + object.h / 2, radius, reason});
    } catch (error) { fail(error.message, object); }
  }
  const covers = (source, x, y) => Math.hypot(x - source.x, y - source.y) <= source.radius;
  for (const zone of zones) {
    const local = sources.filter(source => source.room === zone.room), used = new Set(), darkTiles = [];
    let covered = 0, darkCount = 0, tiles = 0;
    for (let y = zone.y1; y <= zone.y2; y++) for (let x = zone.x1; x <= zone.x2; x++) {
      tiles++;
      let lit = false;
      for (const source of local) if (covers(source, x + 0.5, y + 0.5)) { lit = true; used.add(source.id); }
      if (lit) covered++;
      else { darkCount++; if (darkTiles.length < 8) darkTiles.push({x, y}); }
    }
    const coverage = covered / tiles, enoughLight = coverage >= zone.minCoverage,
      enoughSources = used.size >= zone.minSources;
    const result = {id: zone.id, name: zone.name, room: zone.room,
      status: enoughLight && enoughSources ? 'PASS' : 'WARN', tiles, covered, coverage,
      coveragePercent: Number((coverage * 100).toFixed(1)), minCoverage: zone.minCoverage,
      minSources: zone.minSources, localSources: local.map(source => source.id),
      influencingSources: [...used], darkCount, darkTiles};
    results.push(result);
    if (!enoughLight) warnings.push(diagnostic('lighting-coverage',
      `${zone.name}: проектное покрытие ${result.coveragePercent}% вместо ${zone.minCoverage * 100}%; тёмных контрольных тайлов ${darkCount}.`,
      {id: zone.id, ...(darkTiles[0] || {x: zone.x1, y: zone.y1})}));
    if (!enoughSources) warnings.push(diagnostic('lighting-sources',
      `${zone.name}: влияющих локальных источников ${used.size}/${zone.minSources}.`, zone));
  }
  return {status: errors.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS',
    errors, warnings, zones: results, sources, excludedSources};
}

export function renderLightingAudit(report) {
  if (report.status === 'NOT_RUN') return '<p class="sub">Проектное покрытие светом не рассчитано: неверные исходные данные.</p>';
  const zones = report.zones;
  return `<details class="lighting-audit"><summary>Проектное покрытие светом: ${zones.filter(zone => zone.status === 'PASS').length}/${zones.length} зон достигли цели</summary>` +
    '<p class="sub">Геометрическая эвристика, не игровая яркость и не проверка спавна. Свечение блоков/стен и распространение через препятствия не моделируются.</p><ul class="audit-messages">' +
    zones.map(zone => `<li><strong>${escHtml(zone.name)}</strong>: ${zone.coveragePercent}% · ${zone.status}; источники ${zone.influencingSources.length}/${zone.minSources} (${escHtml(zone.influencingSources.join(', ') || 'нет')}); тёмные тайлы: ${escHtml(zone.darkTiles.map(tile => `X${tile.x} Y${tile.y}`).join(', ') || 'нет')}.</li>`).join('') +
    '</ul></details>';
}
