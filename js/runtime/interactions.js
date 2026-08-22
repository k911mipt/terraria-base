// Pointer, wheel, navigation-button and search event bindings.
viewport.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  drag = { x: e.clientX, y: e.clientY, start: { ...cam }, moved: false };
  viewport.setPointerCapture(e.pointerId);
  viewport.classList.add("dragging");
  hideTip();
});

viewport.addEventListener("pointermove", (e) => {
  const r = viewport.getBoundingClientRect(),
    px = e.clientX - r.left,
    py = e.clientY - r.top;
  if (drag) {
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    cam.x = drag.start.x - dx / cam.scale;
    cam.y = drag.start.y - dy / cam.scale;
    schedule();
    return;
  }
  const w = world(px, py),
    o = objectAt(w.x, w.y);
  if (o) showTip(e, o);
  else hideTip();
});

viewport.addEventListener("pointerup", (e) => {
  const r = viewport.getBoundingClientRect(),
    w = world(e.clientX - r.left, e.clientY - r.top),
    moved = drag?.moved,
    start = drag?.start;
  drag = null;
  viewport.classList.remove("dragging");
  if (moved) {
    saveCam(start);
  } else inspect(objectAt(w.x, w.y), w.x, w.y);
});

viewport.addEventListener("pointercancel", () => {
  drag = null;
  viewport.classList.remove("dragging");
});

viewport.addEventListener("pointerleave", () => {
  if (!drag) hideTip();
});

viewport.addEventListener("dblclick", (e) => {
  const r = viewport.getBoundingClientRect(),
    w = world(e.clientX - r.left, e.clientY - r.top),
    o = objectAt(w.x, w.y);
  if (o) focusRect(o.x, o.y, o.x + o.w - 1, o.y + o.h - 1, 4);
});

viewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const r = viewport.getBoundingClientRect(),
      mx = e.clientX - r.left,
      my = e.clientY - r.top,
      before = world(mx, my);
    if (!wheelSession) {
      wheelSession = { start: { ...cam } };
      setTimeout(() => {
        if (wheelSession) {
          saveCam(wheelSession.start);
          wheelSession = null;
        }
      }, 180);
    }
    const factor = Math.exp(-e.deltaY * 0.00125);
    cam.scale = Math.max(2, Math.min(32, cam.scale * factor));
    cam.x = before.x - mx / cam.scale;
    cam.y = before.y - my / cam.scale;
    schedule();
  },
  { passive: false },
);

for (const id of ["mode", "grid", "labels", "roomNames", "reserves"])
  document.getElementById(id).addEventListener("change", schedule);

document.getElementById("fit").onclick = () => fit();

document.getElementById("upper").onclick = () => focusRect(0, -7, 135, 41, 2);

document.getElementById("greenhouse").onclick = () =>
  focusRect(43, -8, 92, 7, 2);

document.getElementById("craft").onclick = () => focusRect(43, -7, 92, 42, 2);

document.getElementById("bossLeft").onclick = () => {
  document.getElementById("mode").value = "arena";
  focusRect(-202, 0, -31, 55, 2);
};

document.getElementById("arena").onclick = () => {
  document.getElementById("mode").value = "arena";
  focusRect(-4, 40, 139, 55, 2);
};

document.getElementById("pitsBtn").onclick = () => {
  document.getElementById("mode").value = "arena";
  focusRect(-34, 40, 169, 69, 2);
};

document.getElementById("museumBtn").onclick = () => {
  document.getElementById("mode").value = "visual";
  focusRect(6, 52, 129, 69, 2);
};

document.getElementById("wiringBtn").onclick = () => {
  document.getElementById("mode").value = "wiring";
  focusRect(-34, 40, 169, 69, 2);
};

document.getElementById("back").onclick = () => {
  const c = history.pop();
  if (c) {
    cam = c;
    schedule();
  }
};

document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  searchHit = null;
  if (!q) {
    schedule();
    return;
  }
  const dObj = D.objects.find((o) =>
    `${o.id} ${o.name} ${o.short || ""} ${o.desc || ""} ${o.chestItemRu || ""} ${o.chestItemEn || ""} ${o.chestPaintRu || ""} ${o.customName || ""}`
      .toLowerCase()
      .includes(q),
  );
  const eObj =
    !dObj &&
    [...ENG.devices, ...ENG.futureSlots].find((o) =>
      `${o.id} ${o.name} ${o.short || ""} ${o.desc || ""} ${(o.circuits || []).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  const circuit =
    !dObj &&
    !eObj &&
    ENG.circuits.find((c) =>
      `${c.id} ${c.name} ${c.role} ${c.desc}`.toLowerCase().includes(q),
    );
  const museumChapter =
    !dObj &&
    !eObj &&
    !circuit &&
    (D.museumChapters || []).find((ch) =>
      `${ch.id} ${ch.name} ${ch.short} ${ch.desc}`.toLowerCase().includes(q),
    );
  const o =
    dObj ||
    (eObj ? { ...eObj, engineering: true } : null) ||
    (circuit
      ? {
          id: circuit.id,
          name: circuit.name,
          x: circuit.paths[0][0][0],
          y: circuit.paths[0][0][1],
          w: 1,
          h: 1,
          kind: "wire",
          engineering: true,
          circuitId: circuit.id,
          wireColor: circuit.color,
          wireRole: circuit.role,
          endpoints: circuit.endpoints.join(" → "),
          stage: ENG.stage,
          desc: circuit.desc,
        }
      : null) ||
    (museumChapter
      ? {
          id: museumChapter.id,
          name: museumChapter.name,
          x: museumChapter.x1,
          y: museumChapter.y1,
          w: museumChapter.x2 - museumChapter.x1 + 1,
          h: museumChapter.y2 - museumChapter.y1 + 1,
          kind: "museum_chapter",
          desc: museumChapter.desc,
        }
      : null);
  const room =
    !o &&
    D.rooms.find((r) =>
      `${r.id} ${r.name} ${r.short}`.toLowerCase().includes(q),
    );
  if (o) {
    if (o.engineering) document.getElementById("mode").value = "wiring";
    searchHit = o;
    selected = o;
    focusRect(o.x, o.y, o.x + o.w - 1, o.y + o.h - 1, 5);
    inspect(o, o.x, o.y);
  } else if (room) {
    focusRect(room.x1, room.y1, room.x2, room.y2, 2);
    document.getElementById("iname").textContent = room.name;
    document.getElementById("idesc").textContent = room.desc;
    document.getElementById("ikv").innerHTML =
      `<div>Габарит</div><div>${room.x2 - room.x1 + 1}×${room.y2 - room.y1 + 1}</div><div>Координаты</div><div>x${room.x1}…${room.x2}, y${room.y1}…${room.y2}</div>`;
    schedule();
  }
});
