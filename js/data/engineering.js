/**
 * Engineering circuits, devices, trap columns, bridges, and wiring metadata.
 *
 * Generated from the original inline data without changing key or array order.
 */
const ENG = {
  "stage": "Ямы v3 clean · база v2 + точные столбцы ловушек и опущенные люки",
  "focus": {
    "x1": -22,
    "y1": 52,
    "x2": 157,
    "y2": 69
  },
  "circuits": [
    {
      "id": "HEARTS_ARM",
      "name": "HEARTS AUTO · управление таймером",
      "color": "yellow",
      "role": "Команда",
      "desc": "Реальный Switch 1×1 включает или выключает общий 1 Second Timer обеих Heart Statue.",
      "paths": [
        [
          [
            70,
            48
          ],
          [
            72,
            48
          ]
        ]
      ],
      "endpoints": [
        "HEARTS_SWITCH",
        "HEART_TIMER"
      ]
    },
    {
      "id": "HEART_AUTO",
      "name": "Автоматические Heart Statue",
      "color": "green",
      "role": "Лечение",
      "desc": "Общий 1 Second Timer автоматически подаёт импульсы на обе Heart Statue; вручную спамить кнопку не требуется.",
      "paths": [
        [
          [
            72,
            48
          ],
          [
            72,
            50
          ],
          [
            43,
            50
          ],
          [
            43,
            52
          ]
        ],
        [
          [
            72,
            50
          ],
          [
            92,
            50
          ],
          [
            92,
            52
          ]
        ]
      ],
      "endpoints": [
        "HEART_TIMER",
        "HEART_STAT_L · x43,y52",
        "HEART_STAT_R · x92,y52"
      ]
    },
    {
      "id": "L_PIT_FLOOR",
      "name": "Левый актуируемый мост",
      "color": "blue",
      "role": "Пол ямы",
      "desc": "Lever подаёт один импульс только на 16 актуаторов моста x−17…−2. Таймер ловушек к синей сети не подключён.",
      "paths": [
        [
          [
            1,
            56
          ],
          [
            1,
            54
          ],
          [
            -17,
            54
          ]
        ]
      ],
      "endpoints": [
        "L_PIT_LEVER",
        "L_PIT_BRIDGE"
      ]
    },
    {
      "id": "L_PIT_ARM",
      "name": "Левая яма · управление таймером",
      "color": "yellow",
      "role": "Команда",
      "desc": "Тот же Lever включает/выключает отдельный 1/2 Second Timer.",
      "paths": [
        [
          [
            1,
            56
          ],
          [
            1,
            55
          ]
        ]
      ],
      "endpoints": [
        "L_PIT_LEVER",
        "L_PIT_TIMER"
      ]
    },
    {
      "id": "L_PIT_DAMAGE",
      "name": "Левая яма · 16 Dart Trap",
      "color": "red",
      "role": "Урон",
      "desc": "Таймер посылает импульсы только двум столбцам по 8 Dart Trap. Актуаторы моста отделены.",
      "paths": [
        [
          [
            1,
            55
          ],
          [
            -18,
            55
          ],
          [
            -18,
            63
          ]
        ],
        [
          [
            1,
            55
          ],
          [
            -1,
            55
          ],
          [
            -1,
            63
          ]
        ]
      ],
      "endpoints": [
        "L_PIT_TIMER",
        "L_OUT_56…63",
        "L_IN_56…63"
      ]
    },
    {
      "id": "R_PIT_FLOOR",
      "name": "Правый актуируемый мост",
      "color": "blue",
      "role": "Пол ямы",
      "desc": "Lever подаёт один импульс только на 16 актуаторов моста x137…152.",
      "paths": [
        [
          [
            134,
            56
          ],
          [
            134,
            54
          ],
          [
            152,
            54
          ]
        ]
      ],
      "endpoints": [
        "R_PIT_LEVER",
        "R_PIT_BRIDGE"
      ]
    },
    {
      "id": "R_PIT_ARM",
      "name": "Правая яма · управление таймером",
      "color": "yellow",
      "role": "Команда",
      "desc": "Тот же Lever включает/выключает отдельный 1/2 Second Timer.",
      "paths": [
        [
          [
            134,
            56
          ],
          [
            134,
            55
          ]
        ]
      ],
      "endpoints": [
        "R_PIT_LEVER",
        "R_PIT_TIMER"
      ]
    },
    {
      "id": "R_PIT_DAMAGE",
      "name": "Правая яма · 16 Dart Trap",
      "color": "red",
      "role": "Урон",
      "desc": "Таймер посылает импульсы только двум столбцам по 8 Dart Trap. Актуаторы моста отделены.",
      "paths": [
        [
          [
            134,
            55
          ],
          [
            136,
            55
          ],
          [
            136,
            63
          ]
        ],
        [
          [
            134,
            55
          ],
          [
            153,
            55
          ],
          [
            153,
            63
          ]
        ]
      ],
      "endpoints": [
        "R_PIT_TIMER",
        "R_IN_56…63",
        "R_OUT_56…63"
      ]
    }
  ],
  "junctionBoxes": [],
  "devices": [
    {
      "id": "HEARTS_SWITCH",
      "name": "HEARTS AUTO · Switch",
      "x": 70,
      "y": 48,
      "w": 1,
      "h": 1,
      "kind": "switch",
      "short": "HEARTS",
      "stage": "M1",
      "initialState": "OFF",
      "circuits": [
        "HEARTS_ARM"
      ],
      "desc": "Реальный настенный Switch 1×1; один раз включает или выключает автоматическую выдачу сердец.",
      "foregroundLayer": "Механизм",
      "foregroundItemRu": "Переключатель",
      "foregroundItemEn": "Switch",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Switch занимает передний тайл и висит на фоновой стене; ручного HEART NOW больше нет.",
      "controlRole": "hearts"
    },
    {
      "id": "HEART_TIMER",
      "name": "Общий 1 Second Timer сердец",
      "x": 72,
      "y": 48,
      "w": 1,
      "h": 1,
      "kind": "timer",
      "short": "1s",
      "stage": "M1",
      "initialState": "OFF",
      "circuits": [
        "HEARTS_ARM",
        "HEART_AUTO"
      ],
      "desc": "Один реальный 1×1 1 Second Timer автоматически обслуживает обе Heart Statue.",
      "foregroundLayer": "Механизм",
      "foregroundItemRu": "Таймер 1 секунды",
      "foregroundItemEn": "1 Second Timer",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Таймер занимает один передний тайл и посылает зелёные импульсы обеим Heart Statue.",
      "timerRole": "hearts"
    },
    {
      "id": "L_PIT_LEVER",
      "name": "Левая яма · Lever 2×2",
      "x": 1,
      "y": 56,
      "w": 2,
      "h": 2,
      "kind": "lever",
      "short": "PIT L",
      "stage": "Ямы v3 clean",
      "initialState": "мост твёрдый / таймер OFF",
      "circuits": [
        "L_PIT_FLOOR",
        "L_PIT_ARM"
      ],
      "desc": "Реальный Lever 2×2 расположен в башне на x1–2, y56–57.",
      "foregroundLayer": "Механизм",
      "foregroundItemRu": "Рычаг",
      "foregroundItemEn": "Lever",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Lever занимает четыре передних тайла.",
      "controlRole": "pit",
      "pitSide": "left"
    },
    {
      "id": "L_PIT_TIMER",
      "name": "Левая яма · 1/2 Second Timer",
      "x": 1,
      "y": 55,
      "w": 1,
      "h": 1,
      "kind": "timer",
      "short": "½s",
      "stage": "Ямы v3 clean",
      "initialState": "OFF",
      "circuits": [
        "L_PIT_ARM",
        "L_PIT_DAMAGE"
      ],
      "desc": "Таймер находится непосредственно над Lever, в x1,y55, и обслуживает только 16 Dart Trap.",
      "foregroundLayer": "Механизм",
      "foregroundItemRu": "Таймер 1/2 секунды",
      "foregroundItemEn": "1/2 Second Timer",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Периодический выход идёт только в красную сеть ловушек.",
      "pitSide": "left"
    },
    {
      "id": "L_PIT_BRIDGE",
      "name": "Левый мост · 16 Gray Brick + Actuator",
      "x": -17,
      "y": 54,
      "w": 16,
      "h": 1,
      "kind": "bridge",
      "short": "МОСТ",
      "stage": "Ямы v3 clean",
      "initialState": "твёрдый / яма закрыта",
      "circuits": [
        "L_PIT_FLOOR"
      ],
      "desc": "16 Gray Brick с Actuator на x−17…−2.",
      "foregroundLayer": "Блок с механизмом",
      "foregroundItemRu": "Серый кирпич с актуатором",
      "foregroundItemEn": "Gray Brick with Actuator",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Каждый тайл занят Gray Brick; Actuator установлен на том же тайле.",
      "actuatorInstalled": true,
      "pitSide": "left"
    },
    {
      "id": "R_PIT_LEVER",
      "name": "Правая яма · Lever 2×2",
      "x": 133,
      "y": 56,
      "w": 2,
      "h": 2,
      "kind": "lever",
      "short": "PIT R",
      "stage": "Ямы v3 clean",
      "initialState": "мост твёрдый / таймер OFF",
      "circuits": [
        "R_PIT_FLOOR",
        "R_PIT_ARM"
      ],
      "desc": "Зеркальный Lever 2×2 расположен на x133–134, y56–57.",
      "foregroundLayer": "Механизм",
      "foregroundItemRu": "Рычаг",
      "foregroundItemEn": "Lever",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Lever занимает четыре передних тайла.",
      "controlRole": "pit",
      "pitSide": "right"
    },
    {
      "id": "R_PIT_TIMER",
      "name": "Правая яма · 1/2 Second Timer",
      "x": 134,
      "y": 55,
      "w": 1,
      "h": 1,
      "kind": "timer",
      "short": "½s",
      "stage": "Ямы v3 clean",
      "initialState": "OFF",
      "circuits": [
        "R_PIT_ARM",
        "R_PIT_DAMAGE"
      ],
      "desc": "Таймер находится непосредственно над Lever, в x134,y55, и обслуживает только 16 Dart Trap.",
      "foregroundLayer": "Механизм",
      "foregroundItemRu": "Таймер 1/2 секунды",
      "foregroundItemEn": "1/2 Second Timer",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Периодический выход идёт только в красную сеть ловушек.",
      "pitSide": "right"
    },
    {
      "id": "R_PIT_BRIDGE",
      "name": "Правый мост · 16 Gray Brick + Actuator",
      "x": 137,
      "y": 54,
      "w": 16,
      "h": 1,
      "kind": "bridge",
      "short": "МОСТ",
      "stage": "Ямы v3 clean",
      "initialState": "твёрдый / яма закрыта",
      "circuits": [
        "R_PIT_FLOOR"
      ],
      "desc": "16 Gray Brick с Actuator на x137…152.",
      "foregroundLayer": "Блок с механизмом",
      "foregroundItemRu": "Серый кирпич с актуатором",
      "foregroundItemEn": "Gray Brick with Actuator",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Каждый тайл занят Gray Brick; Actuator установлен на том же тайле.",
      "actuatorInstalled": true,
      "pitSide": "right"
    },
    {
      "id": "L_OUT_56",
      "name": "Левая яма · наружная Dart Trap y56",
      "x": -18,
      "y": 56,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "L_IN_56",
      "name": "Левая яма · внутренняя Dart Trap y56",
      "x": -1,
      "y": 56,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "R_IN_56",
      "name": "Правая яма · внутренняя Dart Trap y56",
      "x": 136,
      "y": 56,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "R_OUT_56",
      "name": "Правая яма · наружная Dart Trap y56",
      "x": 153,
      "y": 56,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "L_OUT_57",
      "name": "Левая яма · наружная Dart Trap y57",
      "x": -18,
      "y": 57,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "L_IN_57",
      "name": "Левая яма · внутренняя Dart Trap y57",
      "x": -1,
      "y": 57,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "R_IN_57",
      "name": "Правая яма · внутренняя Dart Trap y57",
      "x": 136,
      "y": 57,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "R_OUT_57",
      "name": "Правая яма · наружная Dart Trap y57",
      "x": 153,
      "y": 57,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "L_OUT_58",
      "name": "Левая яма · наружная Dart Trap y58",
      "x": -18,
      "y": 58,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "L_IN_58",
      "name": "Левая яма · внутренняя Dart Trap y58",
      "x": -1,
      "y": 58,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "R_IN_58",
      "name": "Правая яма · внутренняя Dart Trap y58",
      "x": 136,
      "y": 58,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "R_OUT_58",
      "name": "Правая яма · наружная Dart Trap y58",
      "x": 153,
      "y": 58,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "L_OUT_59",
      "name": "Левая яма · наружная Dart Trap y59",
      "x": -18,
      "y": 59,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "L_IN_59",
      "name": "Левая яма · внутренняя Dart Trap y59",
      "x": -1,
      "y": 59,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "R_IN_59",
      "name": "Правая яма · внутренняя Dart Trap y59",
      "x": 136,
      "y": 59,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "R_OUT_59",
      "name": "Правая яма · наружная Dart Trap y59",
      "x": 153,
      "y": 59,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "L_OUT_60",
      "name": "Левая яма · наружная Dart Trap y60",
      "x": -18,
      "y": 60,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "L_IN_60",
      "name": "Левая яма · внутренняя Dart Trap y60",
      "x": -1,
      "y": 60,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "R_IN_60",
      "name": "Правая яма · внутренняя Dart Trap y60",
      "x": 136,
      "y": 60,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "R_OUT_60",
      "name": "Правая яма · наружная Dart Trap y60",
      "x": 153,
      "y": 60,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "L_OUT_61",
      "name": "Левая яма · наружная Dart Trap y61",
      "x": -18,
      "y": 61,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "L_IN_61",
      "name": "Левая яма · внутренняя Dart Trap y61",
      "x": -1,
      "y": 61,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "R_IN_61",
      "name": "Правая яма · внутренняя Dart Trap y61",
      "x": 136,
      "y": 61,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "R_OUT_61",
      "name": "Правая яма · наружная Dart Trap y61",
      "x": 153,
      "y": 61,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "L_OUT_62",
      "name": "Левая яма · наружная Dart Trap y62",
      "x": -18,
      "y": 62,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "L_IN_62",
      "name": "Левая яма · внутренняя Dart Trap y62",
      "x": -1,
      "y": 62,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "R_IN_62",
      "name": "Правая яма · внутренняя Dart Trap y62",
      "x": 136,
      "y": 62,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "R_OUT_62",
      "name": "Правая яма · наружная Dart Trap y62",
      "x": 153,
      "y": 62,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "L_OUT_63",
      "name": "Левая яма · наружная Dart Trap y63",
      "x": -18,
      "y": 63,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "L_IN_63",
      "name": "Левая яма · внутренняя Dart Trap y63",
      "x": -1,
      "y": 63,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "L_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "left"
    },
    {
      "id": "R_IN_63",
      "name": "Правая яма · внутренняя Dart Trap y63",
      "x": 136,
      "y": 63,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "E",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет вправо внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "вправо",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    },
    {
      "id": "R_OUT_63",
      "name": "Правая яма · наружная Dart Trap y63",
      "x": 153,
      "y": 63,
      "w": 1,
      "h": 1,
      "kind": "trap",
      "short": "",
      "hideLabel": true,
      "facing": "W",
      "inactive": false,
      "actuatorInstalled": false,
      "stage": "Ямы v3 clean",
      "initialState": "твёрдая / таймер OFF",
      "circuits": [
        "R_PIT_DAMAGE"
      ],
      "desc": "Часть сплошного столбца из 8 ловушек; стреляет влево внутрь камеры.",
      "foregroundLayer": "Механизм-блок",
      "foregroundItemRu": "Дротиковая ловушка",
      "foregroundItemEn": "Dart Trap",
      "foregroundPaintRu": "Без краски",
      "foregroundPaintEn": "None",
      "foregroundNote": "Твёрдый непроходимый передний блок; актуатор не установлен.",
      "directionRu": "влево",
      "lineOfFire": "только внутри камеры",
      "setupProcedure": "поставить обычной твёрдой ловушкой",
      "pitSide": "right"
    }
  ],
  "futureSlots": []
};
