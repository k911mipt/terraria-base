import { BACKGROUNDS } from './backgrounds/index.js';
import { BASE_BOUNDS, BASE_TITLE, MUSEUM_CHAPTERS, RESERVES, ROOMS } from './layout.js';
import { DESIGN_NOTES, VALIDATION_SNAPSHOT } from './metadata.js';
import { OBJECTS } from './objects/index.js';
import { SOLIDS } from './solids/index.js';
// Canonical data-model assembly.
// The large datasets live in semantic modules; this index only preserves their order.
export const D = {
  sceneId: "main",
  bounds: BASE_BOUNDS,
  rooms: ROOMS,
  solids: SOLIDS,
  backgrounds: BACKGROUNDS,
  objects: OBJECTS,
  reserves: RESERVES,
  designHistory: VALIDATION_SNAPSHOT,
  notes: DESIGN_NOTES,
  title: BASE_TITLE,
  museumChapters: MUSEUM_CHAPTERS,
};
