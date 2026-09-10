import { D } from '../data/underground/index.js';
import { ENG } from '../data/underground/engineering.js';
import { createMaterials } from '../data/materials.js';
import { extendMaterials } from '../data/underground/materials.js';

// No module-level mutation: callers receive an independent scene definition.
export function createScene() {
  const materials = createMaterials();
  extendMaterials(materials);
  return structuredClone({D, ENG, ...materials});
}
