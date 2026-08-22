// Pointer, wheel, navigation-button and search event bindings.
const viewportPointers = new Map();
let pinchGesture = null;

function clampScale(value) {
  return Math.max(2, Math.min(32, value));
}

function viewportLocalPoint(clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function beginSinglePointerDrag(pointerId, pointer, suppressTap = false) {
  drag = {
    pointerId,
    x: pointer.x,
    y: pointer.y,
    start: { ...cam },
    moved: false,
    suppressTap,
  };
}

function beginPinchGesture(historyStart = drag?.start || { ...cam }) {
  const pointers = [...viewportPointers.entries()].slice(0, 2);
  if (pointers.length < 2) return;

  const [[firstId, first], [secondId, second]] = pointers;
  const center = viewportLocalPoint(
    (first.x + second.x) / 2,
    (first.y + second.y) / 2,
  );
  const distance = Math.hypot(second.x - first.x, second.y - first.y);
  if (distance < 1) return;

  pinchGesture = {
    ids: [firstId, secondId],
    startDistance: distance,
    startScale: cam.scale,
    anchorWorld: {
      x: cam.x + center.x / cam.scale,
      y: cam.y + center.y / cam.scale,
    },
    historyStart: { ...historyStart },
    moved: false,
  };
  drag = null;
}

function updatePinchGesture() {
  if (!pinchGesture) return false;

  const [firstId, secondId] = pinchGesture.ids,
    first = viewportPointers.get(firstId),
    second = viewportPointers.get(secondId);
  if (!first || !second) return false;

  const center = viewportLocalPoint(
      (first.x + second.x) / 2,
      (first.y + second.y) / 2,
    ),
    distance = Math.hypot(second.x - first.x, second.y - first.y),
    nextScale = clampScale(
      pinchGesture.startScale * (distance / pinchGesture.startDistance),
    );

  cam.scale = nextScale;
  cam.x = pinchGesture.anchorWorld.x - center.x / nextScale;
  cam.y = pinchGesture.anchorWorld.y - center.y / nextScale;
  pinchGesture.moved = true;
  schedule();
  return true;
}

function finishViewportPointer(e, cancelled = false) {
  if (!viewportPointers.has(e.pointerId)) return;

  viewportPointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY,
    pointerType: e.pointerType,
  });

  const endedPinch = pinchGesture?.ids.includes(e.pointerId),
    finishedPinch = endedPinch ? pinchGesture : null,
    finishedDrag = drag?.pointerId === e.pointerId ? drag : null;

  viewportPointers.delete(e.pointerId);
  try {
    viewport.releasePointerCapture(e.pointerId);
  } catch {
    // The browser may release capture before pointercancel reaches us.
  }

  if (finishedPinch) {
    pinchGesture = null;
    drag = null;
    if (finishedPinch.moved) saveCam(finishedPinch.historyStart);

    if (viewportPointers.size >= 2) {
      beginPinchGesture({ ...cam });
    } else if (viewportPointers.size === 1) {
      const [pointerId, pointer] = viewportPointers.entries().next().value;
      beginSinglePointerDrag(pointerId, pointer, true);
    }
  } else if (finishedDrag) {
    drag = null;
    if (finishedDrag.moved) {
      saveCam(finishedDrag.start);
    } else if (!cancelled && !finishedDrag.suppressTap) {
      const point = viewportLocalPoint(e.clientX, e.clientY),
        target = world(point.x, point.y);
      inspect(objectAt(target.x, target.y), target.x, target.y);
    }
  }

  if (viewportPointers.size === 0) viewport.classList.remove("dragging");
}

viewport.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;

  const pointer = {
    x: e.clientX,
    y: e.clientY,
    pointerType: e.pointerType,
  };
  viewportPointers.set(e.pointerId, pointer);
  viewport.setPointerCapture(e.pointerId);
  viewport.classList.add("dragging");
  hideTip();

  if (viewportPointers.size === 1) beginSinglePointerDrag(e.pointerId, pointer);
  else if (viewportPointers.size === 2) beginPinchGesture();
});

viewport.addEventListener("pointermove", (e) => {
  if (!viewportPointers.has(e.pointerId)) {
    if (e.pointerType !== "mouse") return;
    const point = viewportLocalPoint(e.clientX, e.clientY),
      target = world(point.x, point.y),
      object = objectAt(target.x, target.y);
    if (object) showTip(e, object);
    else hideTip();
    return;
  }

  viewportPointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY,
    pointerType: e.pointerType,
  });

  if (updatePinchGesture()) return;
  if (!drag || drag.pointerId !== e.pointerId) return;

  const dx = e.clientX - drag.x,
    dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) > 5) drag.moved = true;
  cam.x = drag.start.x - dx / cam.scale;
  cam.y = drag.start.y - dy / cam.scale;
  schedule();
});

viewport.addEventListener("pointerup", (e) => finishViewportPointer(e));
viewport.addEventListener("pointercancel", (e) => {
  finishViewportPointer(e, true);
});

viewport.addEventListener("pointerleave", () => {
  if (viewportPointers.size === 0) hideTip();
});

viewport.addEventListener("dblclick", (e) => {
  const point = viewportLocalPoint(e.clientX, e.clientY),
    target = world(point.x, point.y),
    object = objectAt(target.x, target.y);
  if (object)
    focusRect(
      object.x,
      object.y,
      object.x + object.w - 1,
      object.y + object.h - 1,
      4,
    );
});

viewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const point = viewportLocalPoint(e.clientX, e.clientY),
      before = world(point.x, point.y);
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
    cam.scale = clampScale(cam.scale * factor);
    cam.x = before.x - point.x / cam.scale;
    cam.y = before.y - point.y / cam.scale;
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

function installMobileToolbar() {
  const toolbar = document.querySelector(".toolbar");
  if (!toolbar || toolbar.querySelector(".toolbar-toggle")) return;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "toolbar-toggle";
  toggle.innerHTML =
    '<span class="toolbar-toggle-icon" aria-hidden="true">⌃</span>' +
    '<span class="toolbar-toggle-label">Скрыть панель</span>';
  toolbar.append(toggle);

  const media = window.matchMedia("(max-width: 720px)"),
    storageKey = "terraria-base:mobile-toolbar-collapsed";

  function readStoredState() {
    try {
      return window.localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  }

  function setCollapsed(collapsed, persist = true) {
    const active = media.matches && collapsed;
    toolbar.classList.toggle("toolbar-collapsed", active);
    document.body.classList.toggle("mobile-toolbar-collapsed", active);
    toggle.setAttribute("aria-expanded", String(!active));
    toggle.setAttribute(
      "aria-label",
      active ? "Показать верхнюю панель" : "Скрыть верхнюю панель",
    );
    toggle.querySelector(".toolbar-toggle-icon").textContent = active ? "⌄" : "⌃";
    toggle.querySelector(".toolbar-toggle-label").textContent = active
      ? "Показать панель"
      : "Скрыть панель";

    if (persist && media.matches) {
      try {
        window.localStorage.setItem(storageKey, active ? "1" : "0");
      } catch {
        // The control remains usable when storage is unavailable.
      }
    }
  }

  let suppressToggleClick = false;
  toggle.addEventListener("click", () => {
    if (suppressToggleClick) {
      suppressToggleClick = false;
      return;
    }
    setCollapsed(!toolbar.classList.contains("toolbar-collapsed"));
  });

  let swipeStart = null;
  toggle.addEventListener("pointerdown", (e) => {
    if (!media.matches || e.pointerType === "mouse") return;
    swipeStart = { id: e.pointerId, x: e.clientX, y: e.clientY };
    toggle.setPointerCapture(e.pointerId);
  });
  toggle.addEventListener("pointerup", (e) => {
    if (!swipeStart || swipeStart.id !== e.pointerId) return;
    const dx = e.clientX - swipeStart.x,
      dy = e.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dy) >= 36 && Math.abs(dy) > Math.abs(dx) * 1.15) {
      suppressToggleClick = true;
      setCollapsed(dy < 0);
    }
  });
  toggle.addEventListener("pointercancel", () => {
    swipeStart = null;
  });

  const syncMedia = () => setCollapsed(readStoredState(), false);
  if (typeof media.addEventListener === "function")
    media.addEventListener("change", syncMedia);
  else media.addListener(syncMedia);

  syncMedia();
}

installMobileToolbar();
