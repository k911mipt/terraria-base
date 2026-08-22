// Grid, labels, engineering devices and wiring overlay.
function prepareEngineering() {
  ENG.compiledCircuits = [];
  ENG.wireIndex = new Map();
  ENG.colorOccupancy = new Map();
  const errors = [];
  for (const c of ENG.circuits) {
    const cellMap = new Map();
    for (const path of c.paths) {
      try {
        for (const cell of expandOrthPath(path)) {
          cellMap.set(engKey(cell.x, cell.y), cell);
        }
      } catch (e) {
        errors.push(String(e.message || e));
      }
    }
    const cc = { ...c, cells: [...cellMap.values()] };
    ENG.compiledCircuits.push(cc);
    for (const cell of cc.cells) {
      const k = engKey(cell.x, cell.y);
      if (!ENG.wireIndex.has(k)) ENG.wireIndex.set(k, []);
      ENG.wireIndex.get(k).push(cc);
      const ck = `${c.color}|${k}`;
      if (!ENG.colorOccupancy.has(ck)) ENG.colorOccupancy.set(ck, new Set());
      ENG.colorOccupancy.get(ck).add(c.id);
    }
  }
  for (const [ck, ids] of ENG.colorOccupancy) {
    if (ids.size < 2) continue;
    const [color, xy] = ck.split("|"),
      [x, y] = xy.split(",").map(Number);
    const box = ENG.junctionBoxes.some(
      (j) => j.color === color && j.x === x && j.y === y,
    );
    if (!box)
      errors.push(`${color} ${xy}: ${[...ids].join(" / ")} без Junction Box`);
  }
  ENG.validation = {
    status: errors.length ? "FAIL" : "PASS",
    errors,
    circuits: ENG.compiledCircuits.length,
    wireTiles: ENG.compiledCircuits.reduce((n, c) => n + c.cells.length, 0),
    sameColorCrossings: [...ENG.colorOccupancy.values()].filter(
      (s) => s.size > 1,
    ).length,
    junctionBoxes: ENG.junctionBoxes.length,
    orthogonal: !errors.some((e) => e.includes("Диагональный")),
  };
}

function validateHeartWireTargets() {
  const circuit = ENG.compiledCircuits.find((c) => c.id === "HEART_AUTO"),
    targets = ["HEART_STAT_L", "HEART_STAT_R"];
  let ok = 0;
  for (const objectId of targets) {
    const target = D.objects.find((o) => o.id === objectId);
    const touches = !!(
      circuit &&
      target &&
      circuit.cells.some(
        (cell) =>
          cell.x >= target.x &&
          cell.x < target.x + target.w &&
          cell.y >= target.y &&
          cell.y < target.y + target.h,
      )
    );
    if (touches) ok++;
    else
      ENG.validation.errors.push(
        `HEART_AUTO: провод не входит ни в один тайл ${objectId}`,
      );
  }
  ENG.validation.heartTargets = `${ok}/${targets.length}`;
  ENG.validation.status = ENG.validation.errors.length ? "FAIL" : "PASS";
}

function engWireAt(wx, wy) {
  const x = Math.floor(wx),
    y = Math.floor(wy),
    arr = ENG.wireIndex.get(engKey(x, y));
  if (!arr?.length) return null;
  return {
    id: arr.map((c) => c.id).join("+"),
    name: arr.map((c) => c.name).join(" + "),
    x,
    y,
    w: 1,
    h: 1,
    kind: "wire",
    engineering: true,
    circuitId: arr[0].id,
    wireColor: arr[0].color,
    wireRole: arr.map((c) => c.role).join(" / "),
    endpoints: arr.flatMap((c) => c.endpoints).join(" → "),
    stage: ENG.stage,
    desc: arr.map((c) => c.desc).join(" "),
  };
}

function engineeringAt(wx, wy) {
  const all = [...ENG.devices, ...ENG.futureSlots];
  for (let i = all.length - 1; i >= 0; i--) {
    const o = all[i];
    if (wx >= o.x && wx < o.x + o.w && wy >= o.y && wy < o.y + o.h)
      return { ...o, engineering: true };
  }
  return engWireAt(wx, wy);
}

function engineeringDeviceAtTile(x, y) {
  if (!["arena", "wiring"].includes(document.getElementById("mode").value))
    return null;
  for (let i = ENG.devices.length - 1; i >= 0; i--) {
    const o = ENG.devices[i];
    if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) return o;
  }
  return null;
}

function engineeringForegroundSpec(o) {
  if (!o) return null;
  const base = ENGINEERING_FOREGROUND_SPECS[o.kind];
  if (!base) return null;
  return {
    ...base,
    itemRu: o.foregroundItemRu || base.itemRu,
    itemEn: o.foregroundItemEn || base.itemEn,
    paintRu: o.foregroundPaintRu || base.paintRu,
    paintEn: o.foregroundPaintEn || base.paintEn,
    note: o.foregroundNote || base.note,
  };
}

function directionLabel(o) {
  return (
    o?.directionRu ||
    { E: "вправо", W: "влево", N: "вверх", S: "вниз" }[o?.facing] ||
    "—"
  );
}

function wireOffset(color) {
  return (
    {
      red: [-0.13, -0.13],
      yellow: [0.13, -0.13],
      green: [-0.13, 0.13],
      blue: [0.13, 0.13],
    }[color] || [0, 0]
  );
}

function drawWirePath(ctx, path, color, alpha = 1) {
  const [ox, oy] = wireOffset(color),
    pts = path.map(([x, y]) => [sx(x + 0.5 + ox), sy(y + 0.5 + oy)]);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.strokeStyle = "rgba(0,0,0,.92)";
  ctx.lineWidth = Math.max(5, cam.scale * 0.46);
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
  ctx.stroke();
  ctx.strokeStyle = WIRE_COLORS[color];
  ctx.lineWidth = Math.max(3, cam.scale * 0.25);
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
  ctx.stroke();
  for (const [x, y] of pts) {
    ctx.fillStyle = "rgba(0,0,0,.92)";
    ctx.fillRect(
      x - Math.max(3, cam.scale * 0.24),
      y - Math.max(3, cam.scale * 0.24),
      Math.max(6, cam.scale * 0.48),
      Math.max(6, cam.scale * 0.48),
    );
    ctx.fillStyle = WIRE_COLORS[color];
    ctx.fillRect(
      x - Math.max(1.5, cam.scale * 0.12),
      y - Math.max(1.5, cam.scale * 0.12),
      Math.max(3, cam.scale * 0.24),
      Math.max(3, cam.scale * 0.24),
    );
  }
  ctx.restore();
}

function drawEngDevice(ctx, o, alpha = 1) {
  const s = cam.scale,
    x = sx(o.x),
    y = sy(o.y),
    w = o.w * s,
    h = o.h * s;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (o.kind === "futureTrap") {
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#b6a8c9";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + s * 0.12, y + s * 0.12, w - s * 0.24, h - s * 0.24);
    ctx.fillStyle = "rgba(130,103,158,.16)";
    ctx.fillRect(x + s * 0.12, y + s * 0.12, w - s * 0.24, h - s * 0.24);
  } else if (o.kind === "trap") {
    if (o.inactive) ctx.globalAlpha = alpha * 0.48;
    ctx.fillStyle = "#202933";
    ctx.fillRect(x + s * 0.1, y + s * 0.1, w - s * 0.2, h - s * 0.2);
    ctx.strokeStyle = o.inactive ? "#63c5dd" : "#d8a34d";
    ctx.lineWidth = Math.max(1.5, s * 0.12);
    if (o.inactive)
      ctx.setLineDash([Math.max(2, s * 0.18), Math.max(2, s * 0.12)]);
    ctx.strokeRect(x + s * 0.13, y + s * 0.13, w - s * 0.26, h - s * 0.26);
    ctx.setLineDash([]);
    ctx.fillStyle = o.inactive ? "#63c5dd" : "#d8a34d";
    ctx.beginPath();
    const cx = x + w / 2,
      cy = y + h / 2,
      r = s * 0.28;
    if (o.facing === "E") {
      ctx.moveTo(cx + r, cy);
      ctx.lineTo(cx - r, cy - r * 0.7);
      ctx.lineTo(cx - r, cy + r * 0.7);
    } else {
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy - r * 0.7);
      ctx.lineTo(cx + r, cy + r * 0.7);
    }
    ctx.closePath();
    ctx.fill();
  } else if (o.kind === "bridge") {
    ctx.fillStyle = "rgba(69,181,214,.17)";
    ctx.fillRect(x + s * 0.03, y + s * 0.08, w - s * 0.06, h - s * 0.16);
    ctx.strokeStyle = "#64c6df";
    ctx.lineWidth = Math.max(1.4, s * 0.09);
    ctx.strokeRect(x + s * 0.03, y + s * 0.08, w - s * 0.06, h - s * 0.16);
    for (let i = 0; i < o.w; i++) {
      ctx.fillStyle = "#67d7e9";
      ctx.beginPath();
      ctx.arc(
        x + (i + 0.5) * s,
        y + h * 0.5,
        Math.max(1.8, s * 0.13),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.strokeStyle = "#183944";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else if (o.kind === "timer") {
    ctx.fillStyle = "#2b333c";
    ctx.fillRect(x + s * 0.14, y + s * 0.08, w - s * 0.28, h - s * 0.16);
    ctx.strokeStyle = "#d9c163";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.42, Math.min(w, h) * 0.26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h * 0.42);
    ctx.lineTo(x + w * 0.67, y + h * 0.28);
    ctx.stroke();
  } else if (o.kind === "switch" || o.kind === "lever") {
    ctx.fillStyle = "#222a32";
    ctx.fillRect(x + s * 0.12, y + s * 0.12, w - s * 0.24, h - s * 0.24);
    ctx.strokeStyle =
      o.controlRole === "hearts"
        ? "#52d27d"
        : o.controlRole === "pit"
          ? "#64c6df"
          : o.controlRole === "traps"
            ? "#f1cf35"
            : "#8ea3b5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, y + h * 0.72);
    ctx.lineTo(x + w * 0.68, y + h * 0.28);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEngLabels(ctx, mode) {
  if (cam.scale < 7) return;
  ctx.save();
  ctx.font = `700 ${Math.max(8, Math.min(11, cam.scale * 0.78))}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const o of [...ENG.devices, ...ENG.futureSlots]) {
    if (o.hideLabel) continue;
    if (mode === "wiring" && o.kind === "futureTrap") continue;
    const x = sx(o.x + o.w / 2),
      y = sy(o.y + o.h / 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,.9)";
    ctx.strokeText(o.short || o.id, x, y);
    ctx.fillStyle = o.kind === "futureTrap" ? "#d1c5df" : "#f6f8fa";
    ctx.fillText(o.short || o.id, x, y);
  }
  ctx.restore();
}

function drawEngineeringLayer(ctx, mode) {
  if (!["arena", "wiring"].includes(mode)) return;
  if (mode === "wiring") {
    const active =
      selected?.engineering && selected.circuitId ? selected.circuitId : null;
    for (const c of ENG.circuits) {
      const alpha = active && active !== c.id ? 0.3 : 1;
      for (const path of c.paths) drawWirePath(ctx, path, c.color, alpha);
    }
  }
  for (const o of ENG.devices)
    drawEngDevice(ctx, o, mode === "wiring" ? 1 : 0.95);
  drawEngLabels(ctx, mode);
  const x = 10,
    y = 10,
    w = 306,
    h = mode === "wiring" ? 123 : 82;
  ctx.save();
  ctx.fillStyle = "rgba(5,10,15,.9)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#50677a";
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "#e8f2f7";
  ctx.font = "800 12px system-ui";
  ctx.fillText(
    mode === "wiring" ? "ЯМЫ · ПРОВОДКА" : "ЯМЫ · АРХИТЕКТУРА",
    x + 10,
    y + 18,
  );
  ctx.font = "11px system-ui";
  ctx.fillStyle = "#aebdca";
  ctx.fillText(
    "2 × ров 16 · конвейеры к базе · техпроходы снизу",
    x + 10,
    y + 35,
  );
  if (mode === "wiring") {
    const rows = [
      ["red", "Dart Trap внутри камер"],
      ["blue", "актуаторы мостов"],
      ["green", "Heart Statue"],
      ["yellow", "Lever → Timer"],
    ];
    rows.forEach((r, i) => {
      ctx.fillStyle = WIRE_COLORS[r[0]];
      ctx.fillRect(x + 12, y + 47 + i * 15, 10, 6);
      ctx.fillStyle = "#dce8ee";
      ctx.fillText(r[1], x + 30, y + 54 + i * 15);
    });
    ctx.fillStyle = ENG.validation.status === "PASS" ? "#62dd91" : "#ff706c";
    ctx.fillText(
      `${ENG.validation.status} · ${ENG.validation.circuits} цепей · ${ENG.validation.wireTiles} тайлов`,
      x + 10,
      y + h - 9,
    );
  } else {
    ctx.fillStyle = "#dce8ee";
    ctx.fillText("улица: 0 Dart · 0 кассетных оверлеев", x + 10, y + 54);
    ctx.fillText("ямы: 32 Dart · 32 Actuator · 32 Conveyor", x + 10, y + 69);
  }
  ctx.restore();
}

function drawOverlay() {
  clearCtx(xctx);
  const mode = document.getElementById("mode").value,
    scale = cam.scale;
  if (document.getElementById("grid").checked && scale >= 6) {
    xctx.strokeStyle = "rgba(230,242,250,.075)";
    xctx.lineWidth = 1;
    const vr = viewRect();
    for (let x = Math.ceil(vr.x1); x <= vr.x2; x++) {
      xctx.beginPath();
      xctx.moveTo(sx(x), 0);
      xctx.lineTo(sx(x), viewport.clientHeight);
      xctx.stroke();
    }
    for (let y = Math.ceil(vr.y1); y <= vr.y2; y++) {
      xctx.beginPath();
      xctx.moveTo(0, sy(y));
      xctx.lineTo(viewport.clientWidth, sy(y));
      xctx.stroke();
    }
  }
  drawEngineeringLayer(xctx, mode);
  if (document.getElementById("reserves").checked) {
    xctx.save();
    xctx.setLineDash([6, 5]);
    xctx.fillStyle = "rgba(74,137,180,.11)";
    xctx.strokeStyle = "#75afd0";
    xctx.lineWidth = 1.5;
    for (const r of D.reserves) {
      xctx.fillRect(
        sx(r.x1),
        sy(r.y1),
        (r.x2 - r.x1 + 1) * scale,
        (r.y2 - r.y1 + 1) * scale,
      );
      xctx.strokeRect(
        sx(r.x1),
        sy(r.y1),
        (r.x2 - r.x1 + 1) * scale,
        (r.y2 - r.y1 + 1) * scale,
      );
      if (scale > 5)
        textLabel(
          xctx,
          r.name,
          sx((r.x1 + r.x2 + 1) / 2),
          sy(r.y1 + 1.2),
          Math.min(12, scale * 1.15),
          "#a9d3eb",
        );
    }
    xctx.restore();
  }
  if (document.getElementById("roomNames").checked && scale >= 3.8) {
    for (const r of D.rooms) {
      if (r.id === "museum") continue;
      const y = r.id.startsWith("spawn") ? r.y1 + 2 : r.y1 + 1.25;
      textLabel(
        xctx,
        r.short,
        sx((r.x1 + r.x2 + 1) / 2),
        sy(y),
        Math.max(9, Math.min(15, scale * 1.25)),
        "rgba(232,240,245,.78)",
      );
    }
    if (D.museumChapters) {
      textLabel(
        xctx,
        "МУЗЕЙ",
        sx(67.5),
        sy(53.35),
        Math.max(9, Math.min(14, scale * 1.15)),
        "rgba(242,238,224,.88)",
      );
      for (const ch of D.museumChapters) {
        textLabel(
          xctx,
          ch.short,
          sx((ch.x1 + ch.x2 + 1) / 2),
          sy(55.65),
          Math.max(7, Math.min(10, scale * 0.82)),
          "rgba(244,239,221,.9)",
        );
      }
    }
  }
  if (
    document.getElementById("labels").checked &&
    mode !== "backgrounds" &&
    mode !== "wiring" &&
    scale >= 8
  ) {
    for (const o of D.objects) {
      if (o.hideLabel) continue;
      if (o.kind === "zone" && scale < 10) continue;
      if (["light", "furniture"].includes(o.kind) && scale < 11) continue;
      const fs = Math.max(7, Math.min(12, scale * 0.9));
      textLabel(
        xctx,
        o.short || o.id,
        sx(o.x + o.w / 2),
        sy(o.y + o.h / 2),
        fs,
        "#f6f8fa",
      );
    }
  }
  const target = selected || searchHit;
  if (target) {
    xctx.save();
    xctx.strokeStyle = "#9fe9ff";
    xctx.lineWidth = 2.2;
    xctx.setLineDash([6, 4]);
    xctx.strokeRect(
      sx(target.x) + 1,
      sy(target.y) + 1,
      target.w * scale - 2,
      target.h * scale - 2,
    );
    xctx.restore();
  }
  if (selectedTile) {
    xctx.strokeStyle = "#ffd45e";
    xctx.lineWidth = 2;
    xctx.strokeRect(
      sx(selectedTile.x) + 1,
      sy(selectedTile.y) + 1,
      scale - 2,
      scale - 2,
    );
  }
  document.getElementById("viewInfo").textContent =
    `x ${cam.x.toFixed(1)}…${(cam.x + viewport.clientWidth / scale).toFixed(1)} · y ${cam.y.toFixed(1)}…${(cam.y + viewport.clientHeight / scale).toFixed(1)} · ${scale.toFixed(1)} px/тайл`;
}
