import { createPlannerState } from './state.js';
import { registerCommonObjectRenderers } from './render-objects.js';
import { registerCommonTileRenderers } from './render-tiles.js';
import { buildBaseCaches, buildObjectCache } from './render-cache.js';
import { preparePlanner } from './prepare.js';
import { populate } from './tables.js';
import { installInteractions } from './interactions.js';
import { fit, focusRect, resize } from './camera.js';
import { inspect } from './inspector.js';
import { schedule } from './core.js';
import { observePlanner, destroyPlanner } from './lifecycle.js';

export function createPlanner(scene, registerRenderers = () => {}, document = null) {
  const planner = createPlannerState(scene, document);
  try {
    registerCommonTileRenderers(planner);
    registerCommonObjectRenderers(planner);
    registerRenderers(planner);
    return planner;
  } catch (error) {
    destroyPlanner(planner);
    throw error;
  }
}

// A single explicit startup for all four scenes. Imports have no DOM side effects.
export function startPlanner({scene, registerRenderers, document = globalThis.document}) {
  if (!document?.defaultView) throw new Error('Planner requires a browser document');
  const planner = createPlanner(scene, registerRenderers, document);
  try {
    preparePlanner(planner);
    buildBaseCaches(planner);
    buildObjectCache(planner);
    populate(planner);
    installInteractions(planner);
    observePlanner(planner);
    document.getElementById('mode').value = planner.plannerUI.initialMode;
    resize(planner);
    if (planner.plannerUI.initialFocus) focusRect(planner, ...planner.plannerUI.initialFocus, 2, false);
    else fit(planner, false);
    planner.startupComplete = true;
    schedule(planner);
  } catch (error) {
    destroyPlanner(planner);
    throw error;
  }
  return {
    state: planner,
    fit: () => fit(planner),
    focus: (...bounds) => focusRect(planner, ...bounds),
    inspect: (object, x, y) => inspect(planner, object, x, y),
    destroy: () => destroyPlanner(planner),
  };
}
