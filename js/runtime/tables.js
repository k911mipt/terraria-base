// Status badges and all room, storage, arena, circuit and material tables.
function biName(s) {
  return `${s.itemRu} (${s.itemEn})`;
}

function paintName(s) {
  return s.paintEn === "None" ? s.paintRu : `${s.paintRu} (${s.paintEn})`;
}

function escHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}

function populate() {
  const v = D.validation,
    a = v.materialAudit;
  document.getElementById("status").innerHTML =
    `<span class="badge good">музей: ${v.museumDividers} двойных разделителей</span><span class="badge good">оверлеев музея: ${v.museumChapterOverlays}</span><span class="badge good">экспонаты музея: ${v.museumSampleObjects}</span><span class="badge good">главы заполнены: ${v.museumFilledChapters}</span><span class="badge good">световые ниши: ${v.museumLightingModules}</span><span class="badge good">левая босс-арена: ${v.leftBossArena}</span><span class="badge good">колонны: ${v.leftBossArenaColumns} × ${v.leftBossArenaColumnWidth}</span><span class="badge good">ярусы: ${v.leftBossArenaPlatforms.join("/")} · шаг ${v.leftBossArenaPlatformGap}</span><span class="badge good">Bubble-мёд: ${v.leftBossArenaHoneyBaths}</span><span class="badge good">лазерные навесы: ${v.leftBossArenaSolidCanopies}</span><span class="badge good">краски арены: ${v.leftBossArenaPaints}</span><span class="badge good">светящиеся модули: ${v.leftBossArenaGemsparkModules}</span><span class="badge good">улица: ${v.arenaInteriorHeight} тайлов · Dart ${v.streetDartTraps}</span><span class="badge good">старых оверлеев: ${v.arenaLegacyZoneOverlays}</span><span class="badge good">ямы: ${v.pitCount} × ${v.pitWidth}</span><span class="badge good">Dart в ямах: ${v.pitDartTraps}</span><span class="badge good">мосты: ${v.pitActuatedFloorBlocks} Actuator</span><span class="badge good">конвейеры: ${v.pitConveyorTiles}</span><span class="badge good">техпроходы: ${v.pitTechnicalPassages}</span><span class="badge good">ловушки: ${ENG.validation.pitStates}</span><span class="badge good">проводка: ${ENG.validation.status}</span><span class="badge good">Heart: ${ENG.validation.heartTargets}</span><span class="badge good">матрица: ${v.storageMatrix}</span><span class="badge good">сундуков: ${v.workingStorageChests}</span><span class="badge good">семейств: ${v.chestFamilies}</span><span class="badge good">этажей склада: ${v.storageFloors}</span><span class="badge good">теплица: ${v.greenhouseTiers} ярусов / ${v.greenhousePlanterTiles} мест</span><span class="badge good">имена сундуков: ${v.chestCustomNames} · max ${v.longestChestName}/20</span><span class="badge">крафтовая: ${v.craftWidth}×${v.craftHeight}</span><span class="badge good">материалы: PASS</span><span class="badge good">неизвестных блоков: ${a.unknownBlockMaterials}</span><span class="badge good">неизвестных стен: ${a.unknownWallMaterials}</span><span class="badge good">тайлов описано: ${a.tilesExplicit}/${a.tilesTotal}</span><span class="badge good">конфликтов слоя: 0</span>`;
  document.getElementById("roomRows").innerHTML = D.rooms
    .filter((r) => !r.id.startsWith("spawn"))
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td>${r.x2 - r.x1 + 1}×${r.y2 - r.y1 + 1}</td><td>${r.desc}</td></tr>`,
    )
    .join("");
  const storage = D.objects
    .filter((o) => o.kind === "chest" && o.room === "craft" && o.storageFloor)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  document.getElementById("storageRows").innerHTML = storage
    .map(
      (o) =>
        `<tr><td><span class="mat-code">${escHtml(o.short)}</span></td><td><strong>${escHtml(o.customName)}</strong><br><span class="mat-code">${o.customNameLength}/20</span></td><td>${escHtml(o.storageSide)}</td><td>${o.storageFloor} / ${escHtml(o.storageRow)} ${o.storageSlot}</td><td>${escHtml(o.name)}</td><td>${escHtml(o.look)}</td><td>${escHtml(o.loot)}</td><td class="policy-cell">${escHtml(o.policy)}</td></tr>`,
    )
    .join("");
  const arenaObjects = [
    ...D.objects.filter((o) => o.arenaSpec),
    ...ENG.devices,
    ...ENG.futureSlots,
  ];
  document.getElementById("arenaRows").innerHTML = arenaObjects
    .map(
      (o) =>
        `<tr><td><span class="mat-code">${escHtml(o.short || o.id)}</span></td><td>${escHtml(o.stage || "архитектура")}</td><td>x${o.x}…${o.x + o.w - 1}, y${o.y}…${o.y + o.h - 1}</td><td>${escHtml(o.name)}</td><td>${escHtml(o.desc || "—")}</td></tr>`,
    )
    .join("");
  document.getElementById("circuitRows").innerHTML = ENG.circuits
    .map(
      (c) =>
        `<tr><td><span class="mat-code">${escHtml(c.id)}</span></td><td><span class="eng-color" style="background:${WIRE_COLORS[c.color]}"></span>${escHtml(WIRE_LABELS[c.color])}</td><td>${escHtml(c.role)}</td><td>${escHtml(c.endpoints.join(" → "))}</td><td>${escHtml(c.paths.map((p) => p.map(([x, y]) => `x${x}y${y}`).join(" → ")).join(" | "))}</td></tr>`,
    )
    .join("");
  const usedBlocks = [...new Set(D.solids.map((r) => r.mat))].sort(),
    usedWalls = [...new Set(D.backgrounds.map((r) => r.mat))].sort();
  const rows = [];
  for (const k of usedBlocks) {
    const s = BLOCK_SPECS[k];
    rows.push(
      `<tr><td>${s.layer}</td><td><span class="mat-code">${k}</span></td><td>${biName(s)}</td><td>${paintName(s)}${s.surfaceRu ? `<br>${s.surfaceRu} (${s.surfaceEn})` : ""}</td><td>${s.note}</td></tr>`,
    );
  }
  for (const k of usedWalls) {
    const s = WALL_SPECS[k];
    rows.push(
      `<tr><td>Фоновая стена</td><td><span class="mat-code">${k}</span></td><td>${biName(s)}</td><td>${paintName(s)}</td><td>${s.note}</td></tr>`,
    );
  }
  for (const k of ["trap", "timer", "switch", "bridge"]) {
    const s = ENGINEERING_FOREGROUND_SPECS[k];
    rows.push(
      `<tr><td>${s.layer}</td><td><span class="mat-code">engineering:${k}</span></td><td>${biName(s)}</td><td>${paintName(s)}</td><td>${s.note}</td></tr>`,
    );
  }
  document.getElementById("materialRows").innerHTML = rows.join("");
}
