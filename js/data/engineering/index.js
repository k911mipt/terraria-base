import { ENGINEERING_CIRCUITS } from './circuits.js';
import { ENGINEERING_CONTROLS } from './controls.js';
import { ENGINEERING_TRAPS } from './traps.js';
// Engineering-model assembly.
export const ENG = {
  stage: "Ямы v3 clean · база v2 + точные столбцы ловушек и опущенные люки",
  focus: {
    x1: -22,
    y1: 52,
    x2: 157,
    y2: 69,
  },
  circuits: ENGINEERING_CIRCUITS,
  junctionBoxes: [],
  devices: [...ENGINEERING_CONTROLS, ...ENGINEERING_TRAPS],
  futureSlots: [],
};
