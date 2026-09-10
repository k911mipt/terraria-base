import { engKey } from './core.js';
import { engineeringAt } from './overlay.js';

// Effective tile/object lookup and world coordinates. No textures or inspector UI.
export function world(planner, px, py) {
  return { x: px / planner.cam.scale + planner.cam.x, y: py / planner.cam.scale + planner.cam.y };
}

export function objectAt(planner, wx, wy) {
  if (["arena", "wiring"].includes(planner.document.getElementById("mode").value)) {
    const e = engineeringAt(planner, wx, wy);
    if (e) return e;
  }
  const nonZones = planner.D.objects.filter((o) => o.kind !== "zone");
  for (let i = nonZones.length - 1; i >= 0; i--) {
    const o = nonZones[i];
    if (wx >= o.x && wx < o.x + o.w && wy >= o.y && wy < o.y + o.h) return o;
  }
  const zones = planner.D.objects.filter((o) => o.kind === "zone");
  for (let i = zones.length - 1; i >= 0; i--) {
    const o = zones[i];
    if (wx >= o.x && wx < o.x + o.w && wy >= o.y && wy < o.y + o.h) return o;
  }
  return null;
}

export function rectAt(arr, wx, wy) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const r = arr[i];
    if (wx >= r.x1 && wx <= r.x2 && wy >= r.y1 && wy <= r.y2) return r;
  }
  return null;
}

export function objectsAtTile(planner, x, y) {
  const out = planner.D.objects.filter(
    (o) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h,
  );
  if (["arena", "wiring"].includes(planner.document.getElementById("mode").value)) {
    for (const o of [...planner.ENG.devices, ...planner.ENG.futureSlots])
      if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) out.push(o);
    for (const c of planner.ENG.wireIndex.get(engKey(x, y)) || [])
      out.push({ id: c.id });
  }
  return out;
}
