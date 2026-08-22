// Wiring circuits and exact orthogonal paths.
// Generated from the canonical monolith without changing item order.
const ENGINEERING_CIRCUITS = [
  {
    id: "HEARTS_ARM",
    name: "HEARTS AUTO · управление таймером",
    color: "yellow",
    role: "Команда",
    desc: "Реальный Switch 1×1 включает или выключает общий 1 Second Timer обеих Heart Statue.",
    paths: [
      [
        [70, 48],
        [72, 48],
      ],
    ],
    endpoints: ["HEARTS_SWITCH", "HEART_TIMER"],
  },
  {
    id: "HEART_AUTO",
    name: "Автоматические Heart Statue",
    color: "green",
    role: "Лечение",
    desc: "Общий 1 Second Timer автоматически подаёт импульсы на обе Heart Statue; вручную спамить кнопку не требуется.",
    paths: [
      [
        [72, 48],
        [72, 50],
        [43, 50],
        [43, 52],
      ],
      [
        [72, 50],
        [92, 50],
        [92, 52],
      ],
    ],
    endpoints: [
      "HEART_TIMER",
      "HEART_STAT_L · x43,y52",
      "HEART_STAT_R · x92,y52",
    ],
  },
  {
    id: "L_PIT_FLOOR",
    name: "Левый актуируемый мост",
    color: "blue",
    role: "Пол ямы",
    desc: "Lever подаёт один импульс только на 16 актуаторов моста x−17…−2. Таймер ловушек к синей сети не подключён.",
    paths: [
      [
        [1, 56],
        [1, 54],
        [-17, 54],
      ],
    ],
    endpoints: ["L_PIT_LEVER", "L_PIT_BRIDGE"],
  },
  {
    id: "L_PIT_ARM",
    name: "Левая яма · управление таймером",
    color: "yellow",
    role: "Команда",
    desc: "Тот же Lever включает/выключает отдельный 1/2 Second Timer.",
    paths: [
      [
        [1, 56],
        [1, 55],
      ],
    ],
    endpoints: ["L_PIT_LEVER", "L_PIT_TIMER"],
  },
  {
    id: "L_PIT_DAMAGE",
    name: "Левая яма · 16 Dart Trap",
    color: "red",
    role: "Урон",
    desc: "Таймер посылает импульсы только двум столбцам по 8 Dart Trap. Актуаторы моста отделены.",
    paths: [
      [
        [1, 55],
        [-18, 55],
        [-18, 63],
      ],
      [
        [1, 55],
        [-1, 55],
        [-1, 63],
      ],
    ],
    endpoints: ["L_PIT_TIMER", "L_OUT_56…63", "L_IN_56…63"],
  },
  {
    id: "R_PIT_FLOOR",
    name: "Правый актуируемый мост",
    color: "blue",
    role: "Пол ямы",
    desc: "Lever подаёт один импульс только на 16 актуаторов моста x137…152.",
    paths: [
      [
        [134, 56],
        [134, 54],
        [152, 54],
      ],
    ],
    endpoints: ["R_PIT_LEVER", "R_PIT_BRIDGE"],
  },
  {
    id: "R_PIT_ARM",
    name: "Правая яма · управление таймером",
    color: "yellow",
    role: "Команда",
    desc: "Тот же Lever включает/выключает отдельный 1/2 Second Timer.",
    paths: [
      [
        [134, 56],
        [134, 55],
      ],
    ],
    endpoints: ["R_PIT_LEVER", "R_PIT_TIMER"],
  },
  {
    id: "R_PIT_DAMAGE",
    name: "Правая яма · 16 Dart Trap",
    color: "red",
    role: "Урон",
    desc: "Таймер посылает импульсы только двум столбцам по 8 Dart Trap. Актуаторы моста отделены.",
    paths: [
      [
        [134, 55],
        [136, 55],
        [136, 63],
      ],
      [
        [134, 55],
        [153, 55],
        [153, 63],
      ],
    ],
    endpoints: ["R_PIT_TIMER", "R_IN_56…63", "R_OUT_56…63"],
  },
];
