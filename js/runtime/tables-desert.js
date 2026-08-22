// Desert-scene status badges and specification tables.
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
  const v = D.validation;
  document.getElementById("status").innerHTML = [
    ["good", `NPC-дома: ${v.npcHouses}`],
    ["good", `Desert Pylon: ${v.pylonCount}`],
    ["good", `вода: ${v.fishingWaterTiles} тайлов`],
    ["good", `резервуар: ${v.fishingWaterWidth}×${v.fishingWaterDepth}`],
    ["good", `проём заброса: ${v.fishingOpeningWidth}`],
    ["good", `локальных сундуков: ${v.serviceChests}`],
    ["good", `дверей к спуску: ${v.accessDoors}`],
    ["good", `шаг платформ: ${v.platformStep}`],
    ["good", `фундамент: ${v.foundationTiles} тайлов`],
    ["", `павильон: ${v.surfaceWidth} тайлов`],
    ["", `сцена: ${v.sceneWidth} тайлов`],
    ["good", v.status],
  ]
    .map(
      ([kind, text]) =>
        `<span class="badge${kind ? ` ${kind}` : ""}">${escHtml(text)}</span>`,
    )
    .join("");

  document.getElementById("roomRows").innerHTML = D.rooms
    .map(
      (r) =>
        `<tr><td>${escHtml(r.name)}</td><td>${r.x2 - r.x1 + 1}×${r.y2 - r.y1 + 1}</td><td>${escHtml(r.desc)}</td></tr>`,
    )
    .join("");

  const specObjects = D.objects.filter(
    (o) => !["light", "furniture", "palm_tree", "cactus"].includes(o.kind),
  );
  document.getElementById("arenaRows").innerHTML = specObjects
    .map(
      (o) =>
        `<tr><td><span class="mat-code">${escHtml(o.short || o.id)}</span></td><td>x${o.x}…${o.x + o.w - 1}, y${o.y}…${o.y + o.h - 1}</td><td>${escHtml(roomAt(o.x, o.y)?.short || "—")}</td><td>${escHtml(o.name)}</td><td>${escHtml(o.desc || "—")}</td></tr>`,
    )
    .join("");

  const storage = D.objects.filter((o) => o.kind === "chest");
  document.getElementById("storageRows").innerHTML = storage
    .map(
      (o) =>
        `<tr><td><span class="mat-code">${escHtml(o.short)}</span></td><td><strong>${escHtml(o.customName)}</strong><br><span class="mat-code">${o.customNameLength}/20</span></td><td>${escHtml(o.look)}</td><td>${escHtml(o.loot)}</td><td class="policy-cell">${escHtml(o.avoid)}</td></tr>`,
    )
    .join("");

  const usedBlocks = [...new Set(D.solids.map((r) => r.mat))].sort(),
    usedWalls = [...new Set(D.backgrounds.map((r) => r.mat))].sort(),
    rows = [];

  for (const key of usedBlocks) {
    const spec = BLOCK_SPECS[key];
    rows.push(
      `<tr><td>${escHtml(spec.layer)}</td><td><span class="mat-code">${escHtml(key)}</span></td><td>${escHtml(biName(spec))}</td><td>${escHtml(paintName(spec))}</td><td>${escHtml(spec.note)}</td></tr>`,
    );
  }
  for (const key of usedWalls) {
    const spec = WALL_SPECS[key];
    rows.push(
      `<tr><td>Фоновая стена</td><td><span class="mat-code">${escHtml(key)}</span></td><td>${escHtml(biName(spec))}</td><td>${escHtml(paintName(spec))}</td><td>${escHtml(spec.note)}</td></tr>`,
    );
  }
  document.getElementById("materialRows").innerHTML = rows.join("");
}
