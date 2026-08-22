// Tile model, lookups, caches and geometry helpers.
function rect(ctx, x, y, w, h, fill, stroke = null, lw = 1) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

function tileMaterial(ctx, mat, wx, wy) {
  const p = MAT[mat] || MAT.gray_brick,
    x = cp(wx),
    y = cy(wy),
    t = CACHE_TILE;
  rect(ctx, x, y, t, t, p.base, p.dark, 1);
  ctx.imageSmoothingEnabled = false;
  if (mat === "gray_brick") {
    ctx.fillStyle = p.dark;
    ctx.fillRect(x, y + 7, t, 2);
    const off = wy % 2 ? 3 : 11;
    ctx.fillRect(x + off, y, 2, 8);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, t - 2, 1);
  } else if (mat === "black_slab") {
    ctx.fillStyle = p.dark;
    ctx.fillRect(x, y + 7, t, 2);
    ctx.fillRect(x + (wy % 2 ? 4 : 12), y, 1, 8);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, t - 2, 1);
  } else if (mat === "boreal_wood" || mat === "living_wood") {
    ctx.fillStyle = p.dark;
    ctx.fillRect(x + 4, y, 2, t);
    ctx.fillRect(x + 11, y, 1, t);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, 2, t - 2);
    if (seeded(wx, wy) > 0.55) {
      ctx.fillStyle = p.dark;
      ctx.fillRect(x + 8, y + 7, 3, 2);
    }
  } else if (mat === "glass") {
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 2, y + 1, 2, t - 2);
    ctx.fillRect(x + 5, y + 1, 1, t - 5);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p.dark;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + t - 2);
    ctx.lineTo(x + t - 3, y + 2);
    ctx.stroke();
  } else if (mat === "marble") {
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.quadraticCurveTo(x + 7, y + 3, x + t, y + 8);
    ctx.stroke();
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, t - 2, 1);
  } else if (mat === "mushroom_block") {
    ctx.fillStyle = p.dark;
    ctx.fillRect(x, y + 11, t, 5);
    ctx.fillStyle = p.light;
    for (let i = 0; i < 3; i++) {
      const q = seeded(wx, wy, i);
      ctx.fillRect(
        x + 2 + Math.floor(q * 11),
        y + 2 + Math.floor(seeded(wy, wx, i) * 7),
        2,
        2,
      );
    }
  } else if (mat === "mud") {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? p.dark : p.light;
      ctx.fillRect(
        x + Math.floor(seeded(wx, wy, i) * 14),
        y + Math.floor(seeded(wy, wx, i + 2) * 14),
        2,
        2,
      );
    }
  } else if (mat === "mushroom_grass") {
    ctx.fillStyle = MAT.mud.base;
    ctx.fillRect(x, y + 5, t, 11);
    ctx.fillStyle = p.light;
    ctx.fillRect(x, y, t, 5);
    ctx.fillStyle = p.dark;
    ctx.fillRect(x, y + 4, t, 2);
  } else if (mat === "sandstone_block_plain") {
    ctx.fillStyle = p.dark;
    ctx.fillRect(x, y + 7, t, 2);
    ctx.fillRect(x + (wy % 2 ? 3 : 11), y, 2, 8);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, t - 2, 1);
    ctx.fillRect(x + 3, y + 11, 4, 1);
  } else if (mat === "cloud_block_plain") {
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 2, y + 4, 12, 9);
    ctx.fillRect(x + 5, y + 1, 7, 13);
    ctx.fillStyle = p.base;
    ctx.fillRect(x + 1, y + 7, 14, 6);
    ctx.fillStyle = p.dark;
    ctx.fillRect(x + 2, y + 13, 12, 2);
  } else if (mat === "bubble") {
    ctx.clearRect(x, y, t, t);
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = p.light;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + 6, y + 5, 2, Math.PI, Math.PI * 1.8);
    ctx.stroke();
  } else if (mat === "conveyor_right" || mat === "conveyor_left") {
    ctx.fillStyle = p.dark;
    ctx.fillRect(x, y + 2, t, t - 4);
    ctx.fillStyle = p.base;
    ctx.fillRect(x + 1, y + 4, t - 2, t - 8);
    ctx.fillStyle = p.light;
    for (let i = 2; i < t - 2; i += 5) ctx.fillRect(x + i, y + 3, 2, t - 6);
    ctx.fillStyle = "#f4cf55";
    ctx.beginPath();
    if (mat === "conveyor_right") {
      ctx.moveTo(x + 12, y + 8);
      ctx.lineTo(x + 7, y + 4);
      ctx.lineTo(x + 7, y + 12);
    } else {
      ctx.moveTo(x + 4, y + 8);
      ctx.lineTo(x + 9, y + 4);
      ctx.lineTo(x + 9, y + 12);
    }
    ctx.closePath();
    ctx.fill();
  } else if (mat === "dart_trap_e" || mat === "dart_trap_w") {
    ctx.fillStyle = p.dark;
    ctx.fillRect(x + 1, y + 1, t - 2, t - 2);
    ctx.strokeStyle = p.light;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2.5, y + 2.5, t - 5, t - 5);
    ctx.fillStyle = p.base;
    for (let yy = 4; yy <= 12; yy += 4) ctx.fillRect(x + 3, y + yy, t - 6, 1);
    ctx.fillStyle = "#d8a34d";
    ctx.beginPath();
    if (mat === "dart_trap_e") {
      ctx.moveTo(x + 13, y + 8);
      ctx.lineTo(x + 6, y + 4);
      ctx.lineTo(x + 6, y + 12);
    } else {
      ctx.moveTo(x + 3, y + 8);
      ctx.lineTo(x + 10, y + 4);
      ctx.lineTo(x + 10, y + 12);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function tileWall(ctx, mat, wx, wy) {
  const p = WALL[mat] || ["#414951", "#59636c"],
    x = cp(wx),
    y = cy(wy),
    t = CACHE_TILE;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = p[0];
  ctx.fillRect(x, y, t, t);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = p[1];
  ctx.lineWidth = 1;
  if (mat.includes("wall") || mat.includes("museum")) {
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + t, y + 8);
    ctx.stroke();
    const off = wy % 2 ? 4 : 12;
    ctx.beginPath();
    ctx.moveTo(x + off, y);
    ctx.lineTo(x + off, y + 8);
    ctx.stroke();
  }
  if (mat === "glass_wall") {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = p[1];
    ctx.fillRect(x + 2, y + 2, 2, t - 4);
    ctx.globalAlpha = 1;
  }
  if (mat === "diamond_gemspark_wall") {
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.fillStyle = p[0];
    ctx.fillRect(x, y, t, t);
    ctx.fillStyle = p[1];
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x + 4, y + 4, t - 8, t - 8);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + t / 2, y + 2);
    ctx.lineTo(x + t - 2, y + t / 2);
    ctx.lineTo(x + t / 2, y + t - 2);
    ctx.lineTo(x + 2, y + t / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  if (
    mat === "boreal_wall" ||
    mat === "living_wall" ||
    mat === "player1_wall" ||
    mat === "player1_accent_wall" ||
    mat === "player2_wall" ||
    mat === "player2_accent_wall"
  ) {
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 5, y + t);
    ctx.moveTo(x + 11, y);
    ctx.lineTo(x + 11, y + t);
    ctx.stroke();
  }
  if (mat === "mushroom_wall") {
    ctx.fillStyle = p[1];
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++)
      ctx.fillRect(
        x + 2 + Math.floor(seeded(wx, wy, i) * 11),
        y + 2 + Math.floor(seeded(wy, wx, i) * 11),
        2,
        2,
      );
    ctx.globalAlpha = 1;
  }
}

function applyTileShape(ctx, shape, wx, wy) {
  if (!shape) return;
  const x = cp(wx),
    y = cy(wy),
    t = CACHE_TILE;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  ctx.beginPath();
  if (shape === "upper_right") {
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + t);
    ctx.lineTo(x + t, y + t);
  } else if (shape === "upper_left") {
    ctx.moveTo(x + t, y);
    ctx.lineTo(x + t, y + t);
    ctx.lineTo(x, y + t);
  } else if (shape === "lower_right") {
    ctx.moveTo(x, y);
    ctx.lineTo(x + t, y);
    ctx.lineTo(x, y + t);
  } else if (shape === "lower_left") {
    ctx.moveTo(x, y);
    ctx.lineTo(x + t, y);
    ctx.lineTo(x + t, y + t);
  } else if (shape === "half_bottom") {
    ctx.rect(x, y, t, t / 2);
  } else {
    ctx.restore();
    return;
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function buildBaseCaches() {
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
        if (
          r.mat === "boreal_platform" ||
          r.mat === "boreal_platform_plain" ||
          r.mat === "mushroom_platform"
        )
          drawPlatformTile(sol, x, y, r.mat);
        else if (r.mat === "glass_platform") drawGlassPlatformTile(sol, x, y);
        else tileMaterial(sol, r.mat, x, y);
        if (r.shape) applyTileShape(sol, r.shape, x, y);
      }
}

function pxRect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function buildObjectCache() {
  const ctx = caches.objects.getContext("2d");
  ctx.clearRect(0, 0, caches.objects.width, caches.objects.height);
  const sorted = [...D.objects].sort(
    (a, b) => (a.kind === "zone" ? 0 : 1) - (b.kind === "zone" ? 0 : 1),
  );
  for (const o of sorted) drawObjectSprite(ctx, o);
}

function world(px, py) {
  return { x: px / cam.scale + cam.x, y: py / cam.scale + cam.y };
}

function objectAt(wx, wy) {
  if (["arena", "wiring"].includes(document.getElementById("mode").value)) {
    const e = engineeringAt(wx, wy);
    if (e) return e;
  }
  const nonZones = D.objects.filter((o) => o.kind !== "zone");
  for (let i = nonZones.length - 1; i >= 0; i--) {
    const o = nonZones[i];
    if (wx >= o.x && wx < o.x + o.w && wy >= o.y && wy < o.y + o.h) return o;
  }
  const zones = D.objects.filter((o) => o.kind === "zone");
  for (let i = zones.length - 1; i >= 0; i--) {
    const o = zones[i];
    if (wx >= o.x && wx < o.x + o.w && wy >= o.y && wy < o.y + o.h) return o;
  }
  return null;
}

function rectAt(arr, wx, wy) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const r = arr[i];
    if (wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2) return r;
  }
  return null;
}

function objectsAtTile(x, y) {
  const out = D.objects.filter(
    (o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h,
  );
  if (["arena", "wiring"].includes(document.getElementById("mode").value)) {
    for (const o of [...ENG.devices, ...ENG.futureSlots])
      if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) out.push(o);
    for (const c of ENG.wireIndex.get(engKey(x, y)) || [])
      out.push({ id: c.id });
  }
  return out;
}

function inspect(o, wx, wy) {
  selected = o || null;
  searchHit = null;
  const tx = Math.floor(wx),
    ty = Math.floor(wy);
  selectedTile = o ? null : { x: tx, y: ty };
  const room = roomAt(tx, ty),
    engDevice = engineeringDeviceAtTile(tx, ty),
    solid = rectAt(D.solids, tx, ty),
    bg = rectAt(D.backgrounds, tx, ty),
    objectSpec = o?.foregroundItemRu
      ? {
          layer: o.foregroundLayer || "Объект",
          itemRu: o.foregroundItemRu,
          itemEn: o.foregroundItemEn || "",
          paintRu: o.foregroundPaintRu || "Без краски",
          paintEn: o.foregroundPaintEn || "None",
          note: o.foregroundNote || "",
          surfaceRu: null,
          surfaceEn: null,
        }
      : null,
    bs = engDevice
      ? engineeringForegroundSpec(engDevice)
      : objectSpec || (solid ? BLOCK_SPECS[solid.mat] : AIR_SPEC),
    ws = bg ? WALL_SPECS[bg.mat] : NO_WALL_SPEC,
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
    );
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
    ["Модуль", room?.name || "—"],
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
  if (ws.safe !== null)
    rows.push([
      "Безопасная стена",
      ws.safe ? "Да, поставленная игроком" : "Нет",
    ]);
  rows.push([
    "Объекты в тайле",
    cellObjects.length ? cellObjects.map((x) => x.id).join(", ") : "нет",
  ]);
  document.getElementById("ikv").innerHTML = rows
    .map(([a, b]) => `<div>${escHtml(a)}</div><div>${escHtml(b)}</div>`)
    .join("");
  schedule();
}
