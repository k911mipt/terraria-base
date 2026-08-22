// DOM and Canvas references, camera state, caches and immutable UI labels.
const viewport = document.getElementById("viewport");

const baseCanvas = document.getElementById("baseCanvas"),
  objectCanvas = document.getElementById("objectCanvas"),
  overlayCanvas = document.getElementById("overlayCanvas");

const bctx = baseCanvas.getContext("2d"),
  octx = objectCanvas.getContext("2d"),
  xctx = overlayCanvas.getContext("2d");

const tip = document.getElementById("tip");

const CACHE_TILE = 16,
  WX = D.bounds.xMax - D.bounds.xMin + 1,
  WY = D.bounds.yMax - D.bounds.yMin + 1;

let dpr = 1,
  cam = { x: D.bounds.xMin, y: D.bounds.yMin, scale: 7 },
  history = [],
  drag = null,
  selected = null,
  selectedTile = null,
  searchHit = null,
  raf = 0,
  wheelSession = null;

const caches = {
  bg: document.createElement("canvas"),
  solid: document.createElement("canvas"),
  objects: document.createElement("canvas"),
};

for (const c of Object.values(caches)) {
  c.width = WX * CACHE_TILE;
  c.height = WY * CACHE_TILE;
  c.getContext("2d").imageSmoothingEnabled = false;
}

const AIR_SPEC = {
  layer: "Воздух",
  itemRu: "Блока/платформы нет",
  itemEn: "No foreground tile",
  paintRu: "—",
  paintEn: "—",
  note: "Явно пустой передний слой.",
};

const NO_WALL_SPEC = {
  itemRu: "Фоновой стены нет",
  itemEn: "No background wall",
  paintRu: "—",
  paintEn: "—",
  safe: null,
  note: "Явно пустой фоновый слой.",
};

const SOLID_SHAPE_LABELS = {
  upper_right: "Скос к центру · верхняя правая половина",
  upper_left: "Скос к центру · верхняя левая половина",
  lower_right: "Скос к центру · нижняя правая половина",
  lower_left: "Скос к центру · нижняя левая половина",
  half_bottom: "Нижний полублок",
};

const CHEST_FAMILY_BASE = {
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

new ResizeObserver(resize).observe(viewport);

const WIRE_LABELS = {
  red: "Красный · ловушки ям",
  green: "Зелёный · сердца",
  blue: "Синий · актуаторы мостов",
  yellow: "Жёлтый · включение таймеров",
};
