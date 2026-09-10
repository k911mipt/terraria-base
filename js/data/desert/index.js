import { DESERT_BACKGROUNDS } from './backgrounds.js';
import { DESERT_BOUNDS, DESERT_NOTES, DESERT_RESERVES, DESERT_ROOMS, DESERT_TITLE, DESERT_VALIDATION } from './layout.js';
import { DESERT_OBJECTS } from './objects.js';
import { DESERT_SOLIDS } from './solids.js';
// Desert scene assembly. It deliberately uses the same D shape as the main planner.
export const D = {
  sceneId: "desert",
  bounds: DESERT_BOUNDS,
  rooms: DESERT_ROOMS,
  solids: DESERT_SOLIDS,
  backgrounds: DESERT_BACKGROUNDS,
  objects: DESERT_OBJECTS,
  reserves: DESERT_RESERVES,
  designHistory: DESERT_VALIDATION,
  notes: DESERT_NOTES,
  title: DESERT_TITLE,
  museumChapters: null,
};
