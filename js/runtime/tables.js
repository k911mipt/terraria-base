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
  populateSceneAudit();
  document.getElementById("roomRows").innerHTML = D.rooms
    .filter((r) => !r.id.startsWith("spawn"))
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td>${r.x2 - r.x1 + 1}×${r.y2 - r.y1 + 1}</td><td>${r.desc}</td></tr>`,
    )
    .join("");
  const storage = D.objects
    .filter((o) => o.kind === "chest" && roomForObject(D, o)?.id === "craft" && o.storageFloor)
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
