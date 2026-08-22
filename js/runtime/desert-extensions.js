// Scene-specific drawing extensions without changing the shared main-base runtime.
const sharedTileMaterial = tileMaterial;
tileMaterial = function drawDesertTileMaterial(ctx, mat, wx, wy) {
  const x = cp(wx),
    y = cy(wy),
    t = CACHE_TILE;

  if (mat === "palm_platform") {
    drawPlatformTile(ctx, wx, wy, mat);
    return;
  }

  if (mat === "sand") {
    const p = MAT.sand;
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    for (let i = 0; i < 5; i++) {
      const qx = x + 2 + Math.floor(seeded(wx, wy, i) * 12),
        qy = y + 2 + Math.floor(seeded(wy, wx, i + 4) * 12);
      ctx.fillStyle = i % 2 ? p.dark : p.light;
      ctx.fillRect(qx, qy, i % 3 === 0 ? 2 : 1, 1);
    }
    return;
  }

  if (mat === "palm_wood") {
    const p = MAT.palm_wood;
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    ctx.fillStyle = p.dark;
    ctx.fillRect(x + 4, y, 2, t);
    ctx.fillRect(x + 11, y, 1, t);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, 2, t - 2);
    if (seeded(wx, wy) > 0.45) {
      ctx.fillStyle = p.dark;
      ctx.fillRect(x + 8, y + 7, 3, 2);
    }
    return;
  }

  sharedTileMaterial(ctx, mat, wx, wy);
};

const sharedTileWall = tileWall;
tileWall = function drawDesertTileWall(ctx, mat, wx, wy) {
  if (mat !== "palm_wall") {
    sharedTileWall(ctx, mat, wx, wy);
    return;
  }

  const p = WALL.palm_wall,
    x = cp(wx),
    y = cy(wy),
    t = CACHE_TILE;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = p[0];
  ctx.fillRect(x, y, t, t);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = p[1];
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 5, y);
  ctx.lineTo(x + 5, y + t);
  ctx.moveTo(x + 11, y);
  ctx.lineTo(x + 11, y + t);
  ctx.stroke();
  ctx.fillStyle = "rgba(236, 193, 116, 0.18)";
  ctx.fillRect(x + 1, y + 1, 2, t - 2);
};

function drawWater(ctx, o) {
  const b = objectBox(o),
    gradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
  gradient.addColorStop(0, "#47c1ca");
  gradient.addColorStop(0.18, "#258da4");
  gradient.addColorStop(1, "#123e5b");
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = gradient;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#a3eff0";
  ctx.fillRect(b.x, b.y, b.w, 3);
  ctx.strokeStyle = "rgba(125, 222, 232, 0.28)";
  ctx.lineWidth = 1;
  for (let yy = b.y + CACHE_TILE; yy < b.y + b.h; yy += CACHE_TILE) {
    ctx.beginPath();
    ctx.moveTo(b.x, yy + 0.5);
    ctx.lineTo(b.x + b.w, yy + 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(204, 250, 252, 0.5)";
  for (let i = 0; i < 18; i++) {
    const bx = b.x + 8 + seeded(i, o.x, 2) * (b.w - 16),
      by = b.y + 12 + seeded(o.y, i, 5) * (b.h - 24),
      r = 1 + Math.floor(seeded(i, o.y, 8) * 2);
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCactus(ctx, o) {
  const b = objectBox(o),
    x = b.x + b.w / 2;
  ctx.fillStyle = "#1f5e30";
  ctx.fillRect(x - 4, b.y + 3, 8, b.h - 3);
  ctx.fillRect(x - 10, b.y + b.h * 0.38, 8, 5);
  ctx.fillRect(x - 10, b.y + b.h * 0.24, 4, b.h * 0.2);
  ctx.fillRect(x + 2, b.y + b.h * 0.58, 9, 5);
  ctx.fillRect(x + 7, b.y + b.h * 0.42, 4, b.h * 0.2);
  ctx.fillStyle = "#4aa24c";
  ctx.fillRect(x - 2, b.y + 4, 2, b.h - 7);
}

function drawPalmTree(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2;
  ctx.fillStyle = "#57351f";
  ctx.fillRect(cx - 3, b.y + b.h * 0.28, 7, b.h * 0.72);
  ctx.fillStyle = "#9b6738";
  for (let yy = b.y + b.h * 0.32; yy < b.y + b.h; yy += 9)
    ctx.fillRect(cx - 2, yy, 5, 3);
  ctx.fillStyle = "#2c853e";
  const cy = b.y + b.h * 0.24;
  for (const [dx, dy, w, h] of [
    [-20, -2, 19, 6],
    [1, -2, 19, 6],
    [-13, -11, 16, 6],
    [-3, -16, 8, 17],
    [-11, 4, 14, 6],
    [0, 4, 14, 6],
  ])
    ctx.fillRect(cx + dx, cy + dy, w, h);
  ctx.fillStyle = "#57bd54";
  ctx.fillRect(cx - 9, cy - 9, 10, 4);
  ctx.fillRect(cx + 1, cy + 1, 12, 4);
}

const sharedDrawPylon = drawPylon;
drawPylon = function drawDesertPylon(ctx, o) {
  if (o.style !== "desert_pylon") {
    sharedDrawPylon(ctx, o);
    return;
  }
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2;
  ctx.fillStyle = "#7a5428";
  ctx.beginPath();
  ctx.moveTo(cx, cy - b.h * 0.42);
  ctx.lineTo(cx + b.w * 0.3, cy);
  ctx.lineTo(cx, cy + b.h * 0.42);
  ctx.lineTo(cx - b.w * 0.3, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f0c45d";
  ctx.beginPath();
  ctx.moveTo(cx, cy - b.h * 0.32);
  ctx.lineTo(cx + b.w * 0.17, cy);
  ctx.lineTo(cx, cy + b.h * 0.23);
  ctx.lineTo(cx - b.w * 0.17, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#75d6d5";
  ctx.fillRect(cx - 2, cy - 8, 4, 15);
  pxRect(ctx, b.x + 3, b.y + b.h - 5, b.w - 6, 4, "#9f7135");
};

const sharedDrawObjectSprite = drawObjectSprite;
drawObjectSprite = function drawDesertObjectSprite(ctx, o) {
  if (o.kind === "water") return drawWater(ctx, o);
  if (o.kind === "cactus") return drawCactus(ctx, o);
  if (o.kind === "palm_tree") return drawPalmTree(ctx, o);
  return sharedDrawObjectSprite(ctx, o);
};
