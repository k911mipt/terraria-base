/**
 * Terraria base planner runtime.
 *
 * The large immutable data sets and material catalogues live in js/data/.
 * This file intentionally keeps the original execution order and globals
 * so the source split cannot change rendering or interaction behavior.
 */

const viewport = document.getElementById("viewport");
const baseCanvas = document.getElementById("baseCanvas"),
  objectCanvas = document.getElementById("objectCanvas"),
  overlayCanvas = document.getElementById("overlayCanvas");
const bctx = baseCanvas.getContext("2d"),
  octx = objectCanvas.getContext("2d"),
  xctx = overlayCanvas.getContext("2d");
const tip = document.getElementById("tip");
const CACHE_TILE = 16,
  WX = D.bounds.xMax - D.bounds.xMin + 1,
  WY = D.bounds.yMax - D.bounds.yMin + 1;
let dpr = 1,
  cam = { x: D.bounds.xMin, y: D.bounds.yMin, scale: 7 },
  history = [],
  drag = null,
  selected = null,
  selectedTile = null,
  searchHit = null,
  raf = 0,
  wheelSession = null;
const caches = {
  bg: document.createElement("canvas"),
  solid: document.createElement("canvas"),
  objects: document.createElement("canvas"),
};
for (const c of Object.values(caches)) {
  c.width = WX * CACHE_TILE;
  c.height = WY * CACHE_TILE;
  c.getContext("2d").imageSmoothingEnabled = false;
}

const AIR_SPEC = {
  layer: "Воздух",
  itemRu: "Блока/платформы нет",
  itemEn: "No foreground tile",
  paintRu: "—",
  paintEn: "—",
  note: "Явно пустой передний слой.",
};
const NO_WALL_SPEC = {
  itemRu: "Фоновой стены нет",
  itemEn: "No background wall",
  paintRu: "—",
  paintEn: "—",
  safe: null,
  note: "Явно пустой фоновый слой.",
};
function biName(s) {
  return `${s.itemRu} (${s.itemEn})`;
}
function paintName(s) {
  return s.paintEn === "None" ? s.paintRu : `${s.paintRu} (${s.paintEn})`;
}
function cp(x) {
  return (x - D.bounds.xMin) * CACHE_TILE;
}
function cy(y) {
  return (y - D.bounds.yMin) * CACHE_TILE;
}
function seeded(x, y, s = 0) {
  let n = ((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0;
  n = ((n ^ (n >> 13)) * 1274126177) >>> 0;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}
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
function drawPlatformTile(ctx, wx, wy, mat = "boreal_platform") {
  const x = cp(wx),
    y = cy(wy),
    t = CACHE_TILE,
    p = MAT[mat] || MAT.boreal_platform;
  ctx.fillStyle = p.dark;
  ctx.fillRect(x, y + 9, t, 5);
  ctx.fillStyle = p.base;
  ctx.fillRect(x, y + 7, t, 4);
  ctx.fillStyle = p.light;
  ctx.fillRect(x, y + 7, t, 1);
  ctx.fillStyle = p.dark;
  ctx.fillRect(x + 3, y + 11, 2, 5);
  ctx.fillRect(x + 11, y + 11, 2, 5);
}
function drawGlassPlatformTile(ctx, wx, wy) {
  const x = cp(wx),
    y = cy(wy),
    t = CACHE_TILE,
    p = MAT.glass_platform;
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = p.base;
  ctx.fillRect(x + 1, y + 7, t - 2, 6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.light;
  ctx.fillRect(x + 1, y + 7, t - 2, 2);
  ctx.fillStyle = p.dark;
  ctx.fillRect(x + 1, y + 12, t - 2, 2);
  ctx.strokeStyle = p.light;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 12);
  ctx.lineTo(x + 10, y + 7);
  ctx.stroke();
  ctx.restore();
}
const SOLID_SHAPE_LABELS = {
  upper_right: "Скос к центру · верхняя правая половина",
  upper_left: "Скос к центру · верхняя левая половина",
  lower_right: "Скос к центру · нижняя правая половина",
  lower_left: "Скос к центру · нижняя левая половина",
  half_bottom: "Нижний полублок",
};
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
function pstyle(style) {
  const c = STYLE[style] || "#74808a";
  return { base: c, dark: shade(c, -32), light: shade(c, 35) };
}
function shade(hex, amt) {
  let n = parseInt(hex.slice(1), 16),
    r = Math.max(0, Math.min(255, (n >> 16) + amt)),
    g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)),
    b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
function pxRect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function objectBox(o) {
  return { x: cp(o.x), y: cy(o.y), w: o.w * CACHE_TILE, h: o.h * CACHE_TILE };
}
const CHEST_FAMILY_BASE = {
  wooden: "#875a36",
  boreal: "#76614f",
  dynasty: "#ded2aa",
  steampunk: "#9b6337",
  glass: "#75bdc8",
  stone: "#777c82",
  gold: "#c7a342",
  living: "#665638",
  sandstone: "#b18452",
  skyware: "#83b5c5",
  frozen: "#78b4d3",
  water: "#477ea7",
  shadow: "#3d304d",
  obsidian: "#302938",
  honey: "#c2872f",
};
function chestPalette(o) {
  const c =
    o.paintColor ||
    CHEST_FAMILY_BASE[o.chestFamily] ||
    STYLE[o.style] ||
    "#74808a";
  return { base: c, dark: shade(c, -34), light: shade(c, 38) };
}
function drawChest(ctx, o) {
  const b = objectBox(o),
    p = chestPalette(o),
    x = b.x + 2,
    y = b.y + 5,
    w = b.w - 4,
    h = b.h - 7,
    f = o.chestFamily || "boreal";
  pxRect(ctx, x, y, w, h, p.dark);
  pxRect(ctx, x + 1, y + 3, w - 2, h - 4, p.base);
  pxRect(ctx, x + 1, y, w - 2, 5, p.light);
  pxRect(ctx, x + 3, y + 5, w - 6, 2, p.dark);
  if (f === "wooden") {
    for (let xx = x + 5; xx < x + w - 3; xx += 7)
      pxRect(ctx, xx, y + 3, 1, h - 5, p.dark);
    pxRect(ctx, x + 2, y + h - 5, w - 4, 2, p.light);
  } else if (f === "boreal") {
    pxRect(ctx, x + 3, y + 4, w - 6, 1, p.light);
    pxRect(ctx, x + 5, y + 9, w - 10, 1, p.dark);
    pxRect(ctx, x + 3, y + 13, w - 6, 1, p.dark);
  } else if (f === "dynasty") {
    pxRect(ctx, x + 1, y + 1, w - 2, 2, "#f4e5a8");
    pxRect(ctx, x + 2, y + h - 4, w - 4, 2, "#c89f48");
    pxRect(ctx, x + 2, y + 3, 2, h - 7, "#e8d6aa");
    pxRect(ctx, x + w - 4, y + 3, 2, h - 7, "#e8d6aa");
  } else if (f === "steampunk") {
    pxRect(ctx, x + 3, y + 4, 5, 2, "#d28a43");
    pxRect(ctx, x + w - 9, y + 3, 5, 2, "#d28a43");
    ctx.strokeStyle = "#f0b34c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.58, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.58, 1.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (f === "glass") {
    ctx.save();
    ctx.globalAlpha = 0.38;
    pxRect(ctx, x + 3, y + 3, w - 6, h - 6, "#d8fbff");
    ctx.restore();
    ctx.strokeStyle = "#bdefff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    pxRect(ctx, x + 5, y + 4, 2, h - 9, "#e7ffff");
  } else if (f === "stone") {
    pxRect(ctx, x + 2, y + 4, w - 4, 2, p.light);
    pxRect(ctx, x + 2, y + 10, w - 4, 2, p.dark);
    for (let xx = x + 5; xx < x + w - 3; xx += 8)
      pxRect(ctx, xx, y + 4, 1, 6, p.dark);
  } else if (f === "gold") {
    pxRect(ctx, x + 1, y + 1, w - 2, 2, "#ffe184");
    pxRect(ctx, x + 2, y + h - 4, w - 4, 2, "#9c6f20");
    pxRect(ctx, x + 2, y + 3, 3, h - 7, "#e7ba45");
    pxRect(ctx, x + w - 5, y + 3, 3, h - 7, "#e7ba45");
    pxRect(ctx, x + 6, y + 5, w - 12, 2, "#f7d96b");
  } else if (f === "living") {
    for (let xx = x + 4; xx < x + w - 3; xx += 7)
      pxRect(ctx, xx, y + 3, 2, h - 6, p.dark);
    pxRect(ctx, x + 2, y + h - 5, w - 4, 2, p.light);
    ctx.fillStyle = "#75b85e";
    ctx.beginPath();
    ctx.moveTo(x + w - 8, y + 5);
    ctx.lineTo(x + w - 3, y + 3);
    ctx.lineTo(x + w - 5, y + 8);
    ctx.closePath();
    ctx.fill();
  } else if (f === "sandstone") {
    pxRect(ctx, x + 2, y + 4, w - 4, 2, p.light);
    pxRect(ctx, x + 2, y + 9, w - 4, 2, p.dark);
    pxRect(ctx, x + 5, y + 4, 1, 5, p.dark);
    pxRect(ctx, x + w - 7, y + 9, 1, 5, p.dark);
  } else if (f === "skyware") {
    pxRect(ctx, x + 2, y + 3, w - 4, 3, "#e7f4f3");
    pxRect(ctx, x + 2, y + h - 5, w - 4, 2, "#caa74b");
    ctx.fillStyle = "#d9f3f7";
    ctx.beginPath();
    ctx.arc(x + 8, y + 9, 4, Math.PI, 0);
    ctx.arc(x + 13, y + 9, 5, Math.PI, 0);
    ctx.arc(x + 18, y + 9, 4, Math.PI, 0);
    ctx.fill();
  } else if (f === "frozen") {
    pxRect(ctx, x + 1, y + 1, w - 2, 3, "#d9f6ff");
    for (let xx = x + 3; xx < x + w - 2; xx += 6) {
      ctx.fillStyle = "#b9eaff";
      ctx.beginPath();
      ctx.moveTo(xx, y + 4);
      ctx.lineTo(xx + 2, y + 9);
      ctx.lineTo(xx + 4, y + 4);
      ctx.closePath();
      ctx.fill();
    }
    pxRect(ctx, x + 3, y + h - 5, w - 6, 2, "#5d8ea9");
  } else if (f === "water") {
    ctx.strokeStyle = "#a9e6ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 8);
    for (let xx = x + 3; xx < x + w - 3; xx += 5) {
      ctx.quadraticCurveTo(xx + 2, y + 5, xx + 5, y + 8);
    }
    ctx.stroke();
    ctx.fillStyle = "#a9e6ff";
    ctx.beginPath();
    ctx.arc(x + w - 7, y + 13, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (f === "shadow") {
    pxRect(ctx, x + 2, y + 3, w - 4, h - 6, "#2a2035");
    pxRect(ctx, x + 4, y + 5, w - 8, 2, "#84518d");
    pxRect(ctx, x + 4, y + h - 7, w - 8, 2, "#5b345f");
  } else if (f === "obsidian") {
    pxRect(ctx, x + 2, y + 3, w - 4, h - 6, "#1d1a24");
    ctx.strokeStyle = "#8a52a3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 4);
    ctx.lineTo(x + 10, y + 9);
    ctx.lineTo(x + 7, y + 14);
    ctx.lineTo(x + 13, y + h - 4);
    ctx.moveTo(x + w - 6, y + 4);
    ctx.lineTo(x + w - 11, y + 10);
    ctx.stroke();
  } else if (f === "honey") {
    pxRect(ctx, x + 2, y + 3, w - 4, h - 6, "#dca641");
    ctx.fillStyle = "#f4c866";
    for (let yy = y + 5; yy < y + h - 4; yy += 6)
      for (let xx = x + 5; xx < x + w - 4; xx += 7) {
        ctx.beginPath();
        ctx.arc(xx + (yy % 12 ? 3 : 0), yy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    pxRect(ctx, x + 2, y + h - 6, w - 4, 3, "#9b6523");
  }
  pxRect(ctx, x + w / 2 - 2, y + 7, 4, 5, "#d7bb62");
  if (["combat", "combat_dark", "weapon_red"].includes(o.style)) {
    pxRect(ctx, x + 2, y - 2, 3, 3, p.light);
    pxRect(ctx, x + w - 5, y - 2, 3, 3, p.light);
  }
  if (o.style === "mechanic" || o.style === "engineer_orange") {
    ctx.strokeStyle = "#f0b34c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.58, 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (o.style === "nature" || o.style === "nature_teal") {
    ctx.fillStyle = "#86c66b";
    ctx.fillRect(x + 3, y + 6, 3, 2);
  }
  if (
    [
      "water",
      "water_ice",
      "fishing_blue",
      "tech_cyan",
      "accessory_cyan",
    ].includes(o.style)
  ) {
    ctx.fillStyle = "#8fd7ff";
    ctx.fillRect(x + 3, y + 6, w - 8, 1);
  }
  if (["alchemy", "alchemy_crystal", "alchemy_purple"].includes(o.style)) {
    ctx.fillStyle = "#e3a7ff";
    ctx.fillRect(x + 4, y + 5, 2, 4);
  }
  if (["curator", "collector_white", "decor_white"].includes(o.style)) {
    pxRect(ctx, x + 1, y + 1, w - 2, 2, "#f4e5a8");
  }
}
function drawStation(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    x = b.x + 2,
    y = b.y + 2,
    w = b.w - 4,
    h = b.h - 3;
  pxRect(ctx, x, y, w, h, p.dark);
  pxRect(ctx, x + 2, y + 2, w - 4, h - 4, p.base);
  pxRect(ctx, x + 2, y + 2, w - 4, 3, p.light);
  const kind = o.style;
  if (kind === "core") {
    pxRect(ctx, x + 2, y + h - 6, w - 4, 3, "#c48645");
    pxRect(ctx, x + 4, y + h - 3, 3, 3, p.dark);
    pxRect(ctx, x + w - 7, y + h - 3, 3, 3, p.dark);
  } else if (kind === "alchemy" || kind === "alchemy_crystal") {
    pxRect(ctx, x + 4, y + h - 8, 4, 6, "#c777d9");
    pxRect(ctx, x + 10, y + h - 10, 3, 8, "#7ed0d8");
    pxRect(ctx, x + 3, y + h - 3, w - 6, 2, p.light);
  } else if (kind === "buff") {
    pxRect(ctx, x + 2, y + h - 5, w - 4, 3, "#be7042");
    pxRect(ctx, x + w / 2 - 2, y + 4, 4, h - 10, "#e0a35b");
  } else if (kind === "advanced") {
    pxRect(ctx, x + w / 2 - 3, y + 4, 6, 6, "#d98adc");
    pxRect(ctx, x + 3, y + h - 5, w - 6, 3, "#7c4b8f");
  } else {
    for (let i = 0; i < 3; i++) {
      const xx = x + 4 + i * 6;
      pxRect(ctx, xx, y + 5, 3, h - 10, i % 2 ? p.light : "#6f8798");
    }
    pxRect(ctx, x + 3, y + h - 4, w - 6, 2, p.dark);
  }
}
function drawNpc(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    cx = b.x + b.w / 2;
  ctx.fillStyle = p.dark;
  ctx.fillRect(cx - 5, b.y + 14, 10, b.h - 16);
  ctx.fillStyle = o.style === "mushroom" ? "#86d9ff" : "#e5bf93";
  ctx.fillRect(cx - 5, b.y + 4, 10, 10);
  ctx.fillStyle = p.base;
  ctx.fillRect(cx - 6, b.y + 13, 12, 6);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(cx - 3, b.y + 8, 2, 2);
  ctx.fillRect(cx + 2, b.y + 8, 2, 2);
}
function drawDoor(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    x = b.x + 3,
    y = b.y + 1,
    w = b.w - 6,
    h = b.h - 2;
  pxRect(ctx, x, y, w, h, "#69472f");
  pxRect(ctx, x + 2, y + 2, w - 4, h - 4, "#8c6040");
  ctx.strokeStyle = "#c28a59";
  ctx.lineWidth = 1;
  for (let yy = y + 5; yy < y + h; yy += 7) {
    ctx.beginPath();
    ctx.moveTo(x + 2, yy);
    ctx.lineTo(x + w - 2, yy);
    ctx.stroke();
  }
  pxRect(ctx, x + w - 4, y + h / 2, 2, 2, "#e1bd62");
}
function drawHatch(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style);
  pxRect(ctx, b.x + 1, b.y + 6, b.w - 2, 6, p.dark);
  pxRect(ctx, b.x + 2, b.y + 7, b.w - 4, 3, p.base);
  for (let x = b.x + 4; x < b.x + b.w - 3; x += 5)
    pxRect(ctx, x, b.y + 8, 2, 2, p.light);
}
function drawFurniture(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    n = o.name.toLowerCase();
  if (n.includes("стул") || n.includes("chair")) {
    pxRect(ctx, b.x + b.w / 2 - 2, b.y + 5, 4, b.h - 6, p.light);
    pxRect(ctx, b.x + b.w / 2 - 4, b.y + b.h - 6, 8, 3, p.base);
    pxRect(ctx, b.x + b.w / 2 - 3, b.y + b.h - 3, 2, 3, p.dark);
    pxRect(ctx, b.x + b.w / 2 + 1, b.y + b.h - 3, 2, 3, p.dark);
  } else {
    pxRect(ctx, b.x + 2, b.y + b.h - 7, b.w - 4, 4, p.light);
    pxRect(ctx, b.x + 4, b.y + b.h - 3, 3, 3, p.dark);
    pxRect(ctx, b.x + b.w - 7, b.y + b.h - 3, 3, 3, p.dark);
  }
}
function drawBed(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style);
  pxRect(ctx, b.x + 2, b.y + 7, b.w - 4, b.h - 9, p.dark);
  pxRect(ctx, b.x + 4, b.y + 5, b.w - 6, 8, p.base);
  pxRect(ctx, b.x + 5, b.y + 6, 7, 6, "#e6e1d5");
  pxRect(ctx, b.x + 13, b.y + 6, b.w - 20, 6, p.light);
  pxRect(ctx, b.x + 3, b.y + b.h - 3, 3, 3, p.dark);
  pxRect(ctx, b.x + b.w - 6, b.y + b.h - 3, 3, 3, p.dark);
}
function drawPersonal(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style),
    s = o.short;
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 3, p.dark);
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 7, p.base);
  if (s === "PIGGY") {
    ctx.fillStyle = "#e9a6a6";
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (s === "SAFE") {
    pxRect(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, "#84909b");
    ctx.strokeStyle = "#d4bd68";
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (s === "VOID") {
    pxRect(ctx, b.x + 6, b.y + 5, b.w - 12, b.h - 10, "#3b2b59");
    ctx.fillStyle = "#9b76d1";
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    for (let i = 0; i < 3; i++)
      pxRect(
        ctx,
        b.x + 5 + i * 7,
        b.y + 5,
        4,
        b.h - 10,
        i % 2 ? p.light : "#986443",
      );
  }
}
function drawPylon(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2;
  ctx.fillStyle = "#285f68";
  ctx.beginPath();
  ctx.moveTo(cx, cy - b.h * 0.42);
  ctx.lineTo(cx + b.w * 0.3, cy);
  ctx.lineTo(cx, cy + b.h * 0.42);
  ctx.lineTo(cx - b.w * 0.3, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7ce5de";
  ctx.beginPath();
  ctx.moveTo(cx, cy - b.h * 0.33);
  ctx.lineTo(cx + b.w * 0.18, cy);
  ctx.lineTo(cx, cy + b.h * 0.24);
  ctx.lineTo(cx - b.w * 0.18, cy);
  ctx.closePath();
  ctx.fill();
  pxRect(ctx, b.x + 3, b.y + b.h - 5, b.w - 6, 4, "#6d5940");
}
function drawTeleporter(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style);
  pxRect(ctx, b.x + 2, b.y + b.h - 7, b.w - 4, 5, p.dark);
  pxRect(ctx, b.x + 4, b.y + b.h - 8, b.w - 8, 4, p.base);
  ctx.strokeStyle = "#7fe8ef";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(b.x + b.w / 2, b.y + b.h - 6, b.w * 0.28, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
}
function drawPlanter(ctx, o) {
  const b = objectBox(o);
  const palettes = {
    planter_day: {
      tray: "#c4a63c",
      rim: "#f0d66a",
      soil: "#6f4d31",
      plant: "#8fd05b",
    },
    planter_blink: {
      tray: "#94754c",
      rim: "#c8aa75",
      soil: "#67462d",
      plant: "#d9b66d",
    },
    planter_moon: {
      tray: "#5d61a8",
      rim: "#9b9fe0",
      soil: "#55426a",
      plant: "#94a8ff",
    },
    planter_water: {
      tray: "#418aa3",
      rim: "#76c4dd",
      soil: "#526b64",
      plant: "#75cbbd",
    },
    planter_fire: {
      tray: "#b7542e",
      rim: "#e88651",
      soil: "#71402d",
      plant: "#f08b45",
    },
    planter_death: {
      tray: "#5d4865",
      rim: "#9677a0",
      soil: "#55434e",
      plant: "#9a729f",
    },
    planter_shiver: {
      tray: "#5f9eb8",
      rim: "#9bd9ee",
      soil: "#53636b",
      plant: "#a8e7f5",
    },
  };
  const q = palettes[o.style] || palettes.planter_day;
  const y = b.y + b.h - 7;
  pxRect(ctx, b.x + 1, y, b.w - 2, 6, "#4a3426");
  pxRect(ctx, b.x + 2, y, b.w - 4, 2, q.rim);
  pxRect(ctx, b.x + 2, y + 2, b.w - 4, 3, q.tray);
  pxRect(ctx, b.x + 3, y + 1, b.w - 6, 1, q.soil);
  pxRect(ctx, b.x + 1, y + 5, b.w - 2, 2, "#3f2c21");
  for (let x = b.x + 6; x < b.x + b.w - 4; x += 8) {
    ctx.fillStyle = q.plant;
    ctx.beginPath();
    ctx.moveTo(x, b.y + b.h - 8);
    ctx.lineTo(x - 3, b.y + b.h - 13);
    ctx.lineTo(x, b.y + b.h - 11);
    ctx.lineTo(x + 3, b.y + b.h - 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = q.rim;
    ctx.fillRect(x - 1, b.y + b.h - 12, 2, 4);
  }
}
function drawLight(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2,
    style = o.style || "light";
  let glow = "#ffd667",
    core = "#ffe274",
    stem = "#6c5134";
  const map = {
    white_torch: ["#fff2c7", "#fffbe8", "#847257"],
    ultrabright_torch: ["#78eaff", "#e6fdff", "#3a6f7b"],
    ice_torch: ["#8bd7ff", "#e9f8ff", "#466d83"],
    red_torch: ["#ff756d", "#ffd4cf", "#7b4945"],
    purple_torch: ["#c58cff", "#eddcff", "#684b7c"],
    pink_torch: ["#ff9ad2", "#ffd9ef", "#755067"],
    star_light: ["#9cbcff", "#eef4ff", "#6372a6"],
  };
  if (map[style]) {
    [glow, core, stem] = map[style];
  }
  if (style === "glass_lantern") {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#bfefff";
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    pxRect(ctx, cx - 1, b.y, 2, 5, "#668691");
    pxRect(ctx, cx - 5, b.y + 5, 10, 13, "#4d7d89");
    pxRect(ctx, cx - 4, b.y + 6, 8, 11, "#9cdce7");
    pxRect(ctx, cx - 3, b.y + 7, 6, 9, "#eefeff");
    ctx.strokeStyle = "#d9fbff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, b.y + 16);
    ctx.lineTo(cx + 4, b.y + 6);
    ctx.stroke();
    return;
  }
  if (style === "lantern_warm") {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#ffd98c";
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    pxRect(ctx, cx - 1, b.y + 1, 2, 4, "#6d5335");
    pxRect(ctx, cx - 5, b.y + 5, 10, 9, "#7f6039");
    pxRect(ctx, cx - 4, b.y + 6, 8, 7, "#ffd57a");
    pxRect(ctx, cx - 3, b.y + 7, 6, 5, "#fff0b0");
    return;
  }
  if (style === "star_light") {
    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    pxRect(ctx, cx - 1, b.y + 2, 2, 4, stem);
    ctx.strokeStyle = "#d9e5ff";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(cx - 5, b.y + 7, 10, 7);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(cx, b.y + 7);
    ctx.lineTo(cx + 2, b.y + 11);
    ctx.lineTo(cx + 6, b.y + 11);
    ctx.lineTo(cx + 3, b.y + 14);
    ctx.lineTo(cx + 4, b.y + 18);
    ctx.lineTo(cx, b.y + 15);
    ctx.lineTo(cx - 4, b.y + 18);
    ctx.lineTo(cx - 3, b.y + 14);
    ctx.lineTo(cx - 6, b.y + 11);
    ctx.lineTo(cx - 2, b.y + 11);
    ctx.closePath();
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  pxRect(ctx, cx - 1, b.y + 2, 2, 5, stem);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 6);
  ctx.lineTo(cx - 4, b.y + 12);
  ctx.lineTo(cx, b.y + 15);
  ctx.lineTo(cx + 4, b.y + 12);
  ctx.closePath();
  ctx.fill();
}
function drawMuseumGlyph(ctx, icon, cx, cy, a, s = 8) {
  ctx.save();
  ctx.fillStyle = a;
  ctx.strokeStyle = a;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const dot = (x, y, r, c = a) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = a;
  };
  const poly = (pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) =>
      i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y),
    );
    ctx.closePath();
    ctx.fill();
  };
  if (icon === "slime") {
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, s, s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    pxRect(ctx, cx - s * 0.6, cy - s, s * 1.2, 3, "#d8bd5d");
  } else if (icon === "eye") {
    dot(cx, cy, s);
    dot(cx, cy, s * 0.62, "#f0ebe2");
    dot(cx + 1, cy, s * 0.25, "#b2373d");
  } else if (icon === "evil") {
    dot(cx - s * 0.45, cy, s * 0.58);
    dot(cx + s * 0.45, cy, s * 0.58);
    ctx.strokeStyle = "#d2a8e0";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.8, cy - s * 0.6);
    ctx.lineTo(cx + s * 0.8, cy + s * 0.6);
    ctx.moveTo(cx + s * 0.8, cy - s * 0.6);
    ctx.lineTo(cx - s * 0.8, cy + s * 0.6);
    ctx.stroke();
  } else if (icon === "skull" || icon === "prime") {
    dot(cx, cy - 2, s * 0.72, "#e3e0d5");
    pxRect(ctx, cx - s * 0.7, cy + s * 0.35, s * 1.4, s * 0.55, "#d1cec4");
    dot(cx - s * 0.28, cy - 3, 1.5, "#3b3432");
    dot(cx + s * 0.28, cy - 3, 1.5, "#3b3432");
    if (icon === "prime") {
      ctx.strokeStyle = a;
      for (const [dx, dy] of [
        [-s, -s],
        [s, -s],
        [-s, s],
        [s, s],
      ]) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.sign(dx) * s * 0.6, cy + Math.sign(dy) * s * 0.25);
        ctx.lineTo(cx + dx, cy + dy);
        ctx.stroke();
      }
    }
  } else if (icon === "bee") {
    ctx.globalAlpha = 0.75;
    dot(cx - s * 0.72, cy - s * 0.3, s * 0.45, "#dff3f6");
    dot(cx + s * 0.72, cy - s * 0.3, s * 0.45, "#dff3f6");
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.85, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#42311f";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 4 - 1, cy - s * 0.5);
      ctx.lineTo(cx + i * 4 + 1, cy + s * 0.5);
      ctx.stroke();
    }
  } else if (icon === "deer") {
    poly([
      [-s * 0.6, s * 0.45],
      [0, -s * 0.6],
      [s * 0.6, s * 0.45],
    ]);
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.25, cy - s * 0.45);
    ctx.lineTo(cx - s * 0.7, cy - s);
    ctx.moveTo(cx - s * 0.55, cy - s * 0.75);
    ctx.lineTo(cx - s * 0.9, cy - s * 0.65);
    ctx.moveTo(cx + s * 0.25, cy - s * 0.45);
    ctx.lineTo(cx + s * 0.7, cy - s);
    ctx.moveTo(cx + s * 0.55, cy - s * 0.75);
    ctx.lineTo(cx + s * 0.9, cy - s * 0.65);
    ctx.stroke();
  } else if (icon === "wall") {
    pxRect(ctx, cx - s, cy - s * 0.75, s * 2, s * 1.5, a);
    dot(cx - s * 0.45, cy - s * 0.2, s * 0.18, "#f4d7c9");
    dot(cx + s * 0.45, cy - s * 0.2, s * 0.18, "#f4d7c9");
    ctx.strokeStyle = "#3b2222";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.5, cy + s * 0.3);
    ctx.lineTo(cx + s * 0.5, cy + s * 0.3);
    ctx.stroke();
  } else if (icon === "destroyer") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = cx - s + i * ((2 * s) / 5),
        y = cy + Math.sin(i * 1.2) * s * 0.35;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < 5; i++)
      dot(
        cx - s + i * (s * 0.5),
        cy + Math.sin(i * 1.2) * s * 0.35,
        1.7,
        "#d7dce2",
      );
  } else if (icon === "twins") {
    dot(cx - s * 0.45, cy, s * 0.52);
    dot(cx + s * 0.45, cy, s * 0.52);
    dot(cx - s * 0.45, cy, s * 0.18, "#e7f4ee");
    dot(cx + s * 0.45, cy, s * 0.18, "#f2dede");
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.05, cy);
    ctx.lineTo(cx + s * 0.05, cy);
    ctx.stroke();
  } else if (icon === "plantera") {
    for (let i = 0; i < 6; i++) {
      const q = (i * Math.PI) / 3;
      dot(cx + Math.cos(q) * s * 0.58, cy + Math.sin(q) * s * 0.58, s * 0.38);
    }
    dot(cx, cy, s * 0.35, "#f1c05b");
  } else if (icon === "golem") {
    pxRect(ctx, cx - s * 0.8, cy - s * 0.65, s * 1.6, s * 1.3, a);
    pxRect(ctx, cx - s * 0.55, cy + s * 0.5, s * 1.1, s * 0.35, "#8c693d");
    dot(cx - s * 0.3, cy - s * 0.15, 1.6, "#efc45e");
    dot(cx + s * 0.3, cy - s * 0.15, 1.6, "#efc45e");
  } else if (icon === "fishron") {
    poly([
      [-s, 0],
      [-s * 0.35, -s * 0.55],
      [s * 0.45, -s * 0.35],
      [s, 0],
      [s * 0.45, s * 0.35],
      [-s * 0.35, s * 0.55],
    ]);
    poly([
      [s * 0.35, 0],
      [s * 0.95, -s * 0.55],
      [s * 0.85, s * 0.5],
    ]);
  } else if (icon === "empress") {
    poly([
      [0, 0],
      [-s, -s * 0.75],
      [-s * 0.65, s * 0.15],
      [-s * 0.2, s * 0.65],
    ]);
    poly([
      [0, 0],
      [s, -s * 0.75],
      [s * 0.65, s * 0.15],
      [s * 0.2, s * 0.65],
    ]);
    dot(cx, cy, s * 0.2, "#fff0bf");
  } else if (icon === "cultist") {
    poly([
      [0, -s],
      [-s * 0.7, s * 0.75],
      [s * 0.7, s * 0.75],
    ]);
    dot(cx, cy - s * 0.2, s * 0.28, "#222636");
  } else if (icon === "moon") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.8, -Math.PI * 0.65, Math.PI * 0.65);
    ctx.stroke();
    dot(cx + s * 0.25, cy, s * 0.18, "#e8f2ff");
  } else if (icon === "spore") {
    for (const [dx, dy, r] of [
      [-4, 2, 4],
      [2, -3, 5],
      [6, 3, 3],
    ])
      dot(cx + dx, cy + dy, r);
  } else if (icon === "mandible") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - s * 0.35, cy, s * 0.55, -1.1, 1.1);
    ctx.arc(cx + s * 0.35, cy, s * 0.55, 2.04, 4.24);
    ctx.stroke();
  } else if (icon === "fin") {
    poly([
      [-s * 0.8, s * 0.65],
      [0, -s * 0.9],
      [s * 0.8, s * 0.65],
    ]);
  } else if (icon === "doll") {
    dot(cx, cy - s * 0.5, s * 0.25);
    pxRect(ctx, cx - s * 0.35, cy - s * 0.2, s * 0.7, s * 0.85, a);
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.35, cy);
    ctx.lineTo(cx - s * 0.75, cy + s * 0.25);
    ctx.moveTo(cx + s * 0.35, cy);
    ctx.lineTo(cx + s * 0.75, cy + s * 0.25);
    ctx.stroke();
  } else if (icon === "rose") {
    for (let i = 0; i < 5; i++) {
      const q = (i * Math.PI * 2) / 5;
      dot(cx + Math.cos(q) * s * 0.38, cy + Math.sin(q) * s * 0.38, s * 0.32);
    }
    dot(cx, cy, s * 0.25, "#752b32");
  } else if (icon === "conch") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.75, 0, Math.PI * 2);
    ctx.arc(cx, cy, s * 0.42, 0.4, Math.PI * 2 + 0.4);
    ctx.stroke();
  } else if (icon.startsWith("soul_")) {
    poly([
      [0, -s],
      [-s * 0.55, -s * 0.1],
      [-s * 0.25, s * 0.8],
      [0, s * 0.35],
      [s * 0.25, s * 0.8],
      [s * 0.55, -s * 0.1],
    ]);
  } else if (icon === "crystal" || icon === "luminite") {
    poly([
      [0, -s],
      [s * 0.65, 0],
      [0, s],
      [-s * 0.65, 0],
    ]);
  } else if (icon === "key") {
    dot(cx - s * 0.35, cy, s * 0.35);
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + s * 0.85, cy);
    ctx.lineTo(cx + s * 0.85, cy + s * 0.35);
    ctx.moveTo(cx + s * 0.55, cy);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.3);
    ctx.stroke();
  } else if (icon === "picksaw") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.65, cy + s * 0.65);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.55);
    ctx.moveTo(cx - s * 0.1, cy - s * 0.6);
    ctx.lineTo(cx + s * 0.75, cy - s * 0.25);
    ctx.stroke();
  } else if (icon === "ectoplasm") {
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.15, s * 0.7, Math.PI, 0);
    ctx.lineTo(cx + s * 0.7, cy + s * 0.65);
    ctx.lineTo(cx + s * 0.25, cy + s * 0.3);
    ctx.lineTo(cx, cy + s * 0.65);
    ctx.lineTo(cx - s * 0.25, cy + s * 0.3);
    ctx.lineTo(cx - s * 0.7, cy + s * 0.65);
    ctx.closePath();
    ctx.fill();
  } else if (icon === "sigil") {
    ctx.strokeStyle = a;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const q = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(q) * s * 0.25, cy + Math.sin(q) * s * 0.25);
      ctx.lineTo(cx + Math.cos(q) * s * 0.75, cy + Math.sin(q) * s * 0.75);
      ctx.stroke();
    }
  } else if (icon === "portal") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx - s * 0.25, cy, s * 0.45, s * 0.75, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + s * 0.4, cy, s * 0.35, s * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    dot(cx, cy, s * 0.7);
  }
  ctx.restore();
}
function drawMuseumTrophy(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2,
    a = o.accent || "#c9a45f";
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "#4d3928");
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#b88a4e");
  pxRect(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, "#2d2521");
  drawMuseumGlyph(ctx, o.icon, cx, cy, a, 8);
}
function drawMuseumMannequin(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    a = o.accent || "#8b6a50";
  pxRect(ctx, cx - 1, b.y + 2, 2, 5, "#806044");
  ctx.fillStyle = "#d7b58b";
  ctx.beginPath();
  ctx.arc(cx, b.y + 6, 4, 0, Math.PI * 2);
  ctx.fill();
  pxRect(ctx, cx - 5, b.y + 10, 10, 12, a);
  pxRect(ctx, cx - 7, b.y + 12, 3, 11, a);
  pxRect(ctx, cx + 4, b.y + 12, 3, 11, a);
  pxRect(ctx, cx - 4, b.y + 22, 3, b.h - 25, a);
  pxRect(ctx, cx + 1, b.y + 22, 3, b.h - 25, a);
  pxRect(ctx, b.x + 3, b.y + b.h - 4, b.w - 6, 3, "#6c5136");
}
function drawMuseumWeaponRack(ctx, o) {
  const b = objectBox(o),
    a = o.accent || "#9fc8e5",
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2,
    icon = o.icon || "";
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "#6a4a2d");
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#2d2723");
  ctx.save();
  ctx.strokeStyle = a;
  ctx.fillStyle = a;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (icon.includes("gun") || icon === "megashark") {
    ctx.beginPath();
    ctx.moveTo(b.x + 7, cy);
    ctx.lineTo(b.x + b.w - 7, cy);
    ctx.stroke();
    pxRect(ctx, b.x + b.w - 14, cy - 4, 8, 7, a);
    pxRect(ctx, cx - 2, cy + 2, 5, 8, "#8a6848");
  } else if (icon === "hammer") {
    ctx.beginPath();
    ctx.moveTo(b.x + 8, b.y + b.h - 8);
    ctx.lineTo(b.x + b.w - 12, b.y + 12);
    ctx.stroke();
    ctx.save();
    ctx.translate(b.x + b.w - 11, b.y + 11);
    ctx.rotate(-Math.PI / 4);
    pxRect(ctx, -7, -4, 14, 8, a);
    ctx.restore();
  } else if (icon === "sunfury") {
    ctx.beginPath();
    ctx.moveTo(b.x + 8, b.y + 8);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    for (let i = 0; i < 4; i++)
      drawMuseumGlyph(ctx, "crystal", cx + 8 + i * 3, cy + 8 + i * 2, a, 2);
  } else if (icon.includes("staff") || icon === "last_prism") {
    ctx.beginPath();
    ctx.moveTo(b.x + 8, b.y + b.h - 8);
    ctx.lineTo(b.x + b.w - 9, b.y + 9);
    ctx.stroke();
    drawMuseumGlyph(
      ctx,
      icon === "last_prism" ? "crystal" : "spore",
      b.x + b.w - 9,
      b.y + 9,
      a,
      5,
    );
  } else {
    ctx.beginPath();
    if (icon === "nights_edge" || icon === "breaker_blade") {
      ctx.moveTo(b.x + 7, b.y + b.h - 8);
      ctx.lineTo(b.x + b.w - 8, b.y + 8);
    } else {
      ctx.moveTo(b.x + 7, b.y + 8);
      ctx.lineTo(b.x + b.w - 8, b.y + b.h - 8);
    }
    ctx.stroke();
    if (
      icon === "star_sword" ||
      icon === "terra_blade" ||
      icon === "excalibur" ||
      icon === "solar_eruption"
    )
      drawMuseumGlyph(
        ctx,
        icon === "solar_eruption" ? "soul_might" : "crystal",
        cx,
        cy,
        a,
        5,
      );
  }
  ctx.restore();
}
function drawMuseumItemFrame(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2,
    a = o.accent || "#d9d0a0";
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "#795b32");
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#d5b667");
  pxRect(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, "#25282b");
  if (o.icon === "shield") {
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 6, cy - 3);
    ctx.lineTo(cx + 4, cy + 5);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 4, cy + 5);
    ctx.lineTo(cx - 6, cy - 3);
    ctx.closePath();
    ctx.fill();
  } else if (o.icon === "mirror") {
    ctx.strokeStyle = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy + 4);
    ctx.lineTo(cx + 8, cy + 8);
    ctx.stroke();
  } else if (o.icon === "cloud") {
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.arc(cx - 5, cy + 1, 5, 0, Math.PI * 2);
    ctx.arc(cx, cy - 2, 6, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy + 1, 5, 0, Math.PI * 2);
    ctx.fill();
  } else drawMuseumGlyph(ctx, o.icon, cx, cy, a, 6);
}
function drawDisplay(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style);
  if (o.room === "museum") {
    pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, shade(p.base, -18));
    pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, p.base);
    pxRect(ctx, b.x + b.w / 2 - 4, b.y + 8, 8, 8, "#d1b45e");
    pxRect(ctx, b.x + 6, b.y + b.h - 8, b.w - 12, 4, p.dark);
  } else {
    pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, p.dark);
    pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, p.base);
  }
}
function drawPanel(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style);
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, p.dark);
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, p.base);
  const cols = ["#ff5b56", "#55d77d", "#56a9ff", "#ffd45a"];
  for (let i = 0; i < Math.min(4, Math.floor((b.w - 10) / 6)); i++)
    pxRect(ctx, b.x + 6 + i * 6, b.y + 7, 3, 3, cols[i]);
  pxRect(ctx, b.x + 5, b.y + b.h - 8, b.w - 10, 3, "#222b32");
}
function drawZone(ctx, o) {
  const b = objectBox(o),
    p = pstyle(o.style);
  ctx.save();
  ctx.globalAlpha = o.style === "spawn" ? 0.14 : 0.17;
  ctx.fillStyle = p.base;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = p.light;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
  ctx.restore();
}
function drawHoney(ctx, o) {
  const b = objectBox(o);
  ctx.save();
  ctx.globalAlpha = 0.88;
  pxRect(ctx, b.x, b.y + 2, b.w, b.h - 2, "#d89f35");
  ctx.globalAlpha = 1;
  pxRect(ctx, b.x, b.y + 1, b.w, 3, "#f6cf65");
  ctx.strokeStyle = "#8f5d24";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + 4);
  ctx.lineTo(b.x + b.w, b.y + 4);
  ctx.stroke();
  ctx.restore();
}
function drawLava(ctx, o) {
  const b = objectBox(o),
    t = CACHE_TILE;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#e84b16";
  ctx.fillRect(b.x, b.y + t * 0.48, b.w, t * 0.52);
  ctx.fillStyle = "#ff9e22";
  ctx.fillRect(b.x, b.y + t * 0.42, b.w, t * 0.13);
  ctx.fillStyle = "#ffd05a";
  for (let x = b.x + 3; x < b.x + b.w - 3; x += 11) {
    ctx.beginPath();
    ctx.arc(x, b.y + t * 0.47, 2, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawHoneyBubble(ctx, o) {
  const b = objectBox(o),
    t = CACHE_TILE;
  ctx.save();
  for (let yy = 0; yy < o.h; yy++)
    for (let xx = 0; xx < o.w; xx++) {
      const x = b.x + xx * t,
        y = b.y + yy * t;
      ctx.globalAlpha = 0.66;
      pxRect(ctx, x + 2, y + 3, t - 4, t - 5, "#d89f35");
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(117,214,239,.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(235,253,255,.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + 6, y + 5, 2, Math.PI, Math.PI * 1.8);
      ctx.stroke();
      ctx.strokeStyle = "#f6cf65";
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 6);
      ctx.lineTo(x + t - 3, y + 6);
      ctx.stroke();
    }
  ctx.restore();
}

function drawStarBottle(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2;
  ctx.strokeStyle = "#7c8eaa";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, b.y);
  ctx.lineTo(cx, b.y + 4);
  ctx.stroke();
  ctx.strokeStyle = "#d9e5ff";
  ctx.strokeRect(cx - 5, b.y + 5, 10, 12);
  ctx.fillStyle = "#a9c5ff";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 6);
  ctx.lineTo(cx + 2, b.y + 10);
  ctx.lineTo(cx + 6, b.y + 10);
  ctx.lineTo(cx + 3, b.y + 13);
  ctx.lineTo(cx + 4, b.y + 17);
  ctx.lineTo(cx, b.y + 14);
  ctx.lineTo(cx - 4, b.y + 17);
  ctx.lineTo(cx - 3, b.y + 13);
  ctx.lineTo(cx - 6, b.y + 10);
  ctx.lineTo(cx - 2, b.y + 10);
  ctx.closePath();
  ctx.fill();
}
function drawStatue(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2;
  if (o.style === "bast") {
    pxRect(ctx, b.x + 2, b.y + b.h - 5, b.w - 4, 4, "#a87b42");
    pxRect(ctx, b.x + 5, b.y + 9, b.w - 10, b.h - 14, "#d2ad67");
    ctx.fillStyle = "#e8c986";
    ctx.beginPath();
    ctx.moveTo(cx, b.y + 2);
    ctx.lineTo(cx - 6, b.y + 9);
    ctx.lineTo(cx - 3, b.y + 15);
    ctx.lineTo(cx + 3, b.y + 15);
    ctx.lineTo(cx + 6, b.y + 9);
    ctx.closePath();
    ctx.fill();
    pxRect(ctx, cx - 4, b.y + 2, 3, 5, "#d2ad67");
    pxRect(ctx, cx + 1, b.y + 2, 3, 5, "#d2ad67");
  } else {
    pxRect(ctx, b.x + 2, b.y + b.h - 5, b.w - 4, 4, "#646d76");
    pxRect(ctx, b.x + 4, b.y + 5, b.w - 8, b.h - 10, "#9aa2aa");
    ctx.fillStyle = "#dc5261";
    ctx.beginPath();
    ctx.moveTo(cx, b.y + 15);
    ctx.bezierCurveTo(cx - 8, b.y + 9, cx - 7, b.y + 4, cx, b.y + 9);
    ctx.bezierCurveTo(cx + 7, b.y + 4, cx + 8, b.y + 9, cx, b.y + 15);
    ctx.fill();
  }
}
function drawCampfire(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2;
  ctx.strokeStyle = "#81522e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(b.x + 4, b.y + b.h - 4);
  ctx.lineTo(b.x + b.w - 4, b.y + b.h - 8);
  ctx.moveTo(b.x + b.w - 4, b.y + b.h - 4);
  ctx.lineTo(b.x + 4, b.y + b.h - 8);
  ctx.stroke();
  ctx.fillStyle = "#ffb347";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 3);
  ctx.lineTo(cx - 7, b.y + b.h - 8);
  ctx.lineTo(cx, b.y + b.h - 5);
  ctx.lineTo(cx + 7, b.y + b.h - 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffe06e";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 7);
  ctx.lineTo(cx - 3, b.y + b.h - 8);
  ctx.lineTo(cx + 3, b.y + b.h - 8);
  ctx.closePath();
  ctx.fill();
}
function drawHeart(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2;
  ctx.strokeStyle = "#6f6f78";
  ctx.beginPath();
  ctx.moveTo(cx, b.y);
  ctx.lineTo(cx, b.y + 6);
  ctx.stroke();
  ctx.fillStyle = "#e45562";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 15);
  ctx.bezierCurveTo(cx - 10, b.y + 8, cx - 9, b.y + 1, cx, b.y + 7);
  ctx.bezierCurveTo(cx + 9, b.y + 1, cx + 10, b.y + 8, cx, b.y + 15);
  ctx.fill();
}
function drawObjectSprite(ctx, o) {
  if (o.kind === "zone") return drawZone(ctx, o);
  if (o.kind === "chest") return drawChest(ctx, o);
  if (o.kind === "station") return drawStation(ctx, o);
  if (o.kind === "npc") return drawNpc(ctx, o);
  if (o.kind === "door") return drawDoor(ctx, o);
  if (o.kind === "hatch") return drawHatch(ctx, o);
  if (o.kind === "furniture") return drawFurniture(ctx, o);
  if (o.kind === "bed") return drawBed(ctx, o);
  if (o.kind === "personal_storage") return drawPersonal(ctx, o);
  if (o.kind === "pylon") return drawPylon(ctx, o);
  if (o.kind === "teleporter") return drawTeleporter(ctx, o);
  if (o.kind === "planter") return drawPlanter(ctx, o);
  if (o.kind === "light") return drawLight(ctx, o);
  if (o.kind === "museum_trophy") return drawMuseumTrophy(ctx, o);
  if (o.kind === "museum_mannequin") return drawMuseumMannequin(ctx, o);
  if (o.kind === "museum_weapon_rack") return drawMuseumWeaponRack(ctx, o);
  if (o.kind === "museum_item_frame") return drawMuseumItemFrame(ctx, o);
  if (o.kind === "display") return drawDisplay(ctx, o);
  if (o.kind === "panel") return drawPanel(ctx, o);
  if (o.kind === "honey") return drawHoney(ctx, o);
  if (o.kind === "lava") return drawLava(ctx, o);
  if (o.kind === "honey_bubble") return drawHoneyBubble(ctx, o);
  if (o.kind === "star_bottle") return drawStarBottle(ctx, o);
  if (o.kind === "statue") return drawStatue(ctx, o);
  if (o.kind === "campfire") return drawCampfire(ctx, o);
  if (o.kind === "heart_lantern") return drawHeart(ctx, o);
  return drawDisplay(ctx, o);
}
function buildObjectCache() {
  const ctx = caches.objects.getContext("2d");
  ctx.clearRect(0, 0, caches.objects.width, caches.objects.height);
  const sorted = [...D.objects].sort(
    (a, b) => (a.kind === "zone" ? 0 : 1) - (b.kind === "zone" ? 0 : 1),
  );
  for (const o of sorted) drawObjectSprite(ctx, o);
}
function resize() {
  dpr = devicePixelRatio || 1;
  for (const c of [baseCanvas, objectCanvas, overlayCanvas]) {
    c.width = Math.round(viewport.clientWidth * dpr);
    c.height = Math.round(viewport.clientHeight * dpr);
  }
  schedule();
}
new ResizeObserver(resize).observe(viewport);
function saveCam(c = { ...cam }) {
  history.push(c);
  if (history.length > 40) history.shift();
}
function viewRect() {
  return {
    x1: cam.x,
    y1: cam.y,
    x2: cam.x + viewport.clientWidth / cam.scale,
    y2: cam.y + viewport.clientHeight / cam.scale,
  };
}
function drawCached(ctx, cache, alpha = 1) {
  const vr = viewRect(),
    ix1 = Math.max(vr.x1, D.bounds.xMin),
    iy1 = Math.max(vr.y1, D.bounds.yMin),
    ix2 = Math.min(vr.x2, D.bounds.xMax + 1),
    iy2 = Math.min(vr.y2, D.bounds.yMax + 1);
  if (ix2 <= ix1 || iy2 <= iy1) return;
  const sx = (ix1 - D.bounds.xMin) * CACHE_TILE,
    sy = (iy1 - D.bounds.yMin) * CACHE_TILE,
    sw = (ix2 - ix1) * CACHE_TILE,
    sh = (iy2 - iy1) * CACHE_TILE,
    dx = (ix1 - cam.x) * cam.scale,
    dy = (iy1 - cam.y) * cam.scale,
    dw = (ix2 - ix1) * cam.scale,
    dh = (iy2 - iy1) * cam.scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cache, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}
function clearCtx(ctx) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
}
function drawBase() {
  clearCtx(bctx);
  bctx.fillStyle = "#05090d";
  bctx.fillRect(0, 0, viewport.clientWidth, viewport.clientHeight);
  const mode = document.getElementById("mode").value;
  if (mode === "visual") {
    drawCached(bctx, caches.bg, 1);
    drawCached(bctx, caches.solid, 1);
  } else if (mode === "structure") {
    drawCached(bctx, caches.bg, 0.28);
    drawCached(bctx, caches.solid, 1);
  } else if (mode === "furniture") {
    drawCached(bctx, caches.bg, 0.32);
    drawCached(bctx, caches.solid, 0.48);
  } else if (mode === "arena" || mode === "wiring") {
    drawCached(bctx, caches.bg, 0.72);
    drawCached(bctx, caches.solid, 1);
  } else {
    drawCached(bctx, caches.bg, 1);
    drawCached(bctx, caches.solid, 0.16);
  }
}
function drawObjects() {
  clearCtx(octx);
  const mode = document.getElementById("mode").value;
  if (mode === "backgrounds") return;
  drawCached(
    octx,
    caches.objects,
    mode === "structure" ? 0.18 : mode === "wiring" ? 0.72 : 1,
  );
}
function sx(x) {
  return (x - cam.x) * cam.scale;
}
function sy(y) {
  return (y - cam.y) * cam.scale;
}
function world(px, py) {
  return { x: px / cam.scale + cam.x, y: py / cam.scale + cam.y };
}
function textLabel(ctx, text, x, y, size, fill = "#f4f7f9", align = "center") {
  ctx.font = `800 ${size}px system-ui`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(3,7,10,.92)";
  ctx.lineWidth = Math.max(2, size * 0.24);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

const WIRE_LABELS = {
  red: "Красный · ловушки ям",
  green: "Зелёный · сердца",
  blue: "Синий · актуаторы мостов",
  yellow: "Жёлтый · включение таймеров",
};
function engKey(x, y) {
  return `${x},${y}`;
}
function expandOrthPath(points) {
  const cells = [];
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (i === 0) {
      cells.push({ x, y });
      continue;
    }
    const [px, py] = points[i - 1];
    if (px !== x && py !== y)
      throw new Error(`Диагональный сегмент ${px},${py} → ${x},${y}`);
    const dx = Math.sign(x - px),
      dy = Math.sign(y - py);
    let cx = px,
      cy = py;
    while (cx !== x || cy !== y) {
      cx += dx;
      cy += dy;
      cells.push({ x: cx, y: cy });
    }
  }
  return cells;
}
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
function validatePitConfiguration() {
  const traps = ENG.devices.filter((o) => o.kind === "trap" && o.pitSide),
    bridges = ENG.devices.filter((o) => o.kind === "bridge"),
    levers = ENG.devices.filter((o) => o.kind === "lever" && o.pitSide);
  const trapOk = traps.filter((o) => o.actuatorInstalled === false).length;
  const bridgeOk = bridges.filter(
    (o) => o.actuatorInstalled === true && o.w === 16,
  ).length;
  const expectedCols = [
    [-18, "E"],
    [-1, "W"],
    [136, "E"],
    [153, "W"],
  ];
  let columnsOk = 0;
  for (const [x, facing] of expectedCols) {
    const col = traps
      .filter((o) => o.x === x && o.facing === facing)
      .map((o) => o.y)
      .sort((a, b) => a - b);
    if (col.length === 8 && col.every((y, i) => y === 56 + i)) columnsOk++;
  }
  const leverOk = levers.filter(
    (o) =>
      o.w === 2 &&
      o.h === 2 &&
      ((o.x === 1 && o.y === 56) || (o.x === 133 && o.y === 56)),
  ).length;
  const timersOk = ENG.devices.filter(
    (o) =>
      o.kind === "timer" &&
      o.pitSide &&
      ((o.x === 1 && o.y === 55) || (o.x === 134 && o.y === 55)),
  ).length;
  ENG.validation.pitStates = `traps ${trapOk}/32 · columns ${columnsOk}/4 · bridges ${bridgeOk}/2 · levers ${leverOk}/2 · timers ${timersOk}/2`;
  if (traps.length !== 32 || trapOk !== 32)
    ENG.validation.errors.push(
      "В ямах должно быть ровно 32 твёрдых Dart Trap без Actuator",
    );
  if (columnsOk !== 4)
    ENG.validation.errors.push(
      "Четыре столбца должны содержать по 8 Dart Trap на y56–63",
    );
  if (bridgeOk !== 2)
    ENG.validation.errors.push(
      "Оба актуируемых моста должны иметь по 16 блоков",
    );
  if (leverOk !== 2)
    ENG.validation.errors.push(
      "Lever должны стоять x1–2/y56–57 и x133–134/y56–57",
    );
  if (timersOk !== 2)
    ENG.validation.errors.push("Таймеры должны стоять x1/y55 и x134/y55");
  ENG.validation.status = ENG.validation.errors.length ? "FAIL" : "PASS";
}
prepareEngineering();
validateHeartWireTargets();
validatePitConfiguration();
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
function draw() {
  drawBase();
  drawObjects();
  drawOverlay();
}
function schedule() {
  if (!raf)
    raf = requestAnimationFrame(() => {
      raf = 0;
      draw();
    });
}
function focusRect(x1, y1, x2, y2, pad = 2, push = true) {
  if (push) saveCam();
  const w = x2 - x1 + 1,
    h = y2 - y1 + 1;
  cam.scale = Math.min(
    viewport.clientWidth / (w + pad * 2),
    viewport.clientHeight / (h + pad * 2),
  );
  cam.x = x1 - pad + (w + pad * 2 - viewport.clientWidth / cam.scale) / 2;
  cam.y = y1 - pad + (h + pad * 2 - viewport.clientHeight / cam.scale) / 2;
  schedule();
}
function fit(push = true) {
  focusRect(
    D.bounds.xMin,
    D.bounds.yMin,
    D.bounds.xMax,
    D.bounds.yMax,
    3,
    push,
  );
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
function roomAt(wx, wy) {
  return (
    D.rooms
      .filter((r) => wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2)
      .sort(
        (a, b) => (a.x2 - a.x1) * (a.y2 - a.y1) - (b.x2 - b.x1) * (b.y2 - b.y1),
      )[0] || null
  );
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
function escHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
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
viewport.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  drag = { x: e.clientX, y: e.clientY, start: { ...cam }, moved: false };
  viewport.setPointerCapture(e.pointerId);
  viewport.classList.add("dragging");
  hideTip();
});
viewport.addEventListener("pointermove", (e) => {
  const r = viewport.getBoundingClientRect(),
    px = e.clientX - r.left,
    py = e.clientY - r.top;
  if (drag) {
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    cam.x = drag.start.x - dx / cam.scale;
    cam.y = drag.start.y - dy / cam.scale;
    schedule();
    return;
  }
  const w = world(px, py),
    o = objectAt(w.x, w.y);
  if (o) showTip(e, o);
  else hideTip();
});
viewport.addEventListener("pointerup", (e) => {
  const r = viewport.getBoundingClientRect(),
    w = world(e.clientX - r.left, e.clientY - r.top),
    moved = drag?.moved,
    start = drag?.start;
  drag = null;
  viewport.classList.remove("dragging");
  if (moved) {
    saveCam(start);
  } else inspect(objectAt(w.x, w.y), w.x, w.y);
});
viewport.addEventListener("pointercancel", () => {
  drag = null;
  viewport.classList.remove("dragging");
});
viewport.addEventListener("pointerleave", () => {
  if (!drag) hideTip();
});
viewport.addEventListener("dblclick", (e) => {
  const r = viewport.getBoundingClientRect(),
    w = world(e.clientX - r.left, e.clientY - r.top),
    o = objectAt(w.x, w.y);
  if (o) focusRect(o.x, o.y, o.x + o.w - 1, o.y + o.h - 1, 4);
});
viewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const r = viewport.getBoundingClientRect(),
      mx = e.clientX - r.left,
      my = e.clientY - r.top,
      before = world(mx, my);
    if (!wheelSession) {
      wheelSession = { start: { ...cam } };
      setTimeout(() => {
        if (wheelSession) {
          saveCam(wheelSession.start);
          wheelSession = null;
        }
      }, 180);
    }
    const factor = Math.exp(-e.deltaY * 0.00125);
    cam.scale = Math.max(2, Math.min(32, cam.scale * factor));
    cam.x = before.x - mx / cam.scale;
    cam.y = before.y - my / cam.scale;
    schedule();
  },
  { passive: false },
);
for (const id of ["mode", "grid", "labels", "roomNames", "reserves"])
  document.getElementById(id).addEventListener("change", schedule);
document.getElementById("fit").onclick = () => fit();
document.getElementById("upper").onclick = () => focusRect(0, -7, 135, 41, 2);
document.getElementById("greenhouse").onclick = () =>
  focusRect(43, -8, 92, 7, 2);
document.getElementById("craft").onclick = () => focusRect(43, -7, 92, 42, 2);
document.getElementById("bossLeft").onclick = () => {
  document.getElementById("mode").value = "arena";
  focusRect(-202, 0, -31, 55, 2);
};
document.getElementById("arena").onclick = () => {
  document.getElementById("mode").value = "arena";
  focusRect(-4, 40, 139, 55, 2);
};
document.getElementById("pitsBtn").onclick = () => {
  document.getElementById("mode").value = "arena";
  focusRect(-34, 40, 169, 69, 2);
};
document.getElementById("museumBtn").onclick = () => {
  document.getElementById("mode").value = "visual";
  focusRect(6, 52, 129, 69, 2);
};
document.getElementById("wiringBtn").onclick = () => {
  document.getElementById("mode").value = "wiring";
  focusRect(-34, 40, 169, 69, 2);
};
document.getElementById("back").onclick = () => {
  const c = history.pop();
  if (c) {
    cam = c;
    schedule();
  }
};
document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  searchHit = null;
  if (!q) {
    schedule();
    return;
  }
  const dObj = D.objects.find((o) =>
    `${o.id} ${o.name} ${o.short || ""} ${o.desc || ""} ${o.chestItemRu || ""} ${o.chestItemEn || ""} ${o.chestPaintRu || ""} ${o.customName || ""}`
      .toLowerCase()
      .includes(q),
  );
  const eObj =
    !dObj &&
    [...ENG.devices, ...ENG.futureSlots].find((o) =>
      `${o.id} ${o.name} ${o.short || ""} ${o.desc || ""} ${(o.circuits || []).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  const circuit =
    !dObj &&
    !eObj &&
    ENG.circuits.find((c) =>
      `${c.id} ${c.name} ${c.role} ${c.desc}`.toLowerCase().includes(q),
    );
  const museumChapter =
    !dObj &&
    !eObj &&
    !circuit &&
    (D.museumChapters || []).find((ch) =>
      `${ch.id} ${ch.name} ${ch.short} ${ch.desc}`.toLowerCase().includes(q),
    );
  const o =
    dObj ||
    (eObj ? { ...eObj, engineering: true } : null) ||
    (circuit
      ? {
          id: circuit.id,
          name: circuit.name,
          x: circuit.paths[0][0][0],
          y: circuit.paths[0][0][1],
          w: 1,
          h: 1,
          kind: "wire",
          engineering: true,
          circuitId: circuit.id,
          wireColor: circuit.color,
          wireRole: circuit.role,
          endpoints: circuit.endpoints.join(" → "),
          stage: ENG.stage,
          desc: circuit.desc,
        }
      : null) ||
    (museumChapter
      ? {
          id: museumChapter.id,
          name: museumChapter.name,
          x: museumChapter.x1,
          y: museumChapter.y1,
          w: museumChapter.x2 - museumChapter.x1 + 1,
          h: museumChapter.y2 - museumChapter.y1 + 1,
          kind: "museum_chapter",
          desc: museumChapter.desc,
        }
      : null);
  const room =
    !o &&
    D.rooms.find((r) =>
      `${r.id} ${r.name} ${r.short}`.toLowerCase().includes(q),
    );
  if (o) {
    if (o.engineering) document.getElementById("mode").value = "wiring";
    searchHit = o;
    selected = o;
    focusRect(o.x, o.y, o.x + o.w - 1, o.y + o.h - 1, 5);
    inspect(o, o.x, o.y);
  } else if (room) {
    focusRect(room.x1, room.y1, room.x2, room.y2, 2);
    document.getElementById("iname").textContent = room.name;
    document.getElementById("idesc").textContent = room.desc;
    document.getElementById("ikv").innerHTML =
      `<div>Габарит</div><div>${room.x2 - room.x1 + 1}×${room.y2 - room.y1 + 1}</div><div>Координаты</div><div>x${room.x1}…${room.x2}, y${room.y1}…${room.y2}</div>`;
    schedule();
  }
});
function populate() {
  const v = D.validation,
    a = v.materialAudit;
  document.getElementById("status").innerHTML =
    `<span class="badge good">музей: ${v.museumDividers} двойных разделителей</span><span class="badge good">оверлеев музея: ${v.museumChapterOverlays}</span><span class="badge good">экспонаты музея: ${v.museumSampleObjects}</span><span class="badge good">главы заполнены: ${v.museumFilledChapters}</span><span class="badge good">световые ниши: ${v.museumLightingModules}</span><span class="badge good">левая босс-арена: ${v.leftBossArena}</span><span class="badge good">колонны: ${v.leftBossArenaColumns} × ${v.leftBossArenaColumnWidth}</span><span class="badge good">ярусы: ${v.leftBossArenaPlatforms.join("/")} · шаг ${v.leftBossArenaPlatformGap}</span><span class="badge good">Bubble-мёд: ${v.leftBossArenaHoneyBaths}</span><span class="badge good">лазерные навесы: ${v.leftBossArenaSolidCanopies}</span><span class="badge good">краски арены: ${v.leftBossArenaPaints}</span><span class="badge good">светящиеся модули: ${v.leftBossArenaGemsparkModules}</span><span class="badge good">улица: ${v.arenaInteriorHeight} тайлов · Dart ${v.streetDartTraps}</span><span class="badge good">старых оверлеев: ${v.arenaLegacyZoneOverlays}</span><span class="badge good">ямы: ${v.pitCount} × ${v.pitWidth}</span><span class="badge good">Dart в ямах: ${v.pitDartTraps}</span><span class="badge good">мосты: ${v.pitActuatedFloorBlocks} Actuator</span><span class="badge good">конвейеры: ${v.pitConveyorTiles}</span><span class="badge good">техпроходы: ${v.pitTechnicalPassages}</span><span class="badge good">ловушки: ${ENG.validation.pitStates}</span><span class="badge good">проводка: ${ENG.validation.status}</span><span class="badge good">Heart: ${ENG.validation.heartTargets}</span><span class="badge good">матрица: ${v.storageMatrix}</span><span class="badge good">сундуков: ${v.workingStorageChests}</span><span class="badge good">семейств: ${v.chestFamilies}</span><span class="badge good">этажей склада: ${v.storageFloors}</span><span class="badge good">теплица: ${v.greenhouseTiers} ярусов / ${v.greenhousePlanterTiles} мест</span><span class="badge good">имена сундуков: ${v.chestCustomNames} · max ${v.longestChestName}/20</span><span class="badge">крафтовая: ${v.craftWidth}×${v.craftHeight}</span><span class="badge good">материалы: PASS</span><span class="badge good">неизвестных блоков: ${a.unknownBlockMaterials}</span><span class="badge good">неизвестных стен: ${a.unknownWallMaterials}</span><span class="badge good">тайлов описано: ${a.tilesExplicit}/${a.tilesTotal}</span><span class="badge good">конфликтов слоя: 0</span>`;
  document.getElementById("roomRows").innerHTML = D.rooms
    .filter((r) => !r.id.startsWith("spawn"))
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td>${r.x2 - r.x1 + 1}×${r.y2 - r.y1 + 1}</td><td>${r.desc}</td></tr>`,
    )
    .join("");
  const storage = D.objects
    .filter((o) => o.kind === "chest" && o.room === "craft" && o.storageFloor)
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
buildBaseCaches();
buildObjectCache();
populate();
document.getElementById("mode").value = "arena";
focusRect(-34, 40, 169, 71, 2, false);
