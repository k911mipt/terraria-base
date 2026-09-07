// Shared placement and identity adapter. No DOM, Canvas or inference from current D.
// Bind each material key to its reviewed identity and collision mode independently
// of mutable display specs. A valid but different item name is still an error.
const MATERIAL_BINDINGS = {
  block: {
    bamboo_block: ["Bamboo", "solid"],
    black_slab: ["Stone Slab", "solid"],
    boreal_platform: ["Boreal Wood Platform", "platform"],
    boreal_platform_plain: ["Boreal Wood Platform", "platform"],
    boreal_wood: ["Boreal Wood", "solid"],
    bubble: ["Bubble", "passable"],
    cloud_block_plain: ["Cloud Block", "solid"],
    conveyor_left: ["Conveyor Belt (Counter Clockwise)", "solid"],
    conveyor_right: ["Conveyor Belt (Clockwise)", "solid"],
    copper_brick_plain: ["Copper Brick", "solid"],
    dart_trap_e: ["Dart Trap", "solid"],
    dart_trap_w: ["Dart Trap", "solid"],
    glass: ["Glass", "solid"],
    glass_platform: ["Glass Platform", "platform"],
    gray_brick: ["Gray Brick", "solid"],
    ice_block_plain: ["Ice Block", "solid"],
    jungle_grass: ["Mud Block with Jungle Grass", "solid"],
    leaf_block: ["Leaf Block", "solid"],
    living_mahogany: ["Living Mahogany", "solid"],
    marble: ["Smooth Marble Block", "solid"],
    mud: ["Mud Block", "solid"],
    mushroom_block: ["Glowing Mushroom (placed block)", "solid"],
    mushroom_grass: ["Mud Block", "solid"],
    mushroom_platform: ["Mushroom Platform", "platform"],
    palm_platform: ["Palm Wood Platform", "platform"],
    palm_wood: ["Palm Wood", "solid"],
    rich_mahogany: ["Rich Mahogany", "solid"],
    rich_mahogany_platform: ["Rich Mahogany Platform", "platform"],
    sand: ["Sand Block", "solid"],
    sandstone_block_plain: ["Sandstone Block", "solid"],
    snow_block_plain: ["Snow Block", "solid"],
  },
  wall: {
    accessory_wall: ["Boreal Wood Wall", "wall"],
    arena_wall: ["Stone Slab Wall", "wall"],
    bamboo_wall: ["Bamboo Wall", "wall"],
    boreal_wall: ["Boreal Wood Wall", "wall"],
    clinic_wall: ["Smooth Marble Wall", "wall"],
    cloud_wall_plain: ["Cloud Wall", "wall"],
    copper_wall_plain: ["Copper Brick Wall", "wall"],
    diamond_gemspark_wall: ["Diamond Gemspark Wall", "wall"],
    engineer_orange_wall: ["Stone Slab Wall", "wall"],
    fishing_wall: ["Glass Wall", "wall"],
    food_wall: ["Boreal Wood Wall", "wall"],
    glass_wall: ["Glass Wall", "wall"],
    goblin_green_wall: ["Gray Brick Wall", "wall"],
    gray_wall: ["Gray Brick Wall", "wall"],
    industrial_wall: ["Stone Slab Wall", "wall"],
    jungle_leaf_wall: ["Rich Mahogany Wall", "wall"],
    jungle_stone_wall: ["Gray Brick Wall", "wall"],
    living_wall: ["Living Wood Wall", "wall"],
    living_wood_wall: ["Living Wood Wall", "wall"],
    magic_cyan_wall: ["Smooth Marble Wall", "wall"],
    marble_plain_wall: ["Smooth Marble Wall", "wall"],
    museum_biomes: ["Smooth Marble Wall", "wall"],
    museum_center: ["Smooth Marble Wall", "wall"],
    museum_early: ["Smooth Marble Wall", "wall"],
    museum_final: ["Smooth Marble Wall", "wall"],
    museum_jungle: ["Smooth Marble Wall", "wall"],
    museum_mechs: ["Smooth Marble Wall", "wall"],
    museum_wof: ["Smooth Marble Wall", "wall"],
    mushroom_wall: ["Mushroom Wall", "wall"],
    painter_magenta_wall: ["Rich Mahogany Wall", "wall"],
    painter_teal_wall: ["Rich Mahogany Wall", "wall"],
    painter_yellow_wall: ["Rich Mahogany Wall", "wall"],
    palm_wall: ["Palm Wood Wall", "wall"],
    player1_accent_wall: ["Boreal Wood Wall", "wall"],
    player1_wall: ["Boreal Wood Wall", "wall"],
    player2_accent_wall: ["Boreal Wood Wall", "wall"],
    player2_wall: ["Boreal Wood Wall", "wall"],
    princess_pink_wall: ["Smooth Marble Wall", "wall"],
    purple_wall: ["Smooth Marble Wall", "wall"],
    rich_mahogany_wall: ["Rich Mahogany Wall", "wall"],
    sandstone_wall_plain: ["Sandstone Brick Wall", "wall"],
    tech_cyan_wall: ["Stone Slab Wall", "wall"],
    tower_wall: ["Stone Slab Wall", "wall"],
  },
};

const LAYER_COLLISIONS = {
  "Блок": "solid", "Твёрдый блок": "solid", "Блок с травой": "solid",
  "Поверхность": "solid", "Блок-механизм": "solid", "Механизм-блок": "solid",
  "Платформа": "platform", "Проходимый блок-мебель": "passable",
};

function materialBinding(id, background = false) {
  const bindings = MATERIAL_BINDINGS[background ? "wall" : "block"];
  if (!Object.hasOwn(bindings, id)) return null;
  const [itemEn, collision] = bindings[id];
  return {itemEn, collision};
}

function materialBindingProblems(id, spec, background = false) {
  const binding = materialBinding(id, background);
  if (!binding) return [`missing material binding: ${id}`];
  if (!spec || typeof spec !== "object") return []; // structural validator diagnoses this
  const errors = [];
  if (typeof spec.itemEn === "string" && spec.itemEn.trim() && spec.itemEn !== binding.itemEn)
    errors.push(`incompatible material identity for ${id}: expected ${binding.itemEn}, got ${spec.itemEn}`);
  if (!background && Object.hasOwn(LAYER_COLLISIONS, spec.layer) &&
      LAYER_COLLISIONS[spec.layer] !== binding.collision)
    errors.push(`incompatible material collision for ${id}: expected ${binding.collision}`);
  return errors;
}

// The material identity is separate from its placement inventory item. Wand-made
// tiles and grass surfaces must not be advertised as literal inventory items.
const COMPOSITE_MATERIALS = {
  living_mahogany: {kind: "tile", id: "Living Mahogany", inventoryItem: null},
  leaf_block: {kind: "tile", id: "Leaf Block", inventoryItem: null},
  jungle_grass: {kind: "surface", id: "Jungle Grass on Mud Block", inventoryItem: "Mud Block"},
  mushroom_grass: {kind: "surface", id: "Mushroom Grass on Mud Block", inventoryItem: "Mud Block"},
  mushroom_block: {kind: "item", id: "Glowing Mushroom", inventoryItem: "Glowing Mushroom"},
};

function materialPlacementContract(id, spec, background = false) {
  const binding = materialBinding(id, background);
  if (!binding || !spec || typeof spec !== "object" || Array.isArray(spec) ||
      materialSpecProblems(spec, background).length || materialBindingProblems(id, spec, background).length) return null;
  const identity = !background && Object.hasOwn(COMPOSITE_MATERIALS, id)
    ? {...COMPOSITE_MATERIALS[id]}
    : {kind: "item", id: binding.itemEn, inventoryItem: binding.itemEn};
  return {identity, collision: binding.collision, paint: spec?.paintEn ?? null,
    safe: background && typeof spec?.safe === "boolean" ? spec.safe : null};
}

const BUILDING_FLOOR_KINDS = new Set(['chest','station','furniture','bed','personal_storage',
  'pylon','campfire','statue','museum_mannequin']);
const BUILDING_WALL_KINDS = new Set(['museum_trophy','museum_weapon_rack','museum_item_frame','jungle_sign']);
const BUILDING_CEILING_STYLES = new Set(['lantern_warm','star_light','glass_lantern','ice_lantern',
  'copper_chandelier','crystal_chandelier','jungle_lantern','painter_lantern','tiki_lantern']);

// Attachment classes describe the existing design intention. Item identity and
// exact game footprint remain separate; unknown properties are not guessed.
function buildingObjectTraits(object) {
  if (object.kind === 'door') return {attachment:'door',collision:true,blocksDoor:false};
  if (object.kind === 'hatch') return {attachment:'hatch',collision:true,blocksDoor:false};
  if (object.kind === 'planter') return {attachment:'self',collision:true,blocksDoor:false};
  if (object.kind === 'honey_bubble') return {attachment:'embedded',collision:false,blocksDoor:false};
  if (BUILDING_FLOOR_KINDS.has(object.kind)) return {attachment:'floor',collision:true,blocksDoor:true};
  if (BUILDING_WALL_KINDS.has(object.kind)) return {attachment:'wall',collision:true,blocksDoor:false};
  if (object.kind === 'display') {
    return {attachment: ['P1_MAN','P2_MAN'].includes(object.id) ? 'floor' : 'wall',collision:true,blocksDoor:false};
  }
  if (['heart_lantern','star_bottle'].includes(object.kind))
    return {attachment:'ceiling',collision:true,blocksDoor:false};
  if (object.kind === 'light') {
    const attachment = ['tiki_torch','crystal_candelabra'].includes(object.style) ? 'floor'
      : BUILDING_CEILING_STYLES.has(object.style) ? 'ceiling' : 'torch';
    return {attachment,collision:true,blocksDoor:false};
  }
  return {attachment:'none',collision:false,blocksDoor:false};
}


// These optional annotations may confirm the contract, never silently disable it.
// Alternative attachment policies must first be supported by the shared type model.
function objectPlacementProblems(object) {
  if (!object || typeof object !== "object") return [];
  const placement = buildingObjectTraits(object), problems = [];
  for (const field of ["attachment", "collision", "blocksDoor"]) {
    if (Object.hasOwn(object, field) && object[field] !== placement[field])
      problems.push(`incompatible placement ${field}: expected ${placement[field]}`);
  }
  if (Object.hasOwn(object, "ceilingMounted") &&
      (typeof object.ceilingMounted !== "boolean" ||
       (object.ceilingMounted !== (placement.attachment === "ceiling"))))
    problems.push("incompatible placement ceilingMounted");
  return problems;
}

const OBJECT_PASSAGE_LABELS = {
  passable: "Проходимый предмет",
  platform: "Платформа: проходима снизу и сбоку",
  door: "Зависит от открытого/закрытого состояния",
  annotation: "Непредметный элемент схемы",
  unknown: "Не определено",
};
const ATTACHMENT_LABELS = {
  floor: "На опоре снизу", wall: "На фоновой стене", ceiling: "Под опорой сверху",
  torch: "Стена или подходящая соседняя опора", door: "Дверной проём",
  hatch: "Под платформой, между боковыми опорами", self: "Самонесущий элемент",
  embedded: "Составной элемент в переднем слое", none: "Не применяется",
};

function objectContract(object) {
  const metadata = objectMetadata(object), placement = object ? buildingObjectTraits(object) : null;
  const prefix = objectSpecPrefix(object), carrier = installedDisplayItem(object);
  let identity = {status: metadata.role === "unknown" || (prefix && metadata.problems.length) ? "invalid"
    : metadata.role === "item" ? "unresolved" : "non-item", items: []};
  if (metadata.role === "item" && prefix && !metadata.problems.length) {
    const itemEn = object[prefix + "ItemEn"];
    if (carrier) {
      identity = {status: "selected", items: [{id: carrier.itemEn, itemId: carrier.itemId}],
        contents: carrier.contents};
    } else if (itemEn === "Eater of Worlds / Brain of Cthulhu Trophy") {
      identity = {status: "alternative", items: [{id: "Eater of Worlds Trophy"}, {id: "Brain of Cthulhu Trophy"}]};
    } else if (object.kind === "honey_bubble") {
      identity = {status: "composite", items: [{id: "Bubble"}], liquid: "Honey"};
    } else identity = {status: "selected", items: [{id: itemEn}]};
  }
  const passage = metadata.role === "unknown" ? "unknown" : metadata.role !== "item" ? "annotation"
    : ["door", "hatch"].includes(object.kind) ? "door" : object.kind === "planter" ? "platform" : "passable";
  return {...metadata, identity, placement, passage,
    renderer: {kind: object?.kind ?? null, style: object?.style ?? null},
    problems: [...metadata.problems, ...objectPlacementProblems(object)]};
}
