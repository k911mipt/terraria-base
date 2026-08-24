// Underground Snow Goblin workshop bounds, rooms, lighting zones and frozen design invariants.
const UNDERGROUND_BOUNDS = {
  "xMin": 0,
  "xMax": 65,
  "yMin": 0,
  "yMax": 50
};

const UNDERGROUND_ROOMS = [
  {
    "id": "underground_context",
    "name": "Подземный снежный узел",
    "x1": 0,
    "y1": 0,
    "x2": 65,
    "y2": 50,
    "short": "ЛЕДЯНОЙ БИОМ",
    "desc": "Трёхкомнатная мастерская и искусственный рыболовный резервуар внутри гарантированного ледяного биома; сцена не привязана к уникальным структурам конкретного мира."
  },
  {
    "id": "underground_mechanic",
    "name": "Техническая комната Механика",
    "x1": 12,
    "y1": 7,
    "x2": 23,
    "y2": 21,
    "short": "МЕХАНИК",
    "desc": "Компактное жильё с медной настенной панелью, тёмным каркасом, центральной люстрой, инструментальными рамками и свободным проходом у двери к Гоблину."
  },
  {
    "id": "underground_goblin",
    "name": "Стилизованная мастерская Гоблина",
    "x1": 23,
    "y1": 7,
    "x2": 42,
    "y2": 22,
    "short": "ГОБЛИН / ПИЛОН",
    "desc": "Жилой угол, медно-зелёная перековочная зона и стеклянная ниша пилона; обе внутренние двери имеют свободное место для открывания."
  },
  {
    "id": "underground_princess",
    "name": "Розово-кристальная комната Принцессы",
    "x1": 42,
    "y1": 7,
    "x2": 53,
    "y2": 21,
    "short": "ПРИНЦЕССА",
    "desc": "Светлое будущее жильё с розовой мраморной панелью, стеклянным окном, кристальной люстрой, настенным сундуком и аккуратной мебельной композицией."
  },
  {
    "id": "underground_access_left",
    "name": "Левый ледяной подход",
    "x1": 0,
    "y1": 14,
    "x2": 12,
    "y2": 22,
    "short": "ВХОД L",
    "desc": "Короткий открытый тоннель в естественном льду; дверь изолирует жилую часть от враждебных существ."
  },
  {
    "id": "underground_access_right",
    "name": "Правый ледяной подход",
    "x1": 53,
    "y1": 14,
    "x2": 65,
    "y2": 22,
    "short": "ВХОД R",
    "desc": "Зеркальный запасной вход без лишних платформ и пустых технических камер."
  },
  {
    "id": "underground_fishing",
    "name": "Подлёдный рыбацкий резервуар",
    "x1": 14,
    "y1": 21,
    "x2": 43,
    "y2": 45,
    "short": "РЫБАЛКА 20×16",
    "desc": "Подлёдный этаж с доступным с обеих сторон коротким спуском, открытым проходом к сундуку снастей, освещённым помостом и искусственным водоёмом 20×16."
  }
];

const UNDERGROUND_RESERVES = [];

const UNDERGROUND_LIGHTING_ZONES = [
  {
    "id": "mechanic_room",
    "name": "Комната Механика",
    "room": "underground_mechanic",
    "x1": 13,
    "y1": 8,
    "x2": 22,
    "y2": 20,
    "minCoverage": 1,
    "minSources": 2
  },
  {
    "id": "goblin_room",
    "name": "Мастерская Гоблина",
    "room": "underground_goblin",
    "x1": 24,
    "y1": 8,
    "x2": 41,
    "y2": 20,
    "minCoverage": 1,
    "minSources": 3
  },
  {
    "id": "princess_room",
    "name": "Комната Принцессы",
    "room": "underground_princess",
    "x1": 43,
    "y1": 8,
    "x2": 52,
    "y2": 20,
    "minCoverage": 1,
    "minSources": 2
  },
  {
    "id": "fishing_floor",
    "name": "Рыболовный этаж",
    "room": "underground_fishing",
    "x1": 15,
    "y1": 22,
    "x2": 42,
    "y2": 28,
    "minCoverage": 1,
    "minSources": 4
  }
];

const UNDERGROUND_VALIDATION = {
  "status": "PASS",
  "sceneWidth": 66,
  "sceneHeight": 51,
  "workshopWidth": 42,
  "npcHouses": 3,
  "residents": [
    "Mechanic",
    "Goblin Tinkerer",
    "Princess"
  ],
  "currentResidentsRequired": 2,
  "princessFutureResident": true,
  "goblinBiome": "Underground Snow / Ice",
  "goblinPriceModifier": 0.75,
  "goblinNeighborDistances": {
    "mechanic": 13,
    "princess": 15
  },
  "pylonCount": 1,
  "pylonType": "Cavern Pylon",
  "pylonWorksBeforePrincess": true,
  "serviceChests": 4,
  "personalStorage": 1,
  "tinkerersWorkshops": 1,
  "beds": 1,
  "totalDoors": 5,
  "doorsWithWall": 5,
  "doorWallTiles": 15,
  "iceBiomeBlocks": 1984,
  "iceBiomeThreshold": 1500,
  "iceBiomeGuaranteed": true,
  "fishingWaterWidth": 20,
  "fishingWaterDepth": 16,
  "fishingWaterTiles": 320,
  "fishingOpeningWidth": 4,
  "poolX": [
    15,
    34
  ],
  "poolY": [
    29,
    44
  ],
  "artificialPool": true,
  "platformTiles": 20,
  "platformLevels": [
    21,
    28
  ],
  "hatches": 1,
  "hatch": {
    "x": 36,
    "y": 22,
    "w": 2
  },
  "hatchPlatformY": 21,
  "hatchSupportX": [
    35,
    38
  ],
  "wiringCircuits": 0,
  "goblinStylePanels": 3,
  "openableDoors": 5,
  "lightingZones": 4,
  "lightingCoveragePercent": 100,
  "mechanicStyleRegions": 4,
  "princessStyleRegions": 5
};

const UNDERGROUND_NOTES = [
  "Финальная группа жителей остаётся прежней: Механик, Гоблин-инженер и будущая Принцесса.",
  "Обе внутренние двери имеют свободный трёхтайловый столбец с каждой стороны; наружным дверям достаточно свободной стороны тоннеля.",
  "Твёрдая стенка x38, y23–27 удалена: из короткого спуска теперь можно напрямую пройти к сундуку рыболовных снастей.",
  "Механик получила медно-техническую композицию, а комната Принцессы — розовый мрамор, стеклянное окно, кристальный свет и настенный сундук.",
  "Четыре функциональные зоны имеют 100% покрытие планировочной моделью освещения; это геометрическая проверка проекта, а не точная симуляция движка Terraria.",
  "Искусственный бассейн остаётся 20×16 = 320 тайлов, люк и семитайловый шаг платформ не изменены.",
  "1984 Snow/Ice Blocks по-прежнему гарантируют ледяной биом при пороге 1500."
];

const UNDERGROUND_TITLE = "Terraria — снежная мастерская Гоблина v3, освещённые комнаты и рыбалка 20×16";
