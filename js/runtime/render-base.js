// Base-layer and structural Canvas rendering.
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

function draw() {
  drawBase();
  drawObjects();
  drawOverlay();
}
