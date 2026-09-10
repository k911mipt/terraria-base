import { draw } from './render-base.js';
import { CACHE_TILE, CHEST_FAMILY_BASE } from './state.js';

// Small shared helpers for cached coordinates, colors, camera history and wire paths.
export function cp(planner, x) {
  return (x - planner.D.bounds.xMin) * CACHE_TILE;
}

export function cy(planner, y) {
  return (y - planner.D.bounds.yMin) * CACHE_TILE;
}

export function seeded(x, y, s = 0) {
  let n = ((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0;
  n = ((n ^ (n >> 13)) * 1274126177) >>> 0;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

export function pstyle(planner, style) {
  const c = planner.STYLE[style] || "#74808a";
  return { base: c, dark: shade(c, -32), light: shade(c, 35) };
}

export function shade(hex, amt) {
  let n = parseInt(hex.slice(1), 16),
    r = Math.max(0, Math.min(255, (n >> 16) + amt)),
    g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)),
    b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function objectBox(planner, o) {
  return { x: cp(planner, o.x), y: cy(planner, o.y), w: o.w * CACHE_TILE, h: o.h * CACHE_TILE };
}

export function chestPalette(planner, o) {
  const c =
    o.paintColor ||
    CHEST_FAMILY_BASE[o.chestFamily] ||
    planner.STYLE[o.style] ||
    "#74808a";
  return { base: c, dark: shade(c, -34), light: shade(c, 38) };
}

export function saveCam(planner, c = { ...planner.cam }) {
  planner.history.push(c);
  if (planner.history.length > 40) planner.history.shift();
}

export function engKey(x, y) {
  return `${x},${y}`;
}

export function expandOrthPath(points) {
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

export function schedule(planner) {
  if (!planner.destroyed && !planner.raf)
    planner.raf = planner.window.requestAnimationFrame(() => {
      planner.raf = 0;
      if (planner.destroyed) return;
      draw(planner);
      if (planner.startupComplete) planner.viewport.dataset.ready = "true";
    });
}

export function roomAt(scene, wx, wy) {
  return (
    scene.rooms
      .filter((r) => wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2)
      .sort(
        (a, b) => (a.x2 - a.x1) * (a.y2 - a.y1) - (b.x2 - b.x1) * (b.y2 - b.y1),
      )[0] || null
  );
}

// Ownership and tile location are different at shared doors and room borders.
export function roomForObject(scene, object) {
  if (!object) return null;
  // Legacy base doors use room: "" to mean no declared ownership.
  if (Object.hasOwn(object, "room") && object.room !== "") {
    const room = scene.rooms.find((candidate) => candidate.id === object.room);
    if (!room)
      throw new Error(`${scene.title}: object ${object.id} references unknown room ${object.room}`);
    return room;
  }
  return roomAt(scene, object.x, object.y);
}
