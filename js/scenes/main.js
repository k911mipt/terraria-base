import { D } from '../data/index.js';
import { ENG } from '../data/engineering/index.js';
import { createMaterials } from '../data/materials.js';

// No module-level mutation: callers receive an independent scene definition.
export function createScene() {
  const materials = createMaterials();
  return structuredClone({D, ENG, ...materials});
}
