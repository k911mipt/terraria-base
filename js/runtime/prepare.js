import { prepareEngineering, validateHeartWireTargets } from './overlay.js';
import { validatePitConfiguration } from './validation.js';

export function preparePlanner(planner) {
  // One preparation path, including the supported empty-engineering case.
  prepareEngineering(planner);
  if (planner.plannerUI.engineering) {
    validateHeartWireTargets(planner);
    validatePitConfiguration(planner);
  } else {
    planner.ENG.validation.heartTargets = "не используется";
    planner.ENG.validation.pitStates = "не используется";
  }
}
