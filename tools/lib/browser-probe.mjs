// Test-only aliases for legacy mutation snippets. Never imported by the application.
import * as m0 from '../../js/runtime/core.js';
import * as m1 from '../../js/runtime/camera.js';
import * as m2 from '../../js/runtime/inspector.js';
import * as m3 from '../../js/runtime/model.js';
import * as m4 from '../../js/runtime/validation.js';
import * as m5 from '../../js/runtime/placement-contract.js';
import * as m6 from '../../js/runtime/building-audit.js';
import * as m7 from '../../js/runtime/lighting-audit.js';
import * as m8 from '../../js/runtime/scene-audit.js';
import * as m9 from '../../js/runtime/render-cache.js';
import * as m10 from '../../js/runtime/render-tiles.js';
import * as m11 from '../../js/runtime/render-objects.js';
import * as m12 from '../../js/runtime/formatters.js';
import * as m13 from '../../js/runtime/overlay.js';
import * as m14 from '../../js/runtime/state.js';

export function attachTestPlanner(planner) {
  const target = planner.window;
  for (const key of Object.keys(planner)) {
    if (['window','document','history'].includes(key)) continue;
    Object.defineProperty(target, key, {
      configurable: true, get: () => planner[key], set: value => {planner[key] = value;},
    });
  }
  for (const namespace of [m0,m1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,m13,m14]) for (const [name,value] of Object.entries(namespace)) {
    if (Object.hasOwn(planner, name)) continue;
    const needsState = typeof value === 'function' && /^function\s+\w+\(planner(?:[,\)])/u.test(value.toString());
    target[name] = needsState ? value.bind(null, planner) : value;
  }
}
