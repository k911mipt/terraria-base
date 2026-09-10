import { saveCam, schedule } from './core.js';

// Camera transforms, viewport fitting and render scheduling.
export function resize(planner) {
  planner.dpr = planner.window.devicePixelRatio || 1;
  for (const c of [planner.baseCanvas, planner.objectCanvas, planner.overlayCanvas]) {
    c.width = Math.round(planner.viewport.clientWidth * planner.dpr);
    c.height = Math.round(planner.viewport.clientHeight * planner.dpr);
  }
  schedule(planner);
}

export function viewRect(planner) {
  return {
    x1: planner.cam.x,
    y1: planner.cam.y,
    x2: planner.cam.x + planner.viewport.clientWidth / planner.cam.scale,
    y2: planner.cam.y + planner.viewport.clientHeight / planner.cam.scale,
  };
}

export function clearCtx(planner, ctx) {
  ctx.setTransform(planner.dpr, 0, 0, planner.dpr, 0, 0);
  ctx.clearRect(0, 0, planner.viewport.clientWidth, planner.viewport.clientHeight);
}

export function sx(planner, x) {
  return (x - planner.cam.x) * planner.cam.scale;
}

export function sy(planner, y) {
  return (y - planner.cam.y) * planner.cam.scale;
}

export function textLabel(ctx, text, x, y, size, fill = "#f4f7f9", align = "center") {
  ctx.font = `800 ${size}px system-ui`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(3,7,10,.92)";
  ctx.lineWidth = Math.max(2, size * 0.24);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

export function focusRect(planner, x1, y1, x2, y2, pad = 2, push = true) {
  if (push) saveCam(planner);
  const w = x2 - x1 + 1,
    h = y2 - y1 + 1;
  planner.cam.scale = Math.min(
    planner.viewport.clientWidth / (w + pad * 2),
    planner.viewport.clientHeight / (h + pad * 2),
  );
  planner.cam.x = x1 - pad + (w + pad * 2 - planner.viewport.clientWidth / planner.cam.scale) / 2;
  planner.cam.y = y1 - pad + (h + pad * 2 - planner.viewport.clientHeight / planner.cam.scale) / 2;
  schedule(planner);
}

export function fit(planner, push = true) {
  focusRect(planner,
    planner.D.bounds.xMin,
    planner.D.bounds.yMin,
    planner.D.bounds.xMax,
    planner.D.bounds.yMax,
    3,
    push,
  );
}
