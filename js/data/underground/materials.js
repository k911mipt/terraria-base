// Underground Snow-scene material and style extensions.
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
});

Object.assign(STYLE, {
  mechanic_npc: "#cf7f43",
  goblin_npc: "#57904c",
  princess_npc: "#c887b8",
  princess_room: "#d7e5ed",
  cavern_pylon: "#54a9ad",
  tinkerer_station: "#8b7551",
});

Object.assign(BLOCK_SPECS, {
  ice_block_plain: {
    layer: "Блок",
    itemRu: "Ледяной блок",
    itemEn: "Ice Block",
    paintRu: "Без краски",
    paintEn: "None",
    note: "1512 естественных Ice Block формируют основную массу гарантированного ледяного биома.",
  },
  snow_block_plain: {
    layer: "Блок",
    itemRu: "Снежный блок",
    itemEn: "Snow Block",
    paintRu: "Без краски",
    paintEn: "None",
    note: "24 Snow Block образуют нескользкие полы двух входных тоннелей и тоже входят в счётчик биома.",
  },
});
