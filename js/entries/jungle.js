import { createScene } from '../scenes/jungle.js';
import { startPlanner } from '../runtime/start.js';
import { registerJungleRenderers } from '../runtime/jungle-extensions.js';

export { createScene };
export { registerJungleRenderers as registerRenderers };
export function start(document = globalThis.document, options = {}) {
  return startPlanner({...options, scene: createScene(), registerRenderers: registerJungleRenderers, document});
}

// No globals for the camera, data or registry. Tests can observe this ordinary
// lifecycle event without adding an interpreter or test hook to the runtime.
if (typeof document !== 'undefined') {
  const planner = start(document);
  document.dispatchEvent(new CustomEvent('planner-started', {detail: planner}));
}
