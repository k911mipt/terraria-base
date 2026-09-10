import { cp, cy, seeded } from './core.js';
import { drawGlassPlatformTile, drawPlatformTile } from './render-base.js';
import { CACHE_TILE } from './state.js';

// Canvas tile textures and explicit material-to-function dispatch.
export function rect(ctx, x, y, w, h, fill, stroke = null, lw = 1) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

export function drawCommonTileMaterial(planner, ctx, mat, wx, wy) {
  const p = planner.MAT[mat],
    x = cp(planner, wx),
    y = cy(planner, wy),
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
    ctx.fillStyle = planner.MAT.mud.base;
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

export function drawCommonTileWall(planner, ctx, mat, wx, wy) {
  const p = planner.WALL[mat],
    x = cp(planner, wx),
    y = cy(planner, wy),
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

export function applyTileShape(planner, ctx, shape, wx, wy) {
  if (!shape) return;
  const x = cp(planner, wx),
    y = cy(planner, wy),
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

export function pxRect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function registerTileRenderer(planner, layer, materials, draw) {
  const registry = Object.hasOwn(planner.TILE_RENDERERS, layer) ? planner.TILE_RENDERERS[layer] : null;
  if (!registry || !Array.isArray(materials) || !materials.length ||
      materials.some(id => typeof id !== "string" || !id.trim()) || typeof draw !== "function")
    throw new Error("Invalid tile renderer registration");
  if (new Set(materials).size !== materials.length || materials.some(id => registry.has(id)))
    throw new Error(`Duplicate tile renderer: ${layer} / ${materials.join(", ")}`);
  for (const id of materials) registry.set(id, draw);
}
export function tileRenderer(planner, layer, material) {
  const registry = Object.hasOwn(planner.TILE_RENDERERS, layer) ? planner.TILE_RENDERERS[layer] : null;
  const draw = registry?.get(material);
  return typeof draw === "function" ? draw : null;
}
export function validateTileRenderers(planner, scene) {
  const errors = [];
  for (const [layer, regions] of [["block",scene.solids],["wall",scene.backgrounds]]) {
    const checked = new Set();
    for (const region of regions) {
      if (checked.has(region.mat)) continue;
      checked.add(region.mat);
      if (!tileRenderer(planner, layer, region.mat))
        errors.push(`${scene.title}: ${layer} ${region.mat} at X${region.x1} Y${region.y1}: unregistered tile renderer`);
    }
  }
  return errors;
}
export function drawRegisteredTile(planner, layer, ctx, mat, wx, wy) {
  const draw = tileRenderer(planner, layer, mat);
  if (!draw) throw new Error(`Unregistered tile renderer: ${layer} / ${mat} X${wx} Y${wy}`);
  return draw(ctx, mat, wx, wy);
}
export function tileMaterial(planner, ctx, mat, wx, wy) { return drawRegisteredTile(planner, "block", ctx, mat, wx, wy); }
export function tileWall(planner, ctx, mat, wx, wy) { return drawRegisteredTile(planner, "wall", ctx, mat, wx, wy); }

export function registerCommonTileRenderers(planner) {


  registerTileRenderer(planner, "block", [
    "gray_brick", "black_slab", "boreal_wood", "glass", "marble", "mushroom_block", "mud",
    "mushroom_grass", "sandstone_block_plain", "cloud_block_plain", "bubble",
    "conveyor_left", "conveyor_right", "dart_trap_e", "dart_trap_w",
  ], drawCommonTileMaterial.bind(null, planner));
  registerTileRenderer(planner, "block", ["boreal_platform", "boreal_platform_plain", "mushroom_platform"],
    (ctx, mat, wx, wy) => drawPlatformTile(planner, ctx, wx, wy, mat));
  registerTileRenderer(planner, "block", ["glass_platform"], (ctx, mat, wx, wy) => drawGlassPlatformTile(planner, ctx, wx, wy));
  registerTileRenderer(planner, "wall", [
    "accessory_wall", "arena_wall", "boreal_wall", "clinic_wall", "cloud_wall_plain", "copper_wall_plain",
    "diamond_gemspark_wall", "engineer_orange_wall", "fishing_wall", "food_wall", "glass_wall",
    "goblin_green_wall", "gray_wall", "industrial_wall", "living_wall", "magic_cyan_wall",
    "marble_plain_wall", "museum_biomes", "museum_center", "museum_early", "museum_final",
    "museum_jungle", "museum_mechs", "museum_wof", "mushroom_wall", "player1_accent_wall",
    "player1_wall", "player2_accent_wall", "player2_wall", "princess_pink_wall", "purple_wall",
    "sandstone_wall_plain", "tech_cyan_wall", "tower_wall",
  ], drawCommonTileWall.bind(null, planner));
}
