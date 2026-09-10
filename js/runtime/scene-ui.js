
// Scene differences only. Shared startup/tables/controls consume this record.
export const SCENE_UI = {
  main: {
    engineering: true,
    initialMode: "arena",
    initialFocus: [-34, 40, 169, 71],
    roomFilter: room => !room.id.startsWith("spawn"),
    hiddenObjectKinds: [],
    focus: {
      upper: {bounds: [0, -7, 135, 41]},
      greenhouse: {bounds: [43, -8, 92, 7]},
      craft: {bounds: [43, -7, 92, 42]},
      bossLeft: {bounds: [-202, 0, -31, 55], mode: "arena"},
      arena: {bounds: [-4, 40, 139, 55], mode: "arena"},
      pitsBtn: {bounds: [-34, 40, 169, 69], mode: "arena"},
      museumBtn: {bounds: [6, 52, 129, 69], mode: "visual"},
      wiringBtn: {bounds: [-34, 40, 169, 69], mode: "wiring"},
    },
  },
  desert: {
    engineering: false,
    initialMode: "visual",
    initialFocus: null,
    roomFilter: () => true,
    hiddenObjectKinds: ["light", "furniture", "palm_tree", "cactus"],
    focus: {
      upper: {bounds: [12, 1, 70, 28]},
      greenhouse: {bounds: [16, 6, 66, 21]},
      craft: {bounds: [12, 19, 49, 29]},
      arena: {bounds: [25, 19, 50, 46]},
      pitsBtn: {bounds: [46, 19, 57, 71]},
    },
  },
  underground: {
    engineering: false,
    initialMode: "visual",
    initialFocus: null,
    roomFilter: room => room.id !== "underground_context",
    hiddenObjectKinds: ["light", "furniture"],
    focus: {
      upper: {bounds: [8, 4, 58, 48]},
      greenhouse: {bounds: [10, 5, 25, 24]},
      craft: {bounds: [21, 5, 44, 24]},
      arena: {bounds: [40, 5, 55, 24]},
      pitsBtn: {bounds: [12, 19, 45, 47]},
    },
  },
  jungle: {
    engineering: false,
    initialMode: "visual",
    initialFocus: null,
    roomFilter: room => !["jungle_context", "jungle_landscape"].includes(room.id),
    hiddenObjectKinds: ["light", "furniture", "jungle_vine"],
    focus: {
      upper: {bounds: [4, 5, 62, 45]},
      greenhouse: {bounds: [6, 17, 23, 37]},
      craft: {bounds: [19, 17, 41, 37]},
      arena: {bounds: [23, 5, 39, 25]},
      pitsBtn: {bounds: [37, 17, 54, 37]},
      shaftBtn: {bounds: [50, 19, 63, 63]},
    },
  },
};
