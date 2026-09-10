import { fit, focusRect } from './camera.js';
import { saveCam, schedule } from './core.js';
import { listen, plannerTimeout } from './events.js';
import { hideTip, inspect, showTip } from './inspector.js';
import { objectAt, world } from './model.js';

export function clampScale(value) {
  return Math.max(2, Math.min(32, value));
}

export function viewportLocalPoint(planner, clientX, clientY) {
  const rect = planner.viewport.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function beginSinglePointerDrag(planner, pointerId, pointer, suppressTap = false) {
  planner.drag = {
    pointerId,
    x: pointer.x,
    y: pointer.y,
    start: { ...planner.cam },
    moved: false,
    suppressTap,
  };
}

export function beginPinchGesture(planner, historyStart = planner.drag?.start || { ...planner.cam }) {
  const pointers = [...planner.viewportPointers.entries()].slice(0, 2);
  if (pointers.length < 2) return;

  const [[firstId, first], [secondId, second]] = pointers;
  const center = viewportLocalPoint(planner,
    (first.x + second.x) / 2,
    (first.y + second.y) / 2,
  );
  const distance = Math.hypot(second.x - first.x, second.y - first.y);
  if (distance < 1) return;

  planner.pinchGesture = {
    ids: [firstId, secondId],
    startDistance: distance,
    startScale: planner.cam.scale,
    anchorWorld: {
      x: planner.cam.x + center.x / planner.cam.scale,
      y: planner.cam.y + center.y / planner.cam.scale,
    },
    historyStart: { ...historyStart },
    moved: false,
  };
  planner.drag = null;
}

export function updatePinchGesture(planner) {
  if (!planner.pinchGesture) return false;

  const [firstId, secondId] = planner.pinchGesture.ids,
    first = planner.viewportPointers.get(firstId),
    second = planner.viewportPointers.get(secondId);
  if (!first || !second) return false;

  const center = viewportLocalPoint(planner,
      (first.x + second.x) / 2,
      (first.y + second.y) / 2,
    ),
    distance = Math.hypot(second.x - first.x, second.y - first.y),
    nextScale = clampScale(
      planner.pinchGesture.startScale * (distance / planner.pinchGesture.startDistance),
    );

  planner.cam.scale = nextScale;
  planner.cam.x = planner.pinchGesture.anchorWorld.x - center.x / nextScale;
  planner.cam.y = planner.pinchGesture.anchorWorld.y - center.y / nextScale;
  planner.pinchGesture.moved = true;
  schedule(planner);
  return true;
}

export function finishViewportPointer(planner, e, cancelled = false) {
  if (!planner.viewportPointers.has(e.pointerId)) return;

  planner.viewportPointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY,
    pointerType: e.pointerType,
  });

  const endedPinch = planner.pinchGesture?.ids.includes(e.pointerId),
    finishedPinch = endedPinch ? planner.pinchGesture : null,
    finishedDrag = planner.drag?.pointerId === e.pointerId ? planner.drag : null;

  planner.viewportPointers.delete(e.pointerId);
  try {
    planner.viewport.releasePointerCapture(e.pointerId);
  } catch {
    // The browser may release capture before pointercancel reaches us.
  }

  if (finishedPinch) {
    planner.pinchGesture = null;
    planner.drag = null;
    if (finishedPinch.moved) saveCam(planner, finishedPinch.historyStart);

    if (planner.viewportPointers.size >= 2) {
      beginPinchGesture(planner, { ...planner.cam });
    } else if (planner.viewportPointers.size === 1) {
      const [pointerId, pointer] = planner.viewportPointers.entries().next().value;
      beginSinglePointerDrag(planner, pointerId, pointer, true);
    }
  } else if (finishedDrag) {
    planner.drag = null;
    if (finishedDrag.moved) {
      saveCam(planner, finishedDrag.start);
    } else if (!cancelled && !finishedDrag.suppressTap) {
      const point = viewportLocalPoint(planner, e.clientX, e.clientY),
        target = world(planner, point.x, point.y);
      inspect(planner, objectAt(planner, target.x, target.y), target.x, target.y);
    }
  }

  if (planner.viewportPointers.size === 0) planner.viewport.classList.remove("dragging");
}

export function installMobileToolbar(planner) {
  const toolbar = planner.document.querySelector(".toolbar");
  if (!toolbar || toolbar.querySelector(".toolbar-toggle")) return;

  let swipeStart = null;
  const toggle = planner.document.createElement("button");
  toggle.type = "button";
  toggle.className = "toolbar-toggle";
  toggle.innerHTML =
    '<span class="toolbar-toggle-icon" aria-hidden="true">⌃</span>' +
    '<span class="toolbar-toggle-label">Скрыть панель</span>';
  toolbar.append(toggle);
  planner.cleanups.push(() => {
    if (swipeStart && toggle.hasPointerCapture(swipeStart.id)) toggle.releasePointerCapture(swipeStart.id);
    swipeStart = null;
    toggle.remove();
    toolbar.classList.remove("toolbar-collapsed");
    planner.document.body.classList.remove("mobile-toolbar-collapsed");
  });

  const media = planner.window.matchMedia("(max-width: 720px)"),
    storageKey = "terraria-base:mobile-toolbar-collapsed";

  function readStoredState() {
    try {
      return planner.window.localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  }

  function setCollapsed(collapsed, persist = true) {
    const active = media.matches && collapsed;
    toolbar.classList.toggle("toolbar-collapsed", active);
    planner.document.body.classList.toggle("mobile-toolbar-collapsed", active);
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
        planner.window.localStorage.setItem(storageKey, active ? "1" : "0");
      } catch {
        // The control remains usable when storage is unavailable.
      }
    }
  }

  let suppressToggleClick = false;
  listen(planner, toggle, "click", () => {
    if (suppressToggleClick) {
      suppressToggleClick = false;
      return;
    }
    setCollapsed(!toolbar.classList.contains("toolbar-collapsed"));
  });


  listen(planner, toggle, "pointerdown", (e) => {
    if (!media.matches || e.pointerType === "mouse") return;
    swipeStart = { id: e.pointerId, x: e.clientX, y: e.clientY };
    toggle.setPointerCapture(e.pointerId);
  });
  listen(planner, toggle, "pointerup", (e) => {
    if (!swipeStart || swipeStart.id !== e.pointerId) return;
    const dx = e.clientX - swipeStart.x,
      dy = e.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dy) >= 36 && Math.abs(dy) > Math.abs(dx) * 1.15) {
      suppressToggleClick = true;
      plannerTimeout(planner, () => {
        suppressToggleClick = false;
      }, 400);
      setCollapsed(dy < 0);
    }
  });
  listen(planner, toggle, "pointercancel", () => {
    swipeStart = null;
  });

  const syncMedia = () => setCollapsed(readStoredState(), false);
  if (typeof media.addEventListener === "function")
    listen(planner, media, "change", syncMedia);
  else {
    media.addListener(syncMedia);
    planner.cleanups.push(() => media.removeListener(syncMedia));
  }

  syncMedia();
}

export function installInteractions(planner) {


  listen(planner, planner.viewport, "pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const pointer = {
      x: e.clientX,
      y: e.clientY,
      pointerType: e.pointerType,
    };
    planner.viewportPointers.set(e.pointerId, pointer);
    planner.viewport.setPointerCapture(e.pointerId);
    planner.viewport.classList.add("dragging");
    hideTip(planner);

    if (planner.viewportPointers.size === 1) beginSinglePointerDrag(planner, e.pointerId, pointer);
    else if (planner.viewportPointers.size === 2) beginPinchGesture(planner);
  });

  listen(planner, planner.viewport, "pointermove", (e) => {
    if (!planner.viewportPointers.has(e.pointerId)) {
      if (e.pointerType !== "mouse") return;
      const point = viewportLocalPoint(planner, e.clientX, e.clientY),
        target = world(planner, point.x, point.y),
        object = objectAt(planner, target.x, target.y);
      if (object) showTip(planner, e, object);
      else hideTip(planner);
      return;
    }

    planner.viewportPointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      pointerType: e.pointerType,
    });

    if (updatePinchGesture(planner)) return;
    if (!planner.drag || planner.drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - planner.drag.x,
      dy = e.clientY - planner.drag.y;
    if (Math.hypot(dx, dy) > 5) planner.drag.moved = true;
    planner.cam.x = planner.drag.start.x - dx / planner.cam.scale;
    planner.cam.y = planner.drag.start.y - dy / planner.cam.scale;
    schedule(planner);
  });

  listen(planner, planner.viewport, "pointerup", (e) => finishViewportPointer(planner, e));
  listen(planner, planner.viewport, "pointercancel", (e) =>
    finishViewportPointer(planner, e, true),
  );

  listen(planner, planner.viewport, "pointerleave", () => {
    if (planner.viewportPointers.size === 0) hideTip(planner);
  });

  listen(planner, planner.viewport, "dblclick", (e) => {
    const point = viewportLocalPoint(planner, e.clientX, e.clientY),
      target = world(planner, point.x, point.y),
      object = objectAt(planner, target.x, target.y);
    if (object)
      focusRect(planner,
        object.x,
        object.y,
        object.x + object.w - 1,
        object.y + object.h - 1,
        4,
      );
  });

  listen(planner, planner.viewport,
    "wheel",
    (e) => {
      e.preventDefault();
      const point = viewportLocalPoint(planner, e.clientX, e.clientY),
        before = world(planner, point.x, point.y);
      if (!planner.wheelSession) {
        planner.wheelSession = { start: { ...planner.cam } };
        plannerTimeout(planner, () => {
          if (planner.wheelSession) {
            saveCam(planner, planner.wheelSession.start);
            planner.wheelSession = null;
          }
        }, 180);
      }
      const factor = Math.exp(-e.deltaY * 0.00125);
      planner.cam.scale = clampScale(planner.cam.scale * factor);
      planner.cam.x = before.x - point.x / planner.cam.scale;
      planner.cam.y = before.y - point.y / planner.cam.scale;
      schedule(planner);
    },
    { passive: false },
  );

  for (const id of ["mode", "grid", "labels", "roomNames", "reserves"])
    listen(planner, planner.document.getElementById(id), "change", schedule.bind(null, planner));

  listen(planner, planner.document.getElementById("fit"), "click", () => fit(planner));

  for (const [id, target] of Object.entries(planner.plannerUI.focus)) {
    const button = planner.document.getElementById(id);
    if (!button) throw new Error(`Missing configured focus button: ${id}`);
    listen(planner, button, "click", () => {
      if (target.mode) planner.document.getElementById("mode").value = target.mode;
      focusRect(planner, ...target.bounds, 2);
    });
  }

  listen(planner, planner.document.getElementById("back"), "click", () => {
    const c = planner.history.pop();
    if (c) {
      planner.cam = c;
      schedule(planner);
    }
  });

  listen(planner, planner.document.getElementById("search"), "input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    planner.searchHit = null;
    if (!q) {
      schedule(planner);
      return;
    }
    const dObj = planner.D.objects.find((o) =>
      `${o.id} ${o.name} ${o.short || ""} ${o.desc || ""} ${o.chestItemRu || ""} ${o.chestItemEn || ""} ${o.chestPaintRu || ""} ${o.customName || ""}`
        .toLowerCase()
        .includes(q),
    );
    const eObj =
      !dObj &&
      [...planner.ENG.devices, ...planner.ENG.futureSlots].find((o) =>
        `${o.id} ${o.name} ${o.short || ""} ${o.desc || ""} ${(o.circuits || []).join(" ")}`
          .toLowerCase()
          .includes(q),
      );
    const circuit =
      !dObj &&
      !eObj &&
      planner.ENG.circuits.find((c) =>
        `${c.id} ${c.name} ${c.role} ${c.desc}`.toLowerCase().includes(q),
      );
    const museumChapter =
      !dObj &&
      !eObj &&
      !circuit &&
      (planner.D.museumChapters || []).find((ch) =>
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
            stage: planner.ENG.stage,
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
      planner.D.rooms.find((r) =>
        `${r.id} ${r.name} ${r.short}`.toLowerCase().includes(q),
      );
    if (o) {
      if (o.engineering) planner.document.getElementById("mode").value = "wiring";
      planner.searchHit = o;
      planner.selected = o;
      focusRect(planner, o.x, o.y, o.x + o.w - 1, o.y + o.h - 1, 5);
      inspect(planner, o, o.x, o.y);
    } else if (room) {
      focusRect(planner, room.x1, room.y1, room.x2, room.y2, 2);
      planner.document.getElementById("iname").textContent = room.name;
      planner.document.getElementById("idesc").textContent = room.desc;
      planner.document.getElementById("ikv").innerHTML =
        `<div>Габарит</div><div>${room.x2 - room.x1 + 1}×${room.y2 - room.y1 + 1}</div><div>Координаты</div><div>x${room.x1}…${room.x2}, y${room.y1}…${room.y2}</div>`;
      schedule(planner);
    }
  });

  installMobileToolbar(planner);
}
