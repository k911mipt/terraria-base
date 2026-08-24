// Scene-specific rendering for Ice/Snow/Copper blocks, water and the Cavern Pylon.
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

  if (mat === "copper_brick_plain") {
    const x = cp(wx),
      y = cy(wy),
      t = CACHE_TILE,
      p = MAT.copper_brick_plain;
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    ctx.fillStyle = p.dark;
    ctx.fillRect(x, y + 7, t, 2);
    ctx.fillRect(x + (wy % 2 ? 4 : 11), y, 2, 8);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, t - 2, 1);
    ctx.fillRect(x + 3, y + 11, 5, 1);
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

function drawUndergroundWater(ctx, o) {
  const b = objectBox(o),
    gradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
  gradient.addColorStop(0, "#8be0ec");
  gradient.addColorStop(0.16, "#3aa8c4");
  gradient.addColorStop(1, "#173f68");

  ctx.save();
  ctx.globalAlpha = 0.93;
  ctx.fillStyle = gradient;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#d2fbff";
  ctx.fillRect(b.x, b.y, b.w, 3);

  ctx.strokeStyle = "rgba(178, 235, 248, 0.28)";
  ctx.lineWidth = 1;
  for (let yy = b.y + CACHE_TILE; yy < b.y + b.h; yy += CACHE_TILE) {
    ctx.beginPath();
    ctx.moveTo(b.x, yy + 0.5);
    ctx.lineTo(b.x + b.w, yy + 0.5);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(225, 252, 255, 0.56)";
  for (let i = 0; i < 16; i += 1) {
    const bx = b.x + 8 + seeded(i, o.x, 2) * (b.w - 16),
      by = b.y + 12 + seeded(o.y, i, 5) * (b.h - 24),
      r = 1 + Math.floor(seeded(i, o.y, 8) * 2);
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(219, 250, 255, 0.18)";
  for (let xx = b.x + 10; xx < b.x + b.w - 10; xx += 34) {
    ctx.fillRect(xx, b.y + 7, 18, 2);
  }
  ctx.restore();
}

function drawGoblinGreenTorch(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2;
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#78e86f";
  ctx.beginPath();
  ctx.arc(cx, b.y + b.h / 2, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  pxRect(ctx, cx - 1, b.y + 6, 2, 8, "#68482f");
  ctx.fillStyle = "#d8ffc4";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 1);
  ctx.lineTo(cx - 4, b.y + 8);
  ctx.lineTo(cx, b.y + 11);
  ctx.lineTo(cx + 4, b.y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#62cf58";
  ctx.beginPath();
  ctx.moveTo(cx, b.y + 3);
  ctx.lineTo(cx - 2, b.y + 8);
  ctx.lineTo(cx, b.y + 9);
  ctx.lineTo(cx + 2, b.y + 8);
  ctx.closePath();
  ctx.fill();
}

function drawGoblinCopperChandelier(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    top = b.y + 1,
    barY = b.y + 13;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#ffc273";
  ctx.beginPath();
  ctx.arc(cx, b.y + b.h * 0.58, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  pxRect(ctx, cx - 1, top, 2, 9, "#69412f");
  pxRect(ctx, b.x + 7, barY, b.w - 14, 3, "#a9633d");
  pxRect(ctx, b.x + 9, barY + 1, b.w - 18, 1, "#dc9862");

  for (const offset of [-13, 0, 13]) {
    const lampX = cx + offset;
    pxRect(ctx, lampX - 1, barY + 3, 2, 5, "#69412f");
    pxRect(ctx, lampX - 4, barY + 8, 8, 6, "#a9633d");
    pxRect(ctx, lampX - 3, barY + 9, 6, 4, "#ffd078");
    pxRect(ctx, lampX - 2, barY + 10, 4, 3, "#fff0b5");
  }
}

function drawGoblinToolFrame(ctx, o) {
  const b = objectBox(o),
    cx = b.x + b.w / 2,
    cy = b.y + b.h / 2;
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "#5b3a26");
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#bc7a4e");
  pxRect(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, "#26322b");

  ctx.save();
  ctx.strokeStyle = "#d9e1cf";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  if (o.id === "UG_TOOL_FRAME_WRENCH") {
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + 6);
    ctx.lineTo(cx + 4, cy - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 6, 4, 0.3, Math.PI * 1.7);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 7);
    ctx.lineTo(cx + 6, cy + 6);
    ctx.moveTo(cx + 7, cy - 7);
    ctx.lineTo(cx - 6, cy + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 6, cy + 7, 3, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy + 7, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

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

const sharedUndergroundDrawLight = drawLight;
drawLight = function drawUndergroundLight(ctx, o) {
  if (o.id === "UG_GOBLIN_GREEN_TORCH") return drawGoblinGreenTorch(ctx, o);
  if (o.id === "UG_GOBLIN_CHANDELIER") return drawGoblinCopperChandelier(ctx, o);
  return sharedUndergroundDrawLight(ctx, o);
};

const sharedUndergroundDrawObjectSprite = drawObjectSprite;
drawObjectSprite = function drawUndergroundObjectSprite(ctx, o) {
  if (o.kind === "water") return drawUndergroundWater(ctx, o);
  if (o.id === "UG_TOOL_FRAME_WRENCH" || o.id === "UG_TOOL_FRAME_CUTTER") {
    return drawGoblinToolFrame(ctx, o);
  }
  return sharedUndergroundDrawObjectSprite(ctx, o);
};
