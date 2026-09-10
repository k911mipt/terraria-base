import { auditBuilding, buildingGrid, buildingTileKey } from './building-audit.js';
import { escHtml } from './formatters.js';
import { auditLighting, lightingZonesFor, renderLightingAudit } from './lighting-audit.js';
import { validateObjectRenderers } from './render-objects.js';
import { validateTileRenderers } from './render-tiles.js';
import { validateObjectData, validateUsedMaterialSpecs } from './validation.js';

// One computed result for CLI and UI. No stored PASS or design-history field is read.
export const SCENE_REQUIREMENTS = {
  main: {
    residents: ['ZOO', 'GOLF', 'GUIDE', 'MER', 'ARMS', 'NURSE', 'TRUFFLE'],
    roomSizes: [{id: 'craft', width: 46, height: 36}],
    storageChests: 86,
    goals: [
      'План для Terraria 1.4.5.6; доступность предметов зависит от этапа прохождения.',
      'Заселение NPC, условия биома и игровые эффекты арен проверяются в самом мире.',
      'Резервы телепортов — будущая инфраструктура, не действующие соединения.',
    ],
  },
  desert: {
    residents: ['DESERT_ARMS', 'DESERT_DYE'],
    pool: {id: 'DESERT_WATER', width: 20, height: 16},
    goals: [
      'Павильон размещается в существующей пустыне; биом мира модель не определяет.',
      'Покупка и работа пилона зависят от фактических NPC и условий игры.',
    ],
  },
  underground: {
    residents: ['UG_MECHANIC', 'UG_GOBLIN', 'UG_PRINCESS'],
    pool: {id: 'UG_FISH_WATER', width: 20, height: 16},
    goals: [
      '75% цены перековки — цель проекта, не вычисленный результат этого аудита.',
      'Принцесса обозначена как будущий житель; её доступность проверяется в игре.',
      'Количество Snow/Ice Blocks не заменяет проверку биома в точке игрока.',
    ],
  },
  jungle: {
    residents: ['JG_DRYAD', 'JG_PAINTER', 'JG_WITCH_DOCTOR'],
    goals: [
      'Аванпост рассчитан на поверхностные Джунгли; фактический слой и биом задаёт мир.',
      'Счастье и цены NPC являются целями проекта, а не результатом геометрического аудита.',
      'Резерв у двери Храма переносится к найденной в конкретном мире конечной точке.',
    ],
  },
};

export function computeSceneAudit(scene, inputs) {
  const errors = [], warnings = [], requirements = [];
  const add = (rule, message, object = null) => errors.push({
    scene: scene.sceneId, rule, id: object?.id ?? null,
    x: object?.x ?? null, y: object?.y ?? null, message,
  });
  const check = (rule, label, expected, actual, object = null) => {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    requirements.push({rule, label, expected, actual, passed});
    if (!passed) add(rule, `${label}: ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`, object);
  };
  const config = SCENE_REQUIREMENTS[scene.sceneId];
  let building = {errors: [], warnings: [], metrics: {}};
  try {
    for (const message of validateUsedMaterialSpecs(scene, inputs.blockSpecs,
      inputs.wallSpecs, inputs.materials, inputs.wallColors)) add('material-contract', message);
    const objects = validateObjectData(scene);
    for (const message of objects.errors) add('object-contract', message);
    for (const message of objects.warnings) warnings.push({rule: 'item-metadata', message});
    if (!Array.isArray(inputs.rendererErrors)) add('renderer-contract', 'Проверка регистрации рендереров не выполнена.');
    else for (const message of inputs.rendererErrors) add('renderer-contract', message);
    // Invalid input must not reach geometry iteration; it is already a FAIL, not an omitted success.
    if (!errors.length) {
      building = auditBuilding(scene, inputs.blockSpecs);
      errors.push(...building.errors);
      warnings.push(...building.warnings);
    }
  } catch (error) {
    add('audit-input', error.message);
  }
  const objects = Array.isArray(scene.objects) ? scene.objects : [];
  const rooms = Array.isArray(scene.rooms) ? scene.rooms : [];
  const residents = objects.filter(object => object?.kind === 'npc');
  const metrics = {
    ...building.metrics,
    objects: objects.length,
    rooms: rooms.length,
    residents: residents.length,
    futureResidents: residents.filter(object => object.futureResident === true).length,
    chests: objects.filter(object => object?.kind === 'chest').length,
    pylons: objects.filter(object => object?.kind === 'pylon').length,
    reserves: objects.filter(object => object?.kind === 'teleporter').length,
    waterTiles: 0,
    pools: [],
  };
  if (!config) add('requirements', 'Нет независимых требований для этой сцены.');
  else {
    check('resident-markers', 'Состав маркеров жителей', [...config.residents].sort(), residents.map(object => object.id).sort());
    for (const size of config.roomSizes || []) {
      const room = rooms.find(room => room.id === size.id);
      check('room-size', `Габарит ${size.id}`, [size.width, size.height],
        room ? [room.x2 - room.x1 + 1, room.y2 - room.y1 + 1] : null);
    }
    if (config.storageChests !== undefined) {
      metrics.storageChests = objects.filter(object => object?.kind === 'chest' &&
        object.room === 'craft' && object.storageFloor).length;
      check('working-storage', 'Рабочие сундуки крафтовой', config.storageChests, metrics.storageChests);
    }
    if (config.pool) {
      const pool = objects.find(object => object?.id === config.pool.id && object.kind === 'water');
      check('pool-size', `Водоём ${config.pool.id}`, [config.pool.width, config.pool.height],
        pool ? [pool.w, pool.h] : null, pool);
    }
  }
  // A liquid object's declared 'tiles' is not evidence of its current dimensions.
  if (!errors.some(error => ['audit-input', 'material-contract', 'object-contract', 'renderer-contract', 'geometry'].includes(error.rule))) {
    try {
      const grid = buildingGrid(scene, inputs.blockSpecs), water = new Set();
      for (const pool of objects.filter(object => object.kind === 'water')) {
        const volume = pool.w * pool.h;
        metrics.pools.push({id: pool.id, width: pool.w, height: pool.h, tiles: volume});
        if (Object.hasOwn(pool, 'tiles')) check('water-declaration', `Объём ${pool.id}`, volume, pool.tiles, pool);
        for (let y = pool.y; y < pool.y + pool.h; y++) for (let x = pool.x; x < pool.x + pool.w; x++) {
          const key = buildingTileKey(x, y);
          if (grid.solid(x, y)) add('water-blocked', `Твёрдый блок внутри воды X${x} Y${y}`, {id: pool.id, x, y});
          if (water.has(key)) add('water-overlap', `Два водоёма занимают X${x} Y${y}`, {id: pool.id, x, y});
          water.add(key);
        }
      }
      metrics.waterTiles = water.size;
    } catch (error) { add('audit-input', error.message); }
  }
  let lighting = {status: 'NOT_RUN', errors: [], warnings: [], zones: [], sources: [], excludedSources: []};
  if (!errors.some(error => ['audit-input', 'material-contract', 'object-contract', 'renderer-contract', 'geometry'].includes(error.rule))) {
    lighting = auditLighting(scene, inputs.blockSpecs, lightingZonesFor(scene), building);
    errors.push(...lighting.errors);
    warnings.push(...lighting.warnings);
  }
  return {
    version: 2, scene: scene.sceneId, lighting,
    status: errors.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS',
    errors, warnings, metrics, requirements,
    goals: config?.goals || [],
    scope: 'Контракт данных, регистрация рендереров, проектные строительные правила, размеры и состав.',
    unverified: [
      'Это не полная симуляция Terraria: счастье, цены, заселение, биом и действие механизмов проверяются в игре.',
      'Способы крепления относятся к проектным классам; неопределённые предметы перечислены в предупреждениях.',
      'Точное игровое освещение и спавн этим отчётом не вычисляются.',
    ],
  };
}
export function populateSceneAudit(planner) {
  planner.sceneAudit = computeSceneAudit(planner.D, {
    blockSpecs: planner.BLOCK_SPECS, wallSpecs: planner.WALL_SPECS, materials: planner.MAT, wallColors: planner.WALL,
    rendererErrors: [...validateObjectRenderers(planner, planner.D), ...validateTileRenderers(planner, planner.D)],
  });
  renderSceneAudit(planner.sceneAudit, planner.document.getElementById('status'));
}

export function renderSceneAudit(report, element) {
  const {metrics: m} = report;
  element.dataset.auditStatus = report.status;
  const badge = (text, kind = '') => `<span class="badge${kind ? ` ${kind}` : ''}">${escHtml(text)}</span>`;
  const entries = items => items.map(item => `<li>${escHtml(typeof item === 'string' ? item : item.message)}</li>`).join('');
  const summary = report.status === 'FAIL' ? `FAIL · ошибок: ${report.errors.length}`
    : report.status === 'WARN' ? `WARN · предупреждений: ${report.warnings.length}` : 'PASS · проверенный объём';
  element.innerHTML = badge(summary, report.status === 'PASS' ? 'good' : report.status === 'FAIL' ? 'bad' : 'warn') +
    badge(`Объектов: ${m.objects}`) + badge(`Маркеров жителей: ${m.residents} · будущих: ${m.futureResidents}`) +
    badge(`Сундуков: ${m.chests}`) + badge(`Пилонов: ${m.pylons} · резервов TP: ${m.reserves}`) +
    badge(`Дверей открывается: ${m.openableDoors ?? '—'}/${m.doors ?? '—'}`) +
    badge(`Фон: ${m.backgroundTiles ?? '—'} тайлов · проверено: ${m.checkedWallTiles ?? '—'}`) +
    (m.pools.length ? badge(`Вода: ${m.waterTiles} тайлов`) : '') +
    `<p class="sub">${escHtml(report.scope)}</p>` +
    (report.errors.length ? `<details open><summary>Ошибки конструкции и данных (${report.errors.length})</summary><ul class="audit-messages">${entries(report.errors)}</ul></details>` : '') +
    (report.warnings.length ? `<details><summary>Предупреждения модели (${report.warnings.length})</summary><ul class="audit-messages">${entries(report.warnings)}</ul></details>` : '') +
    renderLightingAudit(report.lighting) +
    `<details><summary>Проверенные требования (${report.requirements.filter(item => item.passed).length}/${report.requirements.length})</summary><ul class="audit-messages">${report.requirements.map(item => `<li>${escHtml(item.label)}: ${escHtml(JSON.stringify(item.actual))} · ${item.passed ? 'PASS' : 'FAIL'}</li>`).join('')}</ul></details>` +
    `<details><summary>Цели проекта — не результаты аудита</summary><ul class="audit-messages">${entries(report.goals)}</ul></details>` +
    `<details><summary>Что модель не проверяет</summary><ul class="audit-messages">${entries(report.unverified)}</ul></details>`;
}
