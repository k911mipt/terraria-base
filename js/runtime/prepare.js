// One preparation path, including the supported empty-engineering case.
prepareEngineering();
if (plannerUI.engineering) {
  validateHeartWireTargets();
  validatePitConfiguration();
} else {
  ENG.validation.heartTargets = "не используется";
  ENG.validation.pitStates = "не используется";
}
