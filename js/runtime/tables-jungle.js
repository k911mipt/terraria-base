// Surface Jungle status badges, room summary, material table and storage policy.
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

function moduleForObject(object) {
  const declaredRoom = D.rooms.find((room) => room.id === object.room);
  return declaredRoom || roomAt(object.x, object.y);
}

function populate() {
  const v = D.validation;
  document.getElementById("status").innerHTML = [
    ["good", `NPC-дома: ${v.npcHouses}`],
    ["good", `Jungle Pylon: ${v.pylonCount}`],
    ["good", `слой: ${v.layer}`],
    ["good", `Дриада ↔ Маляр: ${v.residentDistances.dryadPainter}`],
    ["good", `Маляр ↔ Шаман: ${v.residentDistances.painterWitchDoctor}`],
    ["good", `Дриада ↔ Шаман: ${v.residentDistances.dryadWitchDoctor}`],
    ["good", `двери со стеной: ${v.doorsWithWall}/${v.totalDoors}`],
    ["good", `двери открываются: ${v.openableDoors}/${v.totalDoors}`],
    ["good", `уровни шахты: ${v.shaftPlatformLevels.join("/")}`],
    ["good", `шаг шахты: ${v.shaftPlatformStep}`],
    ["good", `резервы TP: ${v.teleporterReserves}`],
    ["good", `зоны света: ${v.lightingZones}`],
    ["", `сундуков: ${v.serviceChests}`],
    ["", `сцена: ${v.sceneWidth}×${v.sceneHeight}`],
    ["good", v.status],
  ]
    .map(
      ([kind, text]) =>
        `<span class="badge${kind ? ` ${kind}` : ""}">${escHtml(text)}</span>`,
    )
    .join("");

  document.getElementById("roomRows").innerHTML = D.rooms
    .filter(
      (room) =>
        !["jungle_context", "jungle_landscape"].includes(room.id),
    )
    .map(
      (room) =>
        `<tr><td>${escHtml(room.name)}</td><td>${room.x2 - room.x1 + 1}×${room.y2 - room.y1 + 1}</td><td>${escHtml(room.desc)}</td></tr>`,
    )
    .join("");

  const hiddenKinds = new Set(["light", "furniture", "jungle_vine"]);
  document.getElementById("arenaRows").innerHTML = D.objects
    .filter((object) => !hiddenKinds.has(object.kind))
    .map(
      (object) =>
        `<tr><td><span class="mat-code">${escHtml(object.short || object.id)}</span></td><td>x${object.x}…${object.x + object.w - 1}, y${object.y}…${object.y + object.h - 1}</td><td>${escHtml(moduleForObject(object)?.short || "—")}</td><td>${escHtml(object.name)}</td><td>${escHtml(object.desc || "—")}</td></tr>`,
    )
    .join("");

  document.getElementById("storageRows").innerHTML = D.objects
    .filter((object) => object.kind === "chest")
    .map(
      (object) =>
        `<tr><td><span class="mat-code">${escHtml(object.short)}</span></td><td><strong>${escHtml(object.customName)}</strong><br><span class="mat-code">${object.customNameLength}/20</span></td><td>${escHtml(object.look)}</td><td>${escHtml(object.loot)}</td><td class="policy-cell">${escHtml(object.avoid)}</td></tr>`,
    )
    .join("");

  const usedBlocks = [...new Set(D.solids.map((region) => region.mat))].sort();
  const usedWalls = [...new Set(D.backgrounds.map((region) => region.mat))].sort();
  const rows = [];

  for (const key of usedBlocks) {
    const spec = BLOCK_SPECS[key];
    if (!spec) continue;
    rows.push(
      `<tr><td>${escHtml(spec.layer)}</td><td><span class="mat-code">${escHtml(key)}</span></td><td>${escHtml(biName(spec))}</td><td>${escHtml(paintName(spec))}</td><td>${escHtml(spec.note)}</td></tr>`,
    );
  }
  for (const key of usedWalls) {
    const spec = WALL_SPECS[key];
    if (!spec) continue;
    rows.push(
      `<tr><td>${escHtml(spec.layer || "Фоновая стена")}</td><td><span class="mat-code">${escHtml(key)}</span></td><td>${escHtml(biName(spec))}</td><td>${escHtml(paintName(spec))}</td><td>${escHtml(spec.note)}</td></tr>`,
    );
  }
  document.getElementById("materialRows").innerHTML = rows.join("");
}
