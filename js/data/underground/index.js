import { UNDERGROUND_BACKGROUNDS } from './backgrounds.js';
import { UNDERGROUND_BOUNDS, UNDERGROUND_LIGHTING_ZONES, UNDERGROUND_NOTES, UNDERGROUND_RESERVES, UNDERGROUND_ROOMS, UNDERGROUND_TITLE, UNDERGROUND_VALIDATION } from './layout.js';
import { UNDERGROUND_OBJECTS } from './objects.js';
import { UNDERGROUND_SOLIDS } from './solids.js';
// Underground scene assembly. It deliberately uses the same D shape as other scenes.
export const D = {
  sceneId: "underground",
  bounds: UNDERGROUND_BOUNDS,
  rooms: UNDERGROUND_ROOMS,
  solids: UNDERGROUND_SOLIDS,
  backgrounds: UNDERGROUND_BACKGROUNDS,
  objects: UNDERGROUND_OBJECTS,
  reserves: UNDERGROUND_RESERVES,
  lightingZones: UNDERGROUND_LIGHTING_ZONES,
  designHistory: UNDERGROUND_VALIDATION,
  notes: UNDERGROUND_NOTES,
  title: UNDERGROUND_TITLE,
  museumChapters: null,
};
