// Small shared helpers for cached coordinates, colors, camera history and wire paths.
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

function objectBox(o) {
  return { x: cp(o.x), y: cy(o.y), w: o.w * CACHE_TILE, h: o.h * CACHE_TILE };
}

function chestPalette(o) {
  const c =
    o.paintColor ||
    CHEST_FAMILY_BASE[o.chestFamily] ||
    STYLE[o.style] ||
    "#74808a";
  return { base: c, dark: shade(c, -34), light: shade(c, 38) };
}

function saveCam(c = { ...cam }) {
  history.push(c);
  if (history.length > 40) history.shift();
}

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

function schedule() {
  if (!raf)
    raf = requestAnimationFrame(() => {
      raf = 0;
      draw();
    });
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
