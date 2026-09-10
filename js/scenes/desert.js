import { D } from '../data/desert/index.js';
import { ENG } from '../data/desert/engineering.js';
import { createMaterials } from '../data/materials.js';
import { extendMaterials } from '../data/desert/materials.js';

// No module-level mutation: callers receive an independent scene definition.
export function createScene() {
  const materials = createMaterials();
  extendMaterials(materials);
  return structuredClone({D, ENG, ...materials});
}
