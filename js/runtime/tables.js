import { roomForObject } from './core.js';
import { biName, escHtml, paintName } from './formatters.js';
import { populateSceneAudit } from './scene-audit.js';
import { WIRE_LABELS } from './state.js';

// Common tables; only the main base's detailed storage and engineering differ.
export function populate(planner) {
  populateSceneAudit(planner);
  planner.document.getElementById("roomRows").innerHTML = planner.D.rooms.filter(planner.plannerUI.roomFilter)
    .map(r => `<tr><td>${escHtml(r.name)}</td><td>${r.x2-r.x1+1}×${r.y2-r.y1+1}</td><td>${escHtml(r.desc)}</td></tr>`).join("");
  if (planner.plannerUI.engineering) populateEngineeringTables(planner);
  else populateOutpostTables(planner);
  const rows = [];
  const materialRow = (key, spec, layer = spec.layer) =>
    `<tr><td>${escHtml(layer)}</td><td><span class="mat-code">${escHtml(key)}</span></td><td>${escHtml(biName(spec))}</td><td>${escHtml(paintName(spec))}${planner.plannerUI.engineering && spec.surfaceRu ? `<br>${escHtml(spec.surfaceRu)} (${escHtml(spec.surfaceEn)})` : ""}</td><td>${escHtml(spec.note)}</td></tr>`;
  for (const key of [...new Set(planner.D.solids.map(r => r.mat))].sort())
    rows.push(materialRow(key, planner.BLOCK_SPECS[key]));
  for (const key of [...new Set(planner.D.backgrounds.map(r => r.mat))].sort())
    rows.push(materialRow(key, planner.WALL_SPECS[key], "Фоновая стена"));
  if (planner.plannerUI.engineering) for (const key of ["trap", "timer", "switch", "bridge"])
    rows.push(materialRow(`engineering:${key}`, planner.ENGINEERING_FOREGROUND_SPECS[key]));
  planner.document.getElementById("materialRows").innerHTML = rows.join("");
}

export function populateOutpostTables(planner) {
  planner.document.getElementById("arenaRows").innerHTML = planner.D.objects
    .filter(o => !planner.plannerUI.hiddenObjectKinds.includes(o.kind))
    .map(o => `<tr><td><span class="mat-code">${escHtml(o.short || o.id)}</span></td><td>x${o.x}…${o.x+o.w-1}, y${o.y}…${o.y+o.h-1}</td><td>${escHtml(roomForObject(planner.D,o)?.short || "—")}</td><td>${escHtml(o.name)}</td><td>${escHtml(o.desc || "—")}</td></tr>`).join("");
  planner.document.getElementById("storageRows").innerHTML = planner.D.objects.filter(o => o.kind === "chest")
    .map(o => `<tr><td><span class="mat-code">${escHtml(o.short)}</span></td><td><strong>${escHtml(o.customName)}</strong><br><span class="mat-code">${o.customNameLength}/20</span></td><td>${escHtml(o.look)}</td><td>${escHtml(o.loot)}</td><td class="policy-cell">${escHtml(o.avoid)}</td></tr>`).join("");
}

export function populateEngineeringTables(planner) {
  const storage = planner.D.objects
    .filter((o) => o.kind === "chest" && roomForObject(planner.D, o)?.id === "craft" && o.storageFloor)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  planner.document.getElementById("storageRows").innerHTML = storage
    .map(
      (o) =>
        `<tr><td><span class="mat-code">${escHtml(o.short)}</span></td><td><strong>${escHtml(o.customName)}</strong><br><span class="mat-code">${o.customNameLength}/20</span></td><td>${escHtml(o.storageSide)}</td><td>${o.storageFloor} / ${escHtml(o.storageRow)} ${o.storageSlot}</td><td>${escHtml(o.name)}</td><td>${escHtml(o.look)}</td><td>${escHtml(o.loot)}</td><td class="policy-cell">${escHtml(o.policy)}</td></tr>`,
    )
    .join("");
  const arenaObjects = [
    ...planner.D.objects.filter((o) => o.arenaSpec),
    ...planner.ENG.devices,
    ...planner.ENG.futureSlots,
  ];
  planner.document.getElementById("arenaRows").innerHTML = arenaObjects
    .map(
      (o) =>
        `<tr><td><span class="mat-code">${escHtml(o.short || o.id)}</span></td><td>${escHtml(o.stage || "архитектура")}</td><td>x${o.x}…${o.x + o.w - 1}, y${o.y}…${o.y + o.h - 1}</td><td>${escHtml(o.name)}</td><td>${escHtml(o.desc || "—")}</td></tr>`,
    )
    .join("");
  planner.document.getElementById("circuitRows").innerHTML = planner.ENG.circuits
    .map(
      (c) =>
        `<tr><td><span class="mat-code">${escHtml(c.id)}</span></td><td><span class="eng-color" style="background:${planner.WIRE_COLORS[c.color]}"></span>${escHtml(WIRE_LABELS[c.color])}</td><td>${escHtml(c.role)}</td><td>${escHtml(c.endpoints.join(" → "))}</td><td>${escHtml(c.paths.map((p) => p.map(([x, y]) => `x${x}y${y}`).join(" → ")).join(" | "))}</td></tr>`,
    )
    .join("");
}
