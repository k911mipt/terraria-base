// Underground Snow-scene status badges and specification tables.
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
    ["good", `цель Гоблина: ${Math.round(v.goblinPriceModifier * 100)}% цены`],
    ["good", `Механик: ${v.goblinNeighborDistances.mechanic} тайлов`],
    ["good", `Принцесса: ${v.goblinNeighborDistances.princess} тайлов`],
    ["good", `ледяной биом: ${v.iceBiomeBlocks}/${v.iceBiomeThreshold}`],
    ["good", `пилон уже работает: ${v.currentResidentsRequired} NPC`],
    ["good", `Пилон пещер: ${v.pylonCount}`],
    ["good", `двери со стеной: ${v.doorsWithWall}/${v.totalDoors}`],
    ["good", `Мастерская инженера: ${v.tinkerersWorkshops}`],
    ["good", `Сейф: ${v.personalStorage}`],
    ["good", `локальных сундуков: ${v.serviceChests}`],
    ["good", `платформы / люки: ${v.platforms}/${v.hatches}`],
    ["", `мастерская: ${v.workshopWidth} тайла`],
    ["", `сцена: ${v.sceneWidth}×${v.sceneHeight}`],
    ["good", v.status],
  ]
    .map(
      ([kind, text]) =>
        `<span class="badge${kind ? ` ${kind}` : ""}">${escHtml(text)}</span>`,
    )
    .join("");

  document.getElementById("roomRows").innerHTML = D.rooms
    .filter((room) => room.id !== "underground_context")
    .map(
      (room) =>
        `<tr><td>${escHtml(room.name)}</td><td>${room.x2 - room.x1 + 1}×${room.y2 - room.y1 + 1}</td><td>${escHtml(room.desc)}</td></tr>`,
    )
    .join("");

  const specObjects = D.objects.filter(
    (object) => !["light", "furniture"].includes(object.kind),
  );
  document.getElementById("arenaRows").innerHTML = specObjects
    .map(
      (object) =>
        `<tr><td><span class="mat-code">${escHtml(object.short || object.id)}</span></td><td>x${object.x}…${object.x + object.w - 1}, y${object.y}…${object.y + object.h - 1}</td><td>${escHtml(roomAt(object.x, object.y)?.short || "—")}</td><td>${escHtml(object.name)}</td><td>${escHtml(object.desc || "—")}</td></tr>`,
    )
    .join("");

  const storage = D.objects.filter((object) => object.kind === "chest");
  document.getElementById("storageRows").innerHTML = storage
    .map(
      (object) =>
        `<tr><td><span class="mat-code">${escHtml(object.short)}</span></td><td><strong>${escHtml(object.customName)}</strong><br><span class="mat-code">${object.customNameLength}/20</span></td><td>${escHtml(object.look)}</td><td>${escHtml(object.loot)}</td><td class="policy-cell">${escHtml(object.avoid)}</td></tr>`,
    )
    .join("");

  const usedBlocks = [...new Set(D.solids.map((region) => region.mat))].sort(),
    usedWalls = [...new Set(D.backgrounds.map((region) => region.mat))].sort(),
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
