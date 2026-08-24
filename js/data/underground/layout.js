// Underground Snow Goblin workshop bounds, rooms and frozen design invariants.
const UNDERGROUND_BOUNDS = {
  xMin: 0,
  xMax: 65,
  yMin: 0,
  yMax: 34,
};

const UNDERGROUND_ROOMS = [
  {
    id: "underground_context",
    name: "Подземный снежный узел",
    x1: 0,
    y1: 0,
    x2: 65,
    y2: 34,
    short: "ЛЕДЯНОЙ БИОМ",
    desc: "Компактная трёхкомнатная мастерская внутри гарантированного ледяного биома; сцена не привязана к уникальным структурам конкретного мира.",
  },
  {
    id: "underground_mechanic",
    name: "Комната Механика",
    x1: 12,
    y1: 7,
    x2: 23,
    y2: 21,
    short: "МЕХАНИК",
    desc: "Левое техническое крыло с отдельным валидным жильём, оперативным сундуком проводки и соседством с Гоблином.",
  },
  {
    id: "underground_goblin",
    name: "Мастерская Гоблина",
    x1: 23,
    y1: 7,
    x2: 42,
    y2: 21,
    short: "ГОБЛИН / ПИЛОН",
    desc: "Центральная комната перековки: Гоблин, Мастерская инженера, сейф, сундук на перековку и Пилон пещер.",
  },
  {
    id: "underground_princess",
    name: "Комната Принцессы",
    x1: 42,
    y1: 7,
    x2: 53,
    y2: 21,
    short: "ПРИНЦЕССА",
    desc: "Правое готовое жильё будущего третьего соседа. До появления Принцессы комната остаётся свободной, а пилон уже работает от Гоблина и Механика.",
  },
  {
    id: "underground_access_left",
    name: "Левый ледяной подход",
    x1: 0,
    y1: 14,
    x2: 12,
    y2: 22,
    short: "ВХОД L",
    desc: "Короткий открытый тоннель в естественном льду; дверь изолирует жилую часть от враждебных существ.",
  },
  {
    id: "underground_access_right",
    name: "Правый ледяной подход",
    x1: 53,
    y1: 14,
    x2: 65,
    y2: 22,
    short: "ВХОД R",
    desc: "Зеркальный запасной вход без лишних платформ, шахт и пустых технических камер.",
  },
];

const UNDERGROUND_RESERVES = [];

const UNDERGROUND_VALIDATION = {
  status: "PASS",
  sceneWidth: 66,
  sceneHeight: 35,
  workshopWidth: 42,
  npcHouses: 3,
  residents: ["Mechanic", "Goblin Tinkerer", "Princess"],
  currentResidentsRequired: 2,
  princessFutureResident: true,
  goblinBiome: "Underground Snow / Ice",
  goblinPriceModifier: 0.75,
  goblinNeighborDistances: {
    mechanic: 17,
    princess: 12,
  },
  pylonCount: 1,
  pylonType: "Cavern Pylon",
  pylonWorksBeforePrincess: true,
  serviceChests: 3,
  personalStorage: 1,
  tinkerersWorkshops: 1,
  beds: 1,
  totalDoors: 4,
  doorsWithWall: 4,
  doorWallTiles: 12,
  iceBiomeBlocks: 1536,
  iceBiomeThreshold: 1500,
  iceBiomeGuaranteed: true,
  platforms: 0,
  hatches: 0,
  wiringCircuits: 0,
};

const UNDERGROUND_NOTES = [
  "Финальная группа из ранее выбранного плана: Механик, Гоблин-инженер и Принцесса в подземном снежном биоме.",
  "Гоблин находится в предпочитаемом подземном слое рядом с любимым Механиком и нравящейся ему Принцессой; оба соседа ближе 25 тайлов.",
  "1512 Ice Block и 24 Snow Block дают 1536 биомных блоков и превышают порог 1500 и гарантируют ледяной биом; он перекрывает подземный штраф Механика.",
  "До появления Принцессы Пилон пещер уже работает от двух поселённых NPC: Гоблина и Механика.",
  "За всеми четырьмя дверями есть безопасные фоновые стены на всех трёх тайлах проёма.",
  "В сцене нет платформ и люков; правила их установки остаются обязательными для будущих расширений.",
];

const UNDERGROUND_TITLE =
  "Terraria — подземная снежная мастерская Гоблина, перековка 75% и Пилон пещер";
