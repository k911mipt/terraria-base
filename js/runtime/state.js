import { SCENE_UI } from './scene-ui.js';

export const CACHE_TILE = 16;
export const AIR_SPEC = {
  layer: "Воздух",
  itemRu: "Блока/платформы нет",
  itemEn: "No foreground tile",
  paintRu: "—",
  paintEn: "—",
  note: "Явно пустой передний слой.",
};

export const NO_WALL_SPEC = {
  itemRu: "Фоновой стены нет",
  itemEn: "No background wall",
  paintRu: "—",
  paintEn: "—",
  safe: null,
  note: "Явно пустой фоновый слой.",
};

export const SOLID_SHAPE_LABELS = {
  upper_right: "Скос к центру · верхняя правая половина",
  upper_left: "Скос к центру · верхняя левая половина",
  lower_right: "Скос к центру · нижняя правая половина",
  lower_left: "Скос к центру · нижняя левая половина",
  half_bottom: "Нижний полублок",
};

export const CHEST_FAMILY_BASE = {
  wooden: "#875a36",
  boreal: "#76614f",
  dynasty: "#ded2aa",
  steampunk: "#9b6337",
  glass: "#75bdc8",
  stone: "#777c82",
  gold: "#c7a342",
  living: "#665638",
  sandstone: "#b18452",
  skyware: "#83b5c5",
  frozen: "#78b4d3",
  water: "#477ea7",
  shadow: "#3d304d",
  obsidian: "#302938",
  honey: "#c2872f",
};

export const WIRE_LABELS = {
  red: "Красный · ловушки ям",
  green: "Зелёный · сердца",
  blue: "Синий · актуаторы мостов",
  yellow: "Жёлтый · включение таймеров",
};


// State is never stored on window or shared between planner instances.
export function createPlannerState(scene, document = null) {
  const data = structuredClone(scene);
  const config = SCENE_UI[data.D.sceneId];
  if (!config) throw new Error('Unknown scene UI: ' + data.D.sceneId);
  const plannerUI = {...config, focus: structuredClone(config.focus),
    hiddenObjectKinds: [...config.hiddenObjectKinds], initialFocus: config.initialFocus?.slice() ?? null};
  const planner = {
    ...data, document, window: document?.defaultView ?? null, plannerUI,
    startupComplete: false, destroyed: false, dpr: 1,
    cam: {x: data.D.bounds.xMin, y: data.D.bounds.yMin, scale: 7},
    history: [], drag: null, selected: null, selectedTile: null, searchHit: null,
    raf: 0, wheelSession: null, viewportPointers: new Map(), pinchGesture: null,
    sceneAudit: null, OBJECT_RENDERERS: new Map(), TILE_RENDERERS: {block: new Map(), wall: new Map()},
    WX: data.D.bounds.xMax - data.D.bounds.xMin + 1,
    WY: data.D.bounds.yMax - data.D.bounds.yMin + 1,
    cleanups: [], timers: new Set(),
    viewport: null, baseCanvas: null, objectCanvas: null, overlayCanvas: null,
    bctx: null, octx: null, xctx: null, tip: null, caches: null,
  };
  if (!document) return planner;
  for (const id of ['viewport', 'baseCanvas', 'objectCanvas', 'overlayCanvas', 'tip']) {
    planner[id] = document.getElementById(id);
    if (!planner[id]) throw new Error('Missing planner element: ' + id);
  }
  planner.bctx = planner.baseCanvas.getContext('2d');
  planner.octx = planner.objectCanvas.getContext('2d');
  planner.xctx = planner.overlayCanvas.getContext('2d');
  planner.caches = Object.fromEntries(['bg', 'solid', 'objects'].map(key => [key, document.createElement('canvas')]));
  for (const canvas of Object.values(planner.caches)) {
    canvas.width = planner.WX * CACHE_TILE; canvas.height = planner.WY * CACHE_TILE;
    canvas.getContext('2d').imageSmoothingEnabled = false;
  }
  return planner;
}
