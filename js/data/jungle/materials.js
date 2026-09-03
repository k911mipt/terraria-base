// Surface Jungle palettes use the same base/dark/light and [dark, light]
// contracts as the shared Canvas renderer.
Object.assign(MAT, {
  rich_mahogany: {
    base: "#6e3d24",
    dark: "#3e2418",
    light: "#a56538",
  },
  rich_mahogany_platform: {
    base: "#7a4729",
    dark: "#402617",
    light: "#bd7841",
  },
  living_mahogany: {
    base: "#523522",
    dark: "#2d2118",
    light: "#87613a",
  },
  leaf_block: {
    base: "#2f6e35",
    dark: "#193f24",
    light: "#5ea34c",
  },
  jungle_grass: {
    base: "#59422d",
    dark: "#224f28",
    light: "#4f963a",
  },
  bamboo_block: {
    base: "#9b8b42",
    dark: "#5d572d",
    light: "#c7b65b",
  },
});

Object.assign(WALL, {
  rich_mahogany_wall: ["#5d3826", "#815139"],
  living_wood_wall: ["#443426", "#765b3e"],
  jungle_leaf_wall: ["#2e5930", "#4d7c43"],
  bamboo_wall: ["#6f6837", "#948a47"],
  painter_yellow_wall: ["#8f712f", "#c6a44b"],
  painter_teal_wall: ["#246a68", "#3e9690"],
  painter_magenta_wall: ["#713756", "#a8567b"],
  jungle_stone_wall: ["#435342", "#61725a"],
});

Object.assign(STYLE, {
  jungle_route: "#6d4228",
  jungle_dryad: "#3f8d47",
  jungle_hub: "#4e7f4c",
  jungle_painter: "#8e4e7b",
  jungle_witch: "#5f4930",
  jungle_pylon: "#3ca68a",
  witch_cauldron: "#465842",
  teleporter_reserve: "#3d4d48",
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
    note: "Наружные стены, перегородки и четыре живых корня; внутренние колонны святилища теперь находятся в фоновом слое.",
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
    safe: true,
    note: "Тёплый безопасный фон центрального павильона.",
  },
  living_wood_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из живого дерева",
    itemEn: "Living Wood Wall",
    paintRu: "Без краски",
    paintEn: "None",
    safe: true,
    note: "Поставленная игроком безопасная и проходимая стена образует две декоративные колонны святилища.",
  },
  jungle_leaf_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Зелёная краска",
    paintEn: "Green Paint",
    safe: true,
    note: "Садовый интерьер комнаты Дриады.",
  },
  bamboo_wall: {
    layer: "Фоновая стена",
    itemRu: "Бамбуковая стена",
    itemEn: "Bamboo Wall",
    paintRu: "Без краски",
    paintEn: "None",
    safe: true,
    note: "Тёплый ритуальный фон комнаты Шамана.",
  },
  painter_yellow_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Жёлтая краска",
    paintEn: "Yellow Paint",
    safe: true,
    note: "Левая цветная треть студии Маляра.",
  },
  painter_teal_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Бирюзовая краска",
    paintEn: "Teal Paint",
    safe: true,
    note: "Центральная цветная треть студии и фон платформы над люком.",
  },
  painter_magenta_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из красного дерева",
    itemEn: "Rich Mahogany Wall",
    paintRu: "Глубокая розовая краска",
    paintEn: "Deep Pink Paint",
    safe: true,
    note: "Правая цветная треть студии Маляра.",
  },
  jungle_stone_wall: {
    layer: "Фоновая стена",
    itemRu: "Стена из серого кирпича",
    itemEn: "Gray Brick Wall",
    paintRu: "Зелёная краска",
    paintEn: "Green Paint",
    safe: true,
    note: "Безопасный фон вертикальной шахты к Подземным джунглям.",
  },
});
