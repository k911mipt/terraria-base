// Underground Snow-scene material, wall and style extensions.
Object.assign(MAT, {
  ice_block_plain: {
    base: "#74aac5",
    dark: "#315f78",
    light: "#c9efff",
  },
  snow_block_plain: {
    base: "#dceef3",
    dark: "#8eb5c2",
    light: "#ffffff",
  },
  copper_brick_plain: {
    base: "#a9633d",
    dark: "#633622",
    light: "#dc9862",
  },
});

Object.assign(WALL, {
  goblin_green_wall: ["#294d32", "#4f8655"],
  copper_wall_plain: ["#69412f", "#a66a46"],
});

Object.assign(STYLE, {
  mechanic_npc: "#cf7f43",
  goblin_npc: "#57904c",
  princess_npc: "#c887b8",
  princess_room: "#d7e5ed",
  cavern_pylon: "#54a9ad",
  tinkerer_station: "#8b7551",
  goblin_display: "#a66a46",
  fishing_ice: "#4f9fc0",
});

Object.assign(BLOCK_SPECS, {
  ice_block_plain: {
    layer: "Блок",
    itemRu: "Ледяной блок",
    itemEn: "Ice Block",
    paintRu: "Без краски",
    paintEn: "None",
    note: "1960 Ice Block формируют основную массу гарантированного ледяного биома вокруг мастерской и бассейна.",
  },
  snow_block_plain: {
    layer: "Блок",
    itemRu: "Снежный блок",
    itemEn: "Snow Block",
    paintRu: "Без краски",
    paintEn: "None",
    note: "24 Snow Block образуют нескользкие полы двух входных тоннелей и тоже входят в счётчик биома.",
  },
  copper_brick_plain: {
    layer: "Блок",
    itemRu: "Медный кирпич",
    itemEn: "Copper Brick",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Медная перемычка придаёт центральной мастерской индустриальный акцент без дорогих материалов.",
  },
});

Object.assign(WALL_SPECS, {
  goblin_green_wall: {
    itemRu: "Стена из серого кирпича",
    itemEn: "Gray Brick Wall",
    paintRu: "Зелёная краска",
    paintEn: "Green Paint",
    note: "Главная безопасная стена мастерской Гоблина и короткого спуска к водоёму.",
  },
  copper_wall_plain: {
    itemRu: "Стена из медного кирпича",
    itemEn: "Copper Brick Wall",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Тёплая рабочая панель за инструментами и зоной перековки.",
  },
});


// V3 room-specific wall palette and display styles.
Object.assign(WALL, {
  princess_pink_wall: ["#6d3f62", "#bd7ba7"],
});

Object.assign(STYLE, {
  mechanic_display: "#6d8790",
  ice_lantern: "#78d7eb",
  crystal_chandelier: "#aee8ff",
  crystal_candelabra: "#c8efff",
});

Object.assign(WALL_SPECS, {
  princess_pink_wall: {
    itemRu: "Гладкая мраморная стена",
    itemEn: "Smooth Marble Wall",
    paintRu: "Розовая краска",
    paintEn: "Pink Paint",
    note: "Основная декоративная панель комнаты Принцессы и фон её настенной полки.",
  },
});
