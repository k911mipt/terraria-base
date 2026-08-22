// Desert-only visual and inspector extensions. Loaded after the shared materials.
Object.assign(MAT, {
  sand: {
    base: "#d8b36b",
    dark: "#a87b3e",
    light: "#f1d591",
  },
  palm_wood: {
    base: "#9a6c3e",
    dark: "#5a3a24",
    light: "#c79155",
  },
  palm_platform: {
    base: "#ad7944",
    dark: "#644025",
    light: "#d9a363",
  },
});

Object.assign(WALL, {
  palm_wall: ["#765233", "#a77548"],
});

Object.assign(STYLE, {
  desert_npc: "#c4934f",
  desert_npc_alt: "#8062a0",
  desert_furniture: "#a46d3e",
  desert_bed: "#c58e56",
  desert_pylon: "#d0a34b",
  oasis_water: "#2f9caf",
});

Object.assign(BLOCK_SPECS, {
  sand: {
    layer: "Блок",
    itemRu: "Блок песка",
    itemEn: "Sand Block",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Естественный грунт пустынного биома вокруг аванпоста.",
  },
  palm_wood: {
    layer: "Блок",
    itemRu: "Пальмовая древесина",
    itemEn: "Palm Wood",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Тёплый деревянный акцент пустынного павильона.",
  },
  palm_platform: {
    layer: "Платформа",
    itemRu: "Платформа из пальмовой древесины",
    itemEn: "Palm Wood Platform",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Проходимые навесы, шахтные уступы и рыболовный мостик.",
  },
});

Object.assign(WALL_SPECS, {
  palm_wall: {
    itemRu: "Стена из пальмовой древесины",
    itemEn: "Palm Wood Wall",
    paintRu: "Без краски",
    paintEn: "None",
    safe: true,
    note: "Тёплая поставленная игроком стена центрального пустынного хаба.",
  },
});
