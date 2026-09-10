import { OBJECTS_ARENA } from './arena.js';
import { OBJECTS_CRAFTING } from './crafting.js';
import { OBJECTS_DYES } from './dyes.js';
import { OBJECTS_ETERNIA } from './eternia.js';
import { OBJECTS_GREENHOUSE } from './greenhouse.js';
import { OBJECTS_MUSEUM } from './museum.js';
import { OBJECTS_PITS } from './pits.js';
import { OBJECTS_ROOMS } from './rooms.js';
import { OBJECTS_ROUTES } from './routes.js';
import { OBJECTS_STORAGE_LEFT } from './storage-left.js';
import { OBJECTS_STORAGE_RIGHT } from './storage-right.js';
import { OBJECTS_STREET } from './street.js';
// Foreground-object assembly.
// Keep this order: later entries may intentionally override earlier visual data.
export const OBJECTS = [
  ...OBJECTS_ROUTES,
  ...OBJECTS_CRAFTING,
  ...OBJECTS_ROOMS,
  ...OBJECTS_STREET,
  ...OBJECTS_STORAGE_LEFT,
  ...OBJECTS_STORAGE_RIGHT,
  ...OBJECTS_GREENHOUSE,
  ...OBJECTS_DYES,
  ...OBJECTS_ARENA,
  ...OBJECTS_ETERNIA,
  ...OBJECTS_MUSEUM,
  ...OBJECTS_PITS,
];
