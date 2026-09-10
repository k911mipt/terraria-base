import { BACKGROUNDS_BOSS_ARENA } from './boss-arena.js';
import { BACKGROUNDS_BOSS_PLATFORM_JOINS } from './boss-platform-joins.js';
import { BACKGROUNDS_CORE } from './core.js';
import { BACKGROUNDS_MUSEUM_PITS } from './museum-pits.js';
// Background-wall assembly.
// Keep this order: later entries may intentionally override earlier visual data.
export const BACKGROUNDS = [
  ...BACKGROUNDS_CORE,
  ...BACKGROUNDS_BOSS_ARENA,
  ...BACKGROUNDS_BOSS_PLATFORM_JOINS,
  ...BACKGROUNDS_MUSEUM_PITS,
];
