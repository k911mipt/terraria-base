// Selected-tile inspector and tooltip presentation.
function inspectorMaterialSpec(id, background) {
  const specs = background ? WALL_SPECS : BLOCK_SPECS;
  const palettes = background ? WALL : MAT;
  const spec = Object.hasOwn(specs, id) ? specs[id] : null;
  const errors = [...materialSpecProblems(spec, background), ...materialBindingProblems(id, spec, background)];
  if (!Object.hasOwn(palettes, id) || !validMaterialPalette(palettes[id], background))
    errors.push("missing or invalid palette");
  if (!errors.length) return spec;
  return {
    layer: "Ошибка данных",
    itemRu: `Ошибка данных: ${id}`,
    itemEn: errors.join("; "),
    paintRu: "—", paintEn: "None",
    safe: typeof spec?.safe === "boolean" ? spec.safe : undefined,
    note: errors.join("; "),
  };
}

// The absence of a wall is separate from missing or malformed metadata.
function wallSafetyLabel(spec, hasWall = true) {
  if (!hasWall) return null;
  if (spec?.safe === true) return "Да, поставленная игроком";
  if (spec?.safe === false) return "Нет";
  return "Ошибка данных: не указано safe";
}

// Keep the data helper strict, but keep a damaged room reference inspectable.
function inspectorObjectRoom(scene, object) {
  try { return roomForObject(scene, object); }
  catch (error) { return { name: "Ошибка данных", error: error.message }; }
}

// Scene objects can also carry engineering annotations. Only synthetic overlay
// selections bypass the scene metadata adapter (their specs come from ENG).
function inspectorObjectMetadata(scene, object) {
  return object && (!object.engineering || scene.objects.includes(object))
    ? objectContract(object) : null;
}

function inspect(o, wx, wy) {
  selected = o || null;
  searchHit = null;
  const tx = Math.floor(wx),
    ty = Math.floor(wy);
  selectedTile = o ? null : { x: tx, y: ty };
  const room = roomAt(D, tx, ty),
    objectRoom = inspectorObjectRoom(D, o),
    engDevice = engineeringDeviceAtTile(tx, ty),
    solid = rectAt(D.solids, tx, ty),
    bg = rectAt(D.backgrounds, tx, ty),
    metadata = inspectorObjectMetadata(D, o),
    objectSpec = metadata?.foreground,
    bs = engDevice
      ? engineeringForegroundSpec(engDevice)
      : objectSpec || (solid ? inspectorMaterialSpec(solid.mat, false) : AIR_SPEC),
    ws = bg ? inspectorMaterialSpec(bg.mat, true) : NO_WALL_SPEC,
    cellObjects = objectsAtTile(tx, ty);
  document.getElementById("iname").textContent = o
    ? o.name
    : `Тайл x${tx}, y${ty}`;
  document.getElementById("idesc").textContent = o
    ? o.desc || "Функциональный объект текущего плана."
    : room
      ? room.desc
      : "Вне функционального модуля.";
  const rows = [];
  if (o) {
    rows.push(
      ["Объект", o.name],
      [
        "Координаты объекта",
        `x${o.x}…${o.x + o.w - 1}, y${o.y}…${o.y + o.h - 1}`,
      ],
      ["Размер", `${o.w}×${o.h}`],
      ["Тип объекта", o.kind],
      ["Модуль объекта", objectRoom?.name || "—"],
    );
    const carrier = installedDisplayItem(o);
    if (carrier) rows.push(["Носитель", `${carrier.itemEn} · Item ID ${carrier.itemId}`]);
    if (metadata) {
      rows.push(["Роль элемента", OBJECT_ROLE_LABELS[metadata.role]]);
      rows.push(["Проходимость", OBJECT_PASSAGE_LABELS[metadata.passage]],
        ["Крепление", ATTACHMENT_LABELS[metadata.placement?.attachment] || "Не определено"]);
      if (metadata.identity.items.length) rows.push(["Идентификатор установки",
        metadata.identity.items.map(item => item.id).join(metadata.identity.status === "alternative" ? " / " : " + ")]);
      if (metadata.problems.length) rows.push(["Диагностика предмета", metadata.problems.join("; ")]);
      if (metadata.role === "liquid" && o.kind !== "lava") rows.push(["Жидкость", o.foregroundItemRu || o.name]);
      if (["reserve", "proposal", "npc", "zone", "landscape"].includes(metadata.role))
        rows.push(["Установка предмета", "Этот элемент не подменяет передний блок тайла."]);
    }
    if (objectRoom?.error) rows.push(["Ошибка привязки", objectRoom.error]);
    if (o.engineering) {
      rows.push(["Инженерный этап", o.stage || ENG.stage]);
      if (o.wireColor)
        rows.push(
          ["Цвет провода", WIRE_LABELS[o.wireColor] || o.wireColor],
          ["Роль цепи", o.wireRole || "—"],
        );
      if (o.endpoints) rows.push(["Концы цепи", o.endpoints]);
      if (o.initialState) rows.push(["Начальное состояние", o.initialState]);
      if (o.circuits?.length)
        rows.push(["Подключено к", o.circuits.join(", ")]);
      if (o.kind === "trap") {
        rows.push(
          ["Направление выстрела", directionLabel(o)],
          ["Линия огня", o.lineOfFire || "—"],
          [
            "Состояние блока",
            o.inactive ? "inactive / утоплена" : "обычная активная / твёрдая",
          ],
          [
            "Актуатор сейчас",
            o.actuatorInstalled ? "установлен" : "не установлен",
          ],
          ["Монтаж", o.setupProcedure || "—"],
        );
      }
      if (o.kind === "bridge") {
        rows.push(
          [
            "Актуаторы",
            o.actuatorInstalled ? "16 установлено" : "не установлены",
          ],
          ["Стартовое состояние", o.initialState || "—"],
          [
            "Назначение",
            "ровная дорога в обычном режиме; открытая яма во время события",
          ],
        );
      }
    }
    if (o.customName)
      rows.push(["Имя в игре", `${o.customName} (${o.customNameLength}/20)`]);
    if (o.chestItemRu)
      rows.push(
        ["Модель сундука", `${o.chestItemRu} (${o.chestItemEn})`],
        [
          "Краска сундука",
          o.chestPaintEn === "None"
            ? o.chestPaintRu
            : `${o.chestPaintRu} (${o.chestPaintEn})`,
        ],
        ["Ранняя замена", o.chestEarly],
      );
    if (o.look) rows.push(["Полный дизайн", o.look]);
    if (o.loot) rows.push(["Складывать", o.loot]);
    if (o.avoid) rows.push(["Не класть", o.avoid]);
    if (o.policy) rows.push(["Правило хранения", o.policy]);
    if (o.displayItem)
      rows.push(["Экспонат", o.displayItem], ["Глава музея", o.chapter || "—"]);
    if (o.kind === "lava")
      rows.push(
        ["Жидкость", "Лава (Lava)"],
        ["Количество", `${o.buckets || "—"} ведра`],
      );
  }
  rows.push(
    ["Тайл", `x${tx}, y${ty}`],
    ["Область тайла", room?.name || "—"],
    ["Передний тип", bs.layer],
    ["Передний материал", biName(bs)],
    ["Краска блока", paintName(bs)],
  );
  if (engDevice)
    rows.push(["Передний тайл занят", `${engDevice.id} · ${engDevice.name}`]);
  if (solid?.name)
    rows.push(
      ["Участок переднего слоя", solid.name],
      ["Назначение переднего слоя", solid.desc || "—"],
    );
  if (solid?.shape)
    rows.push(["Форма блока", SOLID_SHAPE_LABELS[solid.shape] || solid.shape]);
  if (bs.surfaceRu)
    rows.push(["Поверхность", `${bs.surfaceRu} (${bs.surfaceEn})`]);
  rows.push(["Фоновая стена", biName(ws)], ["Краска стены", paintName(ws)]);
  if (bg?.name)
    rows.push(
      ["Фоновый элемент", bg.name],
      ["Назначение фона", bg.desc || "—"],
    );
  const safety = wallSafetyLabel(ws, Boolean(bg));
  if (safety !== null) rows.push(["Безопасная стена", safety]);
  rows.push([
    "Объекты в тайле",
    cellObjects.length ? cellObjects.map((x) => x.id).join(", ") : "нет",
  ]);
  document.getElementById("ikv").innerHTML = rows
    .map(([a, b]) => `<div>${escHtml(a)}</div><div>${escHtml(b)}</div>`)
    .join("");
  schedule();
}

// Tile inspector and tooltip presentation.
function showTip(e, o) {
  if (drag?.moved) return;
  tip.style.display = "block";
  const parts = [`<b>${escHtml(o.name)}</b>`];
  const room = inspectorObjectRoom(D, o);
  if (room?.error) parts.push(`<div class="tip-section"><strong>Ошибка привязки:</strong> ${escHtml(room.error)}</div>`);
  if (room)
    parts.push(
      `<div class="tip-section"><strong>Модуль объекта:</strong> ${escHtml(room.name)}</div>`,
    );
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
