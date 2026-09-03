// Jungle outpost v1 keeps both teleporters as future reserves until the Temple door is located.
const ENG = {
  stage: "Поверхностный джунглевый аванпост v2 · резерв телепортера к Храму",
  focus: {
    x1: 4,
    y1: 6,
    x2: 61,
    y2: 62,
  },
  circuits: [],
  junctionBoxes: [],
  devices: [],
  futureSlots: [
    {
      id: "JG_TP_ROUTE",
      name: "Будущая линия Jungle Pylon → дверь Храма",
      x1: 34,
      y1: 33,
      x2: 57,
      y2: 61,
      desc: "Провод и реальная конечная точка добавляются после нахождения Храма в конкретном мире.",
    },
  ],
};
