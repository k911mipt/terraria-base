// Owned event listeners and timers; destroy only releases this instance's resources.
export function listen(planner, target, type, listener, options) {
  if (planner.destroyed) return;
  target.addEventListener(type, listener, options);
  planner.cleanups.push(() => target.removeEventListener(type, listener, options));
}

export function plannerTimeout(planner, callback, delay) {
  if (planner.destroyed) return null;
  const id = planner.window.setTimeout(() => {
    planner.timers.delete(id);
    if (!planner.destroyed) callback();
  }, delay);
  planner.timers.add(id);
  return id;
}

export function clearPlannerTimeout(planner, id) {
  planner.window.clearTimeout(id);
  planner.timers.delete(id);
}
