import { cp, cy, objectBox, seeded } from './core.js';
import { drawBed, drawPersonal } from './render-base.js';
import { drawChest, drawFurniture, drawNpc, drawStation, registerObjectRenderer } from './render-objects.js';
import { pxRect, rect, registerTileRenderer } from './render-tiles.js';
import { CACHE_TILE } from './state.js';

// Scene-specific rendering for Ice/Snow/Copper blocks, water and the Cavern Pylon.
export function drawUndergroundTileMaterial(planner, ctx, mat, wx, wy) {
  if (mat === "snow_block_plain") {
    const x = cp(planner, wx),
      y = cy(planner, wy),
      t = CACHE_TILE,
      p = planner.MAT.snow_block_plain;
    rect(ctx, x, y, t, t, p.base, p.dark, 1);
    ctx.fillStyle = p.light;
    ctx.fillRect(x + 1, y + 1, t - 2, 3);
    ctx.fillStyle = "rgba(126, 177, 194, 0.32)";
    ctx.fillRect(x + 3, y + 9, 8, 1);
    if (seeded(wx, wy, 5) > 0.55) ctx.fillRect(x + 10, y + 12, 3, 1);
    return;
  }

  if (mat === "copper_brick_plain") {
    const x = cp(planner, wx),
      y = cy(planner, wy),
      t = CACHE_TILE,
      p = planner.MAT.copper_brick_plain;
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
    throw new Error(`Unregistered scene tile: ${mat}`);
  }

  const x = cp(planner, wx),
    y = cy(planner, wy),
    t = CACHE_TILE,
    p = planner.MAT.ice_block_plain;
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
}

export function drawUndergroundWater(planner, ctx, o) {
  const b = objectBox(planner, o),
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

export function drawGoblinGreenTorch(planner, ctx, o) {
  const b = objectBox(planner, o),
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

export function drawGoblinCopperChandelier(planner, ctx, o) {
  const b = objectBox(planner, o),
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

export function drawGoblinToolFrame(planner, ctx, o) {
  const b = objectBox(planner, o),
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

export function drawCavernPylon(planner, ctx, o) {
  const b = objectBox(planner, o),
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
}

// Scene-local room lighting and wall-display sprites.
export function drawUndergroundV3IceLantern(planner, ctx, o) {
  const b = objectBox(planner, o), cx = b.x + b.w / 2;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#91e9ff";
  ctx.beginPath();
  ctx.arc(cx, b.y + b.h * 0.58, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  pxRect(ctx, cx - 1, b.y, 2, 5, "#4c7180");
  pxRect(ctx, cx - 5, b.y + 5, 10, b.h - 7, "#3e7487");
  pxRect(ctx, cx - 4, b.y + 6, 8, b.h - 9, "#79dceb");
  pxRect(ctx, cx - 2, b.y + 8, 4, Math.max(3, b.h - 13), "#e9fdff");
}

export function drawUndergroundV3CrystalChandelier(planner, ctx, o) {
  const b = objectBox(planner, o), cx = b.x + b.w / 2, barY = b.y + 13;
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#b7efff";
  ctx.beginPath();
  ctx.arc(cx, b.y + b.h * 0.58, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  pxRect(ctx, cx - 1, b.y, 2, 9, "#7aa9b8");
  pxRect(ctx, b.x + 7, barY, b.w - 14, 3, "#a9d9e6");
  for (const offset of [-13, 0, 13]) {
    const lampX = cx + offset;
    pxRect(ctx, lampX - 1, barY + 3, 2, 5, "#789aaa");
    ctx.fillStyle = "#d8f8ff";
    ctx.beginPath();
    ctx.moveTo(lampX, barY + 7);
    ctx.lineTo(lampX + 5, barY + 13);
    ctx.lineTo(lampX, barY + 18);
    ctx.lineTo(lampX - 5, barY + 13);
    ctx.closePath();
    ctx.fill();
    pxRect(ctx, lampX - 2, barY + 11, 4, 5, "#ffffff");
  }
}

export function drawUndergroundV3CrystalCandelabra(planner, ctx, o) {
  const b = objectBox(planner, o), cx = b.x + b.w / 2, baseY = b.y + b.h - 4;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#c5f3ff";
  ctx.beginPath();
  ctx.arc(cx, b.y + 10, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  pxRect(ctx, cx - 4, baseY, 8, 3, "#83aebb");
  pxRect(ctx, cx - 1, b.y + 6, 2, baseY - b.y - 6, "#9cc8d4");
  for (const dx of [-4, 0, 4]) {
    pxRect(ctx, cx + dx - 1, b.y + 5, 2, 5, "#9cc8d4");
    pxRect(ctx, cx + dx - 2, b.y + 2, 4, 4, "#f0fdff");
  }
}

export function drawUndergroundV3MechanicFrame(planner, ctx, o) {
  const b = objectBox(planner, o), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  pxRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "#26373f");
  pxRect(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, "#8d593d");
  pxRect(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, "#20343b");
  if (o.id === "UG_MECH_TIMER_FRAME") {
    ctx.strokeStyle = "#e6f4f4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 4, cy + 2);
    ctx.stroke();
  } else {
    pxRect(ctx, cx - 1, cy - 8, 2, 12, "#d9e5e8");
    pxRect(ctx, cx - 6, cy + 4, 12, 3, "#a7c4ca");
    pxRect(ctx, cx + 3, cy - 7, 4, 4, "#d8a04a");
  }
}

export function registerUndergroundRenderers(planner) {


  registerObjectRenderer(planner, "water", ["fishing_ice"], drawUndergroundWater.bind(null, planner));
  registerObjectRenderer(planner, "pylon", ["cavern_pylon"], drawCavernPylon.bind(null, planner));
  registerObjectRenderer(planner, "light", ["green_torch"], drawGoblinGreenTorch.bind(null, planner));
  registerObjectRenderer(planner, "light", ["copper_chandelier"], drawGoblinCopperChandelier.bind(null, planner));
  registerObjectRenderer(planner, "light", ["ice_lantern"], drawUndergroundV3IceLantern.bind(null, planner));
  registerObjectRenderer(planner, "light", ["crystal_chandelier"], drawUndergroundV3CrystalChandelier.bind(null, planner));
  registerObjectRenderer(planner, "light", ["crystal_candelabra"], drawUndergroundV3CrystalCandelabra.bind(null, planner));
  registerObjectRenderer(planner, "display", ["goblin_display"], drawGoblinToolFrame.bind(null, planner));
  registerObjectRenderer(planner, "display", ["mechanic_display"], drawUndergroundV3MechanicFrame.bind(null, planner));
  registerObjectRenderer(planner, "npc", ["mechanic_npc", "goblin_npc", "princess_npc"], drawNpc.bind(null, planner));
  registerObjectRenderer(planner, "furniture", ["mechanic", "tinkerer_station", "princess_room", "fishing_blue"], drawFurniture.bind(null, planner));
  registerObjectRenderer(planner, "chest", ["special"], drawChest.bind(null, planner));
  registerObjectRenderer(planner, "station", ["tinkerer_station"], drawStation.bind(null, planner));
  registerObjectRenderer(planner, "personal_storage", ["special"], drawPersonal.bind(null, planner));
  registerObjectRenderer(planner, "bed", ["princess_room"], drawBed.bind(null, planner));

  registerTileRenderer(planner, "block", ["snow_block_plain", "copper_brick_plain", "ice_block_plain"], drawUndergroundTileMaterial.bind(null, planner));
}
