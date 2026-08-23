// Dual-purpose Old One's Army layout inside the existing left boss arena.
// No new physical floors or ceilings are required: the current Gray Brick floor
// and four Boreal Wood Platform rows already satisfy both use cases.

const bossArenaBast = OBJECTS_ARENA.find((object) => object.id === "BOSS_BAST_C");
if (bossArenaBast) {
  Object.assign(bossArenaBast, {
    x: -123,
    y: 38,
    desc:
      "Bast Statue перенесена с пола на платформу y41, чтобы центр пола оставался свободен под Eternia Crystal Stand.",
  });
}

const OBJECTS_ETERNIA = [
  {
    id: "ETERNIA_PORTAL_L",
    name: "Ожидаемая зона левого портала",
    x: -200,
    y: 49,
    w: 5,
    h: 5,
    kind: "zone",
    style: "spawn",
    short: "PORTAL L",
    room: "boss_left",
    stage: "Армия Древних",
    bossArenaLeft: true,
    arenaSpec: true,
    eterniaSpec: true,
    hideLabel: false,
    desc:
      "Ориентировочная зона Mysterious Portal у левого края пола. Реальная позиция выбирается игрой в допустимом диапазоне от центра стойки.",
  },
  {
    id: "ETERNIA_PORTAL_R",
    name: "Ожидаемая зона правого портала",
    x: -37,
    y: 49,
    w: 5,
    h: 5,
    kind: "zone",
    style: "spawn",
    short: "PORTAL R",
    room: "boss_left",
    stage: "Армия Древних",
    bossArenaLeft: true,
    arenaSpec: true,
    eterniaSpec: true,
    hideLabel: false,
    desc:
      "Ориентировочная зона Mysterious Portal у правого края пола. Реальная позиция выбирается игрой в допустимом диапазоне от центра стойки.",
  },
  {
    id: "ETERNIA_SENTRY_L",
    name: "Левая площадка турелей",
    x: -161,
    y: 28,
    w: 5,
    h: 3,
    kind: "zone",
    style: "summon",
    short: "SENTRY L",
    room: "boss_left",
    stage: "Армия Древних",
    bossArenaLeft: true,
    arenaSpec: true,
    eterniaSpec: true,
    desc:
      "Рекомендуемая зона Ballista / Flameburst на существующей платформе y31, примерно посередине между стойкой и левым порталом.",
  },
  {
    id: "ETERNIA_SENTRY_R",
    name: "Правая площадка турелей",
    x: -77,
    y: 28,
    w: 5,
    h: 3,
    kind: "zone",
    style: "summon",
    short: "SENTRY R",
    room: "boss_left",
    stage: "Армия Древних",
    bossArenaLeft: true,
    arenaSpec: true,
    eterniaSpec: true,
    desc:
      "Рекомендуемая зона Ballista / Flameburst на существующей платформе y31, примерно посередине между стойкой и правым порталом.",
  },
  {
    id: "ETERNIA_STAND",
    name: "Стойка для кристалла Этернии",
    x: -119,
    y: 51,
    w: 5,
    h: 3,
    kind: "station",
    style: "summon",
    short: "ETERNIA",
    room: "boss_left",
    stage: "Армия Древних",
    bossArenaLeft: true,
    arenaSpec: true,
    eterniaSpec: true,
    centerX: -117,
    floorY: 54,
    requiredClearanceEachSide: 61,
    leftClearance: 83,
    rightClearance: 84,
    freeHeight: 12,
    foregroundLayer: "Мебель события",
    foregroundItemRu: "Стойка для кристалла Этернии",
    foregroundItemEn: "Eternia Crystal Stand",
    foregroundPaintRu: "Без краски",
    foregroundPaintEn: "None",
    foregroundNote:
      "Стойка 5×3 стоит на настоящем Gray Brick floor y54; платформы не используются как опора.",
    desc:
      "Центр двойного назначения левой арены. От центра x−117 до краёв сплошного пола остаётся 83 тайла слева и 84 справа; ближайшая платформа находится на y41.",
  },
];
