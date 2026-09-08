// Validate source data before building the background, foreground and object caches.
function rejectStartupData(title, prefix, errors) {
  if (!errors.length) return;
  startupComplete = false;
  viewport.removeAttribute("data-ready");
  document.getElementById("iname").textContent = title;
  document.getElementById("idesc").textContent = "Отрисовка остановлена; исправьте данные.";
  document.getElementById("ikv").textContent = errors.join("\n");
  throw new Error(`${prefix}: ${errors.join("\n")}`);
}

function buildBaseCaches() {
  rejectStartupData("Ошибка данных материалов", "Material contract",
    validateUsedMaterialSpecs(D, BLOCK_SPECS, WALL_SPECS, MAT, WALL));
  rejectStartupData("Ошибка отрисовки материалов", "Tile renderer contract", validateTileRenderers(D));
  rejectStartupData("Ошибка отрисовки объектов", "Object renderer contract",
    validateObjectRenderers(D));
  rejectStartupData("Ошибка данных объектов", "Object data contract",
    validateObjectData(D).errors);
  const bg = caches.bg.getContext("2d"),
    sol = caches.solid.getContext("2d");
  bg.clearRect(0, 0, caches.bg.width, caches.bg.height);
  sol.clearRect(0, 0, caches.solid.width, caches.solid.height);
  for (const r of D.backgrounds)
    for (let y = r.y1; y <= r.y2; y++)
      for (let x = r.x1; x <= r.x2; x++) tileWall(bg, r.mat, x, y);
  for (const r of D.solids)
    for (let y = r.y1; y <= r.y2; y++)
      for (let x = r.x1; x <= r.x2; x++) {
        tileMaterial(sol, r.mat, x, y);
        if (r.shape) applyTileShape(sol, r.shape, x, y);
      }
}

function buildObjectCache() {
  const ctx = caches.objects.getContext("2d");
  ctx.clearRect(0, 0, caches.objects.width, caches.objects.height);
  const sorted = [...D.objects].sort(
    (a, b) => (a.kind === "zone" ? 0 : 1) - (b.kind === "zone" ? 0 : 1),
  );
  for (const o of sorted) drawObjectSprite(ctx, o);
}
