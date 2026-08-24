// Scene-specific rendering for Ice Blocks and the Cavern Pylon.
const sharedUndergroundTileMaterial = tileMaterial;
tileMaterial = function drawUndergroundTileMaterial(ctx, mat, wx, wy) {
  if (mat === "snow_block_plain") {
    const x = cp(wx),
      y = cy(wy),
      t = CACHE_TILE,
      p = MAT.snow_block_plain;
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, t - 2, 3);
    ctx.fillStyle = "rgba(126, 177, 194, 0.32)";
    ctx.fillRect(x + 3, y + 9, 8, 1);
    if (seeded(wx, wy, 5) > 0.55) ctx.fillRect(x + 10, y + 12, 3, 1);
    return;
  }

  if (mat !== "ice_block_plain") {
    sharedUndergroundTileMaterial(ctx, mat, wx, wy);
    return;
  }

  const x = cp(wx),
    y = cy(wy),
    t = CACHE_TILE,
    p = MAT.ice_block_plain;
  rect(ctx, x, y, t, t, p.base, p.dark, 1);
  ctx.fillStyle = p.light;
  ctx.fillRect(x + 2, y + 2, 7, 1);
  ctx.fillRect(x + 10, y + 8, 4, 1);
  ctx.fillStyle = "rgba(225, 249, 255, 0.52)";
  ctx.fillRect(x + 3, y + 3, 2, 8);
  ctx.fillStyle = p.dark;
  ctx.fillRect(x + 8, y + 11, 5, 1);
  if (seeded(wx, wy, 3) > 0.52) {
    ctx.fillRect(x + 11, y + 3, 1, 4);
    ctx.fillRect(x + 9, y + 6, 3, 1);
  }
};

const sharedUndergroundDrawPylon = drawPylon;
drawPylon = function drawCavernPylon(ctx, o) {
  if (o.style !== "cavern_pylon") {
    sharedUndergroundDrawPylon(ctx, o);
    return;
  }

  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#7de1e0";
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#3d444b";
  ctx.beginPath();
  ctx.moveTo(cx, cy - b.h * 0.42);
  ctx.lineTo(cx + b.w * 0.31, cy);
  ctx.lineTo(cx, cy + b.h * 0.42);
  ctx.lineTo(cx - b.w * 0.31, cy);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#69d8d5";
  ctx.beginPath();
  ctx.moveTo(cx, cy - b.h * 0.31);
  ctx.lineTo(cx + b.w * 0.16, cy - 1);
  ctx.lineTo(cx, cy + b.h * 0.24);
  ctx.lineTo(cx - b.w * 0.16, cy - 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#bd91ef";
  ctx.fillRect(cx - 2, cy - 8, 4, 13);
  pxRect(ctx, b.x + 3, b.y + b.h - 5, b.w - 6, 4, "#4b5055");
};
