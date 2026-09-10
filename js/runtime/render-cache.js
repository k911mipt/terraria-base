import { drawObjectSprite, validateObjectRenderers } from './render-objects.js';
import { applyTileShape, tileMaterial, tileWall, validateTileRenderers } from './render-tiles.js';
import { validateObjectData, validateUsedMaterialSpecs } from './validation.js';

// Validate source data before building the background, foreground and object caches.
export function rejectStartupData(planner, title, prefix, errors) {
  if (!errors.length) return;
  planner.startupComplete = false;
  planner.viewport.removeAttribute("data-ready");
  planner.document.getElementById("iname").textContent = title;
  planner.document.getElementById("idesc").textContent = "Отрисовка остановлена; исправьте данные.";
  planner.document.getElementById("ikv").textContent = errors.join("\n");
  throw new Error(`${prefix}: ${errors.join("\n")}`);
}

export function buildBaseCaches(planner) {
  rejectStartupData(planner, "Ошибка данных материалов", "Material contract",
    validateUsedMaterialSpecs(planner.D, planner.BLOCK_SPECS, planner.WALL_SPECS, planner.MAT, planner.WALL));
  rejectStartupData(planner, "Ошибка отрисовки материалов", "Tile renderer contract", validateTileRenderers(planner, planner.D));
  rejectStartupData(planner, "Ошибка отрисовки объектов", "Object renderer contract",
    validateObjectRenderers(planner, planner.D));
  rejectStartupData(planner, "Ошибка данных объектов", "Object data contract",
    validateObjectData(planner.D).errors);
  const bg = planner.caches.bg.getContext("2d"),
    sol = planner.caches.solid.getContext("2d");
  bg.clearRect(0, 0, planner.caches.bg.width, planner.caches.bg.height);
  sol.clearRect(0, 0, planner.caches.solid.width, planner.caches.solid.height);
  for (const r of planner.D.backgrounds)
    for (let y = r.y1; y <= r.y2; y++)
      for (let x = r.x1; x <= r.x2; x++) tileWall(planner, bg, r.mat, x, y);
  for (const r of planner.D.solids)
    for (let y = r.y1; y <= r.y2; y++)
      for (let x = r.x1; x <= r.x2; x++) {
        tileMaterial(planner, sol, r.mat, x, y);
        if (r.shape) applyTileShape(planner, sol, r.shape, x, y);
      }
}

export function buildObjectCache(planner) {
  const ctx = planner.caches.objects.getContext("2d");
  ctx.clearRect(0, 0, planner.caches.objects.width, planner.caches.objects.height);
  const sorted = [...planner.D.objects].sort(
    (a, b) => (a.kind === "zone" ? 0 : 1) - (b.kind === "zone" ? 0 : 1),
  );
  for (const o of sorted) drawObjectSprite(planner, ctx, o);
}
