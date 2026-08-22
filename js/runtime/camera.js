// Camera transforms, viewport fitting and render scheduling.
function resize() {
  dpr = devicePixelRatio || 1;
  for (const c of [baseCanvas, objectCanvas, overlayCanvas]) {
    c.width = Math.round(viewport.clientWidth * dpr);
    c.height = Math.round(viewport.clientHeight * dpr);
  }
  schedule();
}

function viewRect() {
  return {
    x1: cam.x,
    y1: cam.y,
    x2: cam.x + viewport.clientWidth / cam.scale,
    y2: cam.y + viewport.clientHeight / cam.scale,
  };
}

function clearCtx(ctx) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
}

function sx(x) {
  return (x - cam.x) * cam.scale;
}

function sy(y) {
  return (y - cam.y) * cam.scale;
}

function textLabel(ctx, text, x, y, size, fill = "#f4f7f9", align = "center") {
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

function focusRect(x1, y1, x2, y2, pad = 2, push = true) {
  if (push) saveCam();
  const w = x2 - x1 + 1,
    h = y2 - y1 + 1;
  cam.scale = Math.min(
    viewport.clientWidth / (w + pad * 2),
    viewport.clientHeight / (h + pad * 2),
  );
  cam.x = x1 - pad + (w + pad * 2 - viewport.clientWidth / cam.scale) / 2;
  cam.y = y1 - pad + (h + pad * 2 - viewport.clientHeight / cam.scale) / 2;
  schedule();
}

function fit(push = true) {
  focusRect(
    D.bounds.xMin,
    D.bounds.yMin,
    D.bounds.xMax,
    D.bounds.yMax,
    3,
    push,
  );
}
