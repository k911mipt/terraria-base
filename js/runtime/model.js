// Effective tile/object lookup and world coordinates. No textures or inspector UI.
function world(px, py) {
  return { x: px / cam.scale + cam.x, y: py / cam.scale + cam.y };
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
