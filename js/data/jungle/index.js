import { JUNGLE_BACKGROUNDS } from './backgrounds.js';
import { JUNGLE_BOUNDS, JUNGLE_LIGHTING_ZONES, JUNGLE_NOTES, JUNGLE_RESERVES, JUNGLE_ROOMS, JUNGLE_TITLE, JUNGLE_VALIDATION } from './layout.js';
import { JUNGLE_OBJECTS } from './objects.js';
import { JUNGLE_SOLIDS } from './solids.js';
// Assemble the standalone Surface Jungle scene for the shared Canvas runtime.
export const D = {
  sceneId: "jungle",
  bounds: JUNGLE_BOUNDS,
  rooms: JUNGLE_ROOMS,
  solids: JUNGLE_SOLIDS,
  backgrounds: JUNGLE_BACKGROUNDS,
  objects: JUNGLE_OBJECTS,
  reserves: JUNGLE_RESERVES,
  lightingZones: JUNGLE_LIGHTING_ZONES,
  designHistory: JUNGLE_VALIDATION,
  notes: JUNGLE_NOTES,
  title: JUNGLE_TITLE,
  museumChapters: null,
};
