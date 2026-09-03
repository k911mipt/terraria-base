// Surface Jungle materials and object palettes layered on top of shared specs.
Object.assign(MAT, {
  rich_mahogany: {
    base: "#6e3d24",
    accent: "#a56538",
    edge: "#3e2418",
    name: "Rich Mahogany",
  },
  rich_mahogany_platform: {
    base: "#7a4729",
    accent: "#bd7841",
    edge: "#402617",
    name: "Rich Mahogany Platform",
  },
  living_mahogany: {
    base: "#523522",
    accent: "#87613a",
    edge: "#2d2118",
    name: "Living Mahogany",
  },
  leaf_block: {
    base: "#2f6e35",
    accent: "#5ea34c",
    edge: "#193f24",
    name: "Leaf Block",
  },
  jungle_grass: {
    base: "#59422d",
    accent: "#4f963a",
    edge: "#224f28",
    name: "Jungle Grass on Mud",
  },
  bamboo_block: {
    base: "#9b8b42",
    accent: "#c7b65b",
    edge: "#5d572d",
    name: "Bamboo",
  },
});

Object.assign(WALL, {
  rich_mahogany_wall: {
    base: "#5d3826",
    accent: "#815139",
    edge: "#382419",
    name: "Rich Mahogany Wall",
  },
  jungle_leaf_wall: {
    base: "#2e5930",
    accent: "#4d7c43",
    edge: "#203d25",
    name: "Rich Mahogany Wall + Green Paint",
  },
  bamboo_wall: {
    base: "#6f6837",
    accent: "#948a47",
    edge: "#454329",
    name: "Bamboo Wall",
  },
  painter_yellow_wall: {
    base: "#8f712f",
    accent: "#c6a44b",
    edge: "#5f4822",
    name: "Rich Mahogany Wall + Yellow Paint",
  },
  painter_teal_wall: {
    base: "#246a68",
    accent: "#3e9690",
    edge: "#174746",
    name: "Rich Mahogany Wall + Teal Paint",
  },
  painter_magenta_wall: {
    base: "#713756",
    accent: "#a8567b",
    edge: "#492337",
    name: "Rich Mahogany Wall + Deep Pink Paint",
  },
  jungle_stone_wall: {
    base: "#435342",
    accent: "#61725a",
    edge: "#2b362c",
    name: "Gray Brick Wall + Green Paint",
  },
});

Object.assign(STYLE, {
  jungle_route: {
    fill: "#6d4228",
    stroke: "#d5a260",
    accent: "#9f6a36",
    text: "#fff4d7",
  },
  jungle_dryad: {
    fill: "#3f8d47",
    stroke: "#c2ef91",
    accent: "#7fc662",
    text: "#f3ffe8",
  },
  jungle_hub: {
    fill: "#4e7f4c",
    stroke: "#d4c56d",
    accent: "#8caa58",
    text: "#fff7cf",
  },
  jungle_painter: {
    fill: "#8e4e7b",
    stroke: "#f0c85d",
    accent: "#39a79d",
    text: "#fff7f1",
  },
  jungle_witch: {
    fill: "#5f4930",
    stroke: "#bfcb68",
    accent: "#7c9b4b",
    text: "#fff2cf",
  },
  jungle_pylon: {
    fill: "#3ca68a",
    stroke: "#9bf5c1",
    accent: "#d5f079",
    text: "#f1fff9",
  },
  teleporter_reserve: {
    fill: "#3d4d48",
    stroke: "#94cdaa",
    accent: "#5e8b78",
    text: "#dff8e9",
  },
});

Object.assign(BLOCK_SPECS, {
  rich_mahogany: {
    layer: "Твёрдый блок",
    itemRu: "Красное дерево",
    itemEn: "Rich Mahogany",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Основной каркас поверхностного домика в кронах.",
  },
  rich_mahogany_platform: {
    layer: "Платформа",
    itemRu: "Платформа из красного дерева",
    itemEn: "Rich Mahogany Platform",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Крыльцо, люк, промежуточная площадка и уровни шахты.",
  },
  living_mahogany: {
    layer: "Твёрдый блок",
    itemRu: "Живое красное дерево",
    itemEn: "Living Mahogany",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Стены, подвесные стойки и четыре живых корня.",
  },
  leaf_block: {
    layer: "Твёрдый блок",
    itemRu: "Блок листвы",
    itemEn: "Leaf Block",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Ступенчатые кроны вместо обычной тяжёлой крыши.",
  },
  jungle_grass: {
    layer: "Поверхность",
    itemRu: "Грязь с травой джунглей",
    itemEn: "Mud Block with Jungle Grass",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Существующая поверхность биома; не создаётся искусственно ради счётчика.",
  },
  bamboo_block: {
    layer: "Твёрдый блок",
    itemRu: "Бамбук",
    itemEn: "Bamboo",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Лёгкая перемычка центрального святилища.",
  },
});

Object.assign(WALL_SPECS, {
  rich_mahogany_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Тёплый безопасный фон центрального павильона.",
  },
  jungle_leaf_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Зелёная краска",
    paintEn: "Green Paint",
    note: "Садовый интерьер комнаты Дриады.",
  },
  bamboo_wall: {
    layer: "Фоновая стена",
    itemRu: "Бамбуковая стена",
    itemEn: "Bamboo Wall",
    paintRu: "Без краски",
    paintEn: "None",
    note: "Тёплый ритуальный фон комнаты Шамана.",
  },
  painter_yellow_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Жёлтая краска",
    paintEn: "Yellow Paint",
    note: "Левая цветная треть студии Маляра.",
  },
  painter_teal_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Бирюзовая краска",
    paintEn: "Teal Paint",
    note: "Центральная цветная треть студии и фон платформы над люком.",
  },
  painter_magenta_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Глубокая розовая краска",
    paintEn: "Deep Pink Paint",
    note: "Правая цветная треть студии Маляра.",
  },
  jungle_stone_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из серого кирпича",
    itemEn: "Gray Brick Wall",
    paintRu: "Зелёная краска",
    paintEn: "Green Paint",
    note: "Безопасный фон вертикальной шахты к Подземным джунглям.",
  },
});
