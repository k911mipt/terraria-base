import { resize } from './camera.js';

// Explicitly owned lifecycle. No global active planner or shared teardown list.
export function observePlanner(planner) {
  const observer = new planner.window.ResizeObserver(() => {
    if (!planner.destroyed) resize(planner);
  });
  planner.cleanups.push(() => observer.disconnect());
  observer.observe(planner.viewport);
}

export function destroyPlanner(planner) {
  if (planner.destroyed) return;
  planner.destroyed = true;
  planner.startupComplete = false;
  planner.viewport?.removeAttribute('data-ready');
  if (planner.raf) planner.window.cancelAnimationFrame(planner.raf);
  planner.raf = 0;
  for (const timer of planner.timers) planner.window.clearTimeout(timer);
  planner.timers.clear();
  // Removing listeners first prevents lostpointercapture from scheduling work.
  for (const cleanup of planner.cleanups.splice(0).reverse()) cleanup();
  for (const id of planner.viewportPointers.keys()) {
    if (planner.viewport.hasPointerCapture(id)) planner.viewport.releasePointerCapture(id);
  }
  planner.viewportPointers.clear();
  planner.pinchGesture = planner.drag = planner.wheelSession = null;
  planner.viewport?.classList.remove('dragging');
  if (planner.tip) planner.tip.style.display = 'none';
  for (const canvas of Object.values(planner.caches || {})) canvas.width = canvas.height = 0;
  planner.OBJECT_RENDERERS.clear();
  planner.TILE_RENDERERS.block.clear();
  planner.TILE_RENDERERS.wall.clear();
}
