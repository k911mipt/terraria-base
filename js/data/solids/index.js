import { SOLIDS_LOWER } from './lower.js';
import { SOLIDS_STREET } from './street.js';
import { SOLIDS_UPPER } from './upper.js';
// Solid-layer assembly.
// Keep this order: later entries may intentionally override earlier visual data.
export const SOLIDS = [...SOLIDS_UPPER, ...SOLIDS_STREET, ...SOLIDS_LOWER];
