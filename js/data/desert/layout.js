// Desert outpost bounds, rooms and design metadata.
const DESERT_BOUNDS = {
  "xMin": 0,
  "xMax": 79,
  "yMin": 0,
  "yMax": 70
};

const DESERT_ROOMS = [
  {
    "id": "desert_surface",
    "name": "Компактный поверхностный павильон",
    "x1": 10,
    "y1": 3,
    "x2": 76,
    "y2": 27,
    "short": "ПАВИЛЬОН",
    "desc": "Компактный аванпост с двумя NPC-комнатами, Desert Pylon, центральной шахтой и естественным песком под левым жилым крылом."
  },
  {
    "id": "desert_npc_left",
    "name": "Жильё Оружейника",
    "x1": 18,
    "y1": 8,
    "x2": 28,
    "y2": 20,
    "short": "ОРУЖ.",
    "desc": "Компактная отдельная комната с дверями, столом, стулом, светом и безопасной фоновой стеной."
  },
  {
    "id": "desert_hub",
    "name": "Центральный зал и пилон",
    "x1": 28,
    "y1": 6,
    "x2": 54,
    "y2": 20,
    "short": "ХАБ / ПИЛОН",
    "desc": "Главный пункт прибытия: Desert Pylon, кровать, локальный верстак, два быстрых сундука и люк в сервисную шахту."
  },
  {
    "id": "desert_npc_right",
    "name": "Жильё Красильщика",
    "x1": 54,
    "y1": 8,
    "x2": 64,
    "y2": 20,
    "short": "КРАС.",
    "desc": "Вторая компактная NPC-комната; вместе с левым домом она обслуживает пустынный пилон."
  },
  {
    "id": "desert_shaft",
    "name": "Центральный спуск в подземную пустыню",
    "x1": 48,
    "y1": 20,
    "x2": 55,
    "y2": 70,
    "short": "СПУСК 7",
    "desc": "Люк x49–50 открывается прямо в шахту x49–54. Боковая дверь на x48 ведёт к бассейну; платформы идут y27/34/41/48/55/62/69."
  },
  {
    "id": "desert_service",
    "name": "Сервис и рыбалка",
    "x1": 28,
    "y1": 20,
    "x2": 47,
    "y2": 27,
    "short": "СЕРВИС / РЫБАЛКА",
    "desc": "Сервисная и рыболовная зона начинается под центральным хабом на x28. Под Оружейником x14–27 находится естественный Sand Block, поэтому пустого помещения там нет."
  }
];

const DESERT_RESERVES = [];

const DESERT_VALIDATION = {
  "status": "PASS",
  "npcHouses": 2,
  "pylonCount": 1,
  "sceneWidth": 80,
  "surfaceWidth": 55,
  "fishingWaterWidth": 20,
  "fishingWaterDepth": 16,
  "fishingWaterTiles": 320,
  "fishingOpeningWidth": 4,
  "serviceChests": 5,
  "accessDoors": 1,
  "totalDoors": 5,
  "undergroundAccess": "direct vertical shaft",
  "platformStep": 7,
  "centralLevels": [
    20,
    27
  ],
  "descentPlatforms": [
    27,
    34,
    41,
    48,
    55,
    62,
    69
  ],
  "foundationTiles": 0,
  "leftPoolGap": 0,
  "poolX": [
    28,
    47
  ],
  "oneTileFloorY": 20,
  "lowerRoomInterior": "20×6",
  "lowerRoomWallTiles": 120,
  "waterY": [
    28,
    43
  ],
  "accessDoorY": [
    24,
    26
  ],
  "rooms": 6,
  "separateFishingHall": false,
  "shaftUnderHatch": true,
  "shaftX": [
    49,
    54
  ],
  "shaftDoorX": 48,
  "serviceX": [
    28,
    47
  ],
  "naturalSupportTiles": 84,
  "emptyUnderArms": false,
  "doorsWithWall": 5,
  "doorWallTiles": 15,
  "hatch": {
    "x": 49,
    "y": 21,
    "w": 2
  },
  "hatchPlatformY": 20,
  "hatchPlatformMaterial": "palm_platform",
  "hatchSupportX": [
    48,
    51
  ],
  "hatchShiftedBelowFloor": true
};

const DESERT_NOTES = [
  "Сцена универсальна и не привязана к расположению конкретных мировых структур.",
  "За каждой из пяти дверей находится безопасная фоновая стена на всех трёх тайлах дверного проёма.",
  "На x49–50, y20 находится Palm Wood Platform; люк перенесён на x49–50, y21.",
  "Люк удерживается твёрдыми боковыми блоками x48 и x51 на уровне y21.",
  "Под Оружейником нет пустой комнаты: x14–27, y21–26 заполнены естественным Sand Block.",
  "Бассейн 20×16 сохраняет координаты x28–47, y28–43 и 320 тайлов воды.",
  "Платформы центральной шахты расположены на y27/34/41/48/55/62/69 с постоянным шагом 7."
];

const DESERT_TITLE = "Terraria — компактный пустынный аванпост, пилон и рыбалка";
