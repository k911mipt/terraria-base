// Tile inspector and tooltip presentation.
function showTip(e, o) {
  if (drag?.moved) return;
  tip.style.display = "block";
  const parts = [`<b>${escHtml(o.name)}</b>`];
  if (o.engineering && o.kind !== "wire" && o.kind !== "futureTrap") {
    const fs = engineeringForegroundSpec(o);
    if (fs)
      parts.push(
        `<div class="tip-section"><strong>Передний материал:</strong> ${escHtml(biName(fs))}</div>`,
      );
    if (o.kind === "trap")
      parts.push(
        `<div class="tip-section"><strong>Стреляет:</strong> ${escHtml(directionLabel(o))} · пара ${escHtml(o.pairedWith || "—")} · ${o.inactive ? "постоянно утоплена, актуатор снят" : "обычная твёрдая"}</div>`,
      );
  }
  if (o.customName)
    parts.push(
      `<div class="tip-section"><strong>Имя в игре:</strong> ${escHtml(o.customName)} <span class="tip-muted">(${o.customNameLength}/20)</span></div>`,
    );
  if (o.desc) parts.push(`<span>${escHtml(o.desc)}</span>`);
  else parts.push(`<span>${o.w}×${o.h} · ${escHtml(o.kind)}</span>`);
  if (o.chestItemRu)
    parts.push(
      `<div class="tip-section"><strong>Сундук:</strong> ${escHtml(o.chestItemRu)} (${escHtml(o.chestItemEn)}) · ${escHtml(o.chestPaintRu)}</div>`,
      `<div class="tip-section tip-muted"><strong>Ранняя замена:</strong> ${escHtml(o.chestEarly)}</div>`,
    );
  if (o.look)
    parts.push(
      `<div class="tip-section"><strong>Полный дизайн:</strong> ${escHtml(o.look)}</div>`,
    );
  if (o.loot)
    parts.push(
      `<div class="tip-section"><strong>Сюда:</strong> ${escHtml(o.loot)}</div>`,
    );
  if (o.avoid)
    parts.push(
      `<div class="tip-section tip-muted"><strong>Не сюда:</strong> ${escHtml(o.avoid)}</div>`,
    );
  if (o.policy)
    parts.push(
      `<div class="tip-section tip-muted"><strong>Правило:</strong> ${escHtml(o.policy)}</div>`,
    );
  if (o.displayItem)
    parts.push(
      `<div class="tip-section"><strong>Экспонат:</strong> ${escHtml(o.displayItem)}</div>`,
    );
  if (o.engineering) {
    parts.push(
      `<div class="tip-section"><strong>Этап:</strong> ${escHtml(o.stage || ENG.stage)}</div>`,
    );
    if (o.wireColor)
      parts.push(
        `<div class="tip-section"><strong>Провод:</strong> ${escHtml(WIRE_LABELS[o.wireColor] || o.wireColor)}</div>`,
      );
    if (o.circuits?.length)
      parts.push(
        `<div class="tip-section tip-muted"><strong>Цепи:</strong> ${escHtml(o.circuits.join(", "))}</div>`,
      );
    if (o.initialState)
      parts.push(
        `<div class="tip-section tip-muted"><strong>Старт:</strong> ${escHtml(o.initialState)}</div>`,
      );
  }
  tip.innerHTML = parts.join("");
  tip.style.left = Math.min(innerWidth - 390, e.clientX + 14) + "px";
  tip.style.top = Math.min(innerHeight - 150, e.clientY + 14) + "px";
}

function hideTip() {
  tip.style.display = "none";
}
