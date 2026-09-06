// Pure construction checks. The source rectangle order is part of the model.
// This validates the planner's documented rules, not Terraria's whole engine.
const BUILDING_SCENES = {
  main: {
    closedRooms: ['left_tower','forest_npc','transport','p1','craft','greenhouse','p2',
      'clinic_npc','prebattle','mushroom','right_tower','arena','museum','pit_l','pit_r'],
    passages: [{id:'combat-street-center',x1:67,x2:68,y1:43,y2:53}],
    platformRuns: [
      {id:'craft-center',x:67,levels:[6,13,20,27,34,41],step:7},
      {id:'left-tower',x:3,levels:[18,24,30,36],step:6,reason:'Symmetric six-tile intermediate tower floors.'},
      {id:'right-tower',x:131,levels:[18,24,30,36],step:6,reason:'Symmetric six-tile intermediate tower floors.'},
    ],
  },
  desert: {
    closedRooms:['desert_npc_left','desert_hub','desert_npc_right','desert_shaft','desert_service'],
    passages:[{id:'desert-shaft',x1:49,x2:50,y1:22,y2:69}],
    platformRuns:[{id:'desert-shaft',x:49,levels:[20,27,34,41,48,55,62,69],step:7}],
  },
  underground: {
    closedRooms:['underground_mechanic','underground_goblin','underground_princess','underground_fishing'],
    passages:[{id:'fishing-hatch-access',x1:36,x2:37,y1:23,y2:28}],
    platformRuns:[{id:'fishing-hatch-access',x:36,levels:[21,28],step:7}],
  },
  jungle: {
    closedRooms:['jungle_dryad','jungle_hub','jungle_painter','jungle_witch','jungle_shaft'],
    passages:[{id:'jungle-shaft',x1:55,x2:56,y1:35,y2:61}],
    platformRuns:[{id:'jungle-shaft',x:55,levels:[34,41,48,55,62],step:7}],
  },
};

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

function buildingContains(region, x, y) {
  return x >= region.x1 && x <= region.x2 && y >= region.y1 && y <= region.y2;
}
function buildingObjectContains(object, x, y) {
  return x >= object.x && x < object.x + object.w && y >= object.y && y < object.y + object.h;
}
function buildingTileKey(x, y) { return `${x},${y}`; }

function buildingGrid(scene, blockSpecs) {
  const bounds = scene.bounds;
  if (!bounds || !['xMin','xMax','yMin','yMax'].every(key => Number.isSafeInteger(bounds[key])) ||
      bounds.xMin > bounds.xMax || bounds.yMin > bounds.yMax ||
      (bounds.xMax - bounds.xMin + 1) * (bounds.yMax - bounds.yMin + 1) > 1000000)
    throw new Error('Invalid or oversized scene bounds');
  for (const object of scene.objects) {
    if (!object || !['x','y','w','h'].every(key=>Number.isSafeInteger(object[key])) ||
        object.w < 1 || object.h < 1 || object.x < bounds.xMin || object.y < bounds.yMin ||
        object.x+object.w-1 > bounds.xMax || object.y+object.h-1 > bounds.yMax)
      throw new Error(`Invalid object rectangle ${object?.id} X${object?.x} Y${object?.y}`);
  }
  const index = regions => {
    const tiles = new Map();
    for (const region of regions) {
      if (!region || !['x1','x2','y1','y2'].every(key=>Number.isSafeInteger(region[key])) ||
          region.x1 > region.x2 || region.y1 > region.y2 || region.x1 < bounds.xMin || region.x2 > bounds.xMax ||
          region.y1 < bounds.yMin || region.y2 > bounds.yMax)
        throw new Error(`Invalid rectangle ${region?.mat} X${region?.x1} Y${region?.y1}`);
      for (let y=region.y1;y<=region.y2;y++) for (let x=region.x1;x<=region.x2;x++)
        tiles.set(buildingTileKey(x,y), region); // later rectangles deliberately win
    }
    return tiles;
  };
  for (const region of scene.solids) {
    if (!region || !Object.hasOwn(blockSpecs,region.mat))
      throw new Error(`Unknown material ${region?.mat} X${region?.x1} Y${region?.y1}`);
  }
  const solids = index(scene.solids), backgrounds = index(scene.backgrounds);
  const foreground = (x,y) => solids.get(buildingTileKey(x,y));
  const wall = (x,y) => backgrounds.get(buildingTileKey(x,y));
  const platform = (x,y) => blockSpecs[foreground(x,y)?.mat]?.layer === 'Платформа';
  const solid = (x,y) => {
    const tile = foreground(x,y);
    if (!tile) return false;
    const spec = blockSpecs[tile.mat];
    if (!spec) throw new Error(`Unknown material ${tile.mat} X${x} Y${y}`);
    return !['Платформа','Проходимый блок-мебель'].includes(spec.layer);
  };
  const support = (x,y) => solid(x,y) || platform(x,y) || scene.objects.some(object =>
    object.kind === 'planter' && buildingObjectContains(object,x,y));
  return {solids,backgrounds,foreground,wall,platform,solid,support};
}

function buildingDoorClearance(scene, grid, door) {
  const clear = x => {
    for (let y=door.y;y<door.y+door.h;y++) {
      if (grid.foreground(x,y) || scene.objects.some(object => object !== door &&
          buildingObjectTraits(object).blocksDoor && buildingObjectContains(object,x,y))) return false;
    }
    return true;
  };
  return {left:clear(door.x-1),right:clear(door.x+door.w)};
}

function auditBuilding(scene, blockSpecs, config = BUILDING_SCENES[scene.sceneId]) {
  const errors = [], warnings = [], checkedWalls = new Set();
  const add = (rule,x,y,id,message) => errors.push({scene:scene.sceneId,rule,x,y,id,message});
  let grid;
  try { grid = buildingGrid(scene,blockSpecs); }
  catch (error) { add('geometry',null,null,null,error.message); return {errors,warnings,metrics:{}}; }
  if (!config) {
    add('configuration',null,null,scene.sceneId,'No explicit construction configuration');
    return {errors,warnings,metrics:{}};
  }
  const checkWall = (x,y,id,rule) => {
    checkedWalls.add(buildingTileKey(x,y));
    if (!grid.wall(x,y)) add(rule,x,y,id,'Missing background wall');
  };
  for (const id of config.closedRooms) {
    const room = scene.rooms.find(room=>room.id === id);
    if (!room || !['x1','x2','y1','y2'].every(key=>Number.isSafeInteger(room[key])) ||
        room.x1 >= room.x2 || room.y1 >= room.y2 || room.x1 < scene.bounds.xMin ||
        room.x2 > scene.bounds.xMax || room.y1 < scene.bounds.yMin || room.y2 > scene.bounds.yMax) {
      add('closed-room',null,null,id,'Required room is absent or has invalid bounds'); continue;
    }
    // Room rectangles include the outline; doors and platform boundaries are checked separately.
    for (let y=room.y1+1;y<room.y2;y++) for (let x=room.x1+1;x<room.x2;x++)
      if (!grid.solid(x,y)) checkWall(x,y,id,'closed-wall');
  }
  // Open external platforms are allowed only where their surrounding wall is
  // absent too. A one-row hole through an existing wall is not an open canopy.
  for (const [key,region] of grid.solids) {
    const [x,y] = key.split(',').map(Number);
    if (grid.platform(x,y) && (grid.wall(x,y-1) || grid.wall(x,y+1)))
      checkWall(x,y,region.id || region.name || 'platform','platform-wall');
  }
  let openableDoors=0, attachedObjects=0, physicalObjects=0;
  for (const object of scene.objects) {
    const traits = buildingObjectTraits(object);
    if (!['none','floor','ceiling','wall','torch','self','embedded','door','hatch'].includes(traits.attachment) ||
        typeof traits.collision !== 'boolean' || typeof traits.blocksDoor !== 'boolean') {
      add('object-contract',object.x,object.y,object.id,'Invalid construction traits'); continue;
    }
    if (traits.attachment === 'none') continue;
    physicalObjects++;
    const before = errors.length;
    if (traits.collision) {
      for (let y=object.y;y<object.y+object.h;y++) for (let x=object.x;x<object.x+object.w;x++)
        if (grid.solid(x,y)) add('object-overlap',x,y,object.id,`Physical object overlaps ${grid.foreground(x,y).mat}`);
    }
    if (traits.attachment === 'wall') {
      for (let y=object.y;y<object.y+object.h;y++) for (let x=object.x;x<object.x+object.w;x++)
        checkWall(x,y,object.id,'wall-attachment');
    }
    if (traits.attachment === 'floor') {
      const y=object.y+object.h;
      for (let x=object.x;x<object.x+object.w;x++) {
        const furniture = scene.objects.some(other => other !== object &&
          ['furniture','station'].includes(other.kind) && other.y === y && x >= other.x && x < other.x+other.w);
        if (!grid.support(x,y) && !furniture) add('floor-attachment',x,y,object.id,'No block, platform or furniture top below');
      }
    }
    if (traits.attachment === 'ceiling') {
      const x=object.x+Math.floor(object.w/2),y=object.y-1;
      if (!grid.support(x,y)) add('ceiling-attachment',x,y,object.id,'No block or platform above attachment point');
    }
    if (traits.attachment === 'torch') {
      const x=object.x,y=object.y;
      if (!grid.wall(x,y) && !grid.support(x-1,y) && !grid.support(x+object.w,y) && !grid.support(x,y+object.h))
        add('torch-attachment',x,y,object.id,'No wall or adjacent block/platform attachment');
    }
    if (traits.attachment === 'door') {
      for (let y=object.y;y<object.y+object.h;y++) checkWall(object.x,y,object.id,'door-wall');
      const clearance=buildingDoorClearance(scene,grid,object);
      if (clearance.left || clearance.right) openableDoors++;
      else add('door-clearance',object.x,object.y,object.id,'Both door swing columns are blocked');
    }
    if (traits.attachment === 'hatch') {
      if (object.w !== 2 || object.h !== 1) add('hatch-shape',object.x,object.y,object.id,'Closed Trap Door must occupy 2x1 tiles');
      for (let x=object.x;x<object.x+object.w;x++)
        if (!grid.platform(x,object.y-1)) add('hatch-platform',x,object.y-1,object.id,'Hatch must be one tile below its platform');
      for (const x of [object.x-1,object.x+object.w])
        if (!grid.solid(x,object.y)) add('hatch-support',x,object.y,object.id,'Hatch side anchor must be a solid block');
      if (config.closedRooms.some(id => {
        const room=scene.rooms.find(room=>room.id===id);
        return room && (buildingContains(room,object.x,object.y) || buildingContains(room,object.x,object.y-1));
      })) for (let x=object.x;x<object.x+object.w;x++) {
        checkWall(x,object.y-1,object.id,'hatch-wall'); checkWall(x,object.y,object.id,'hatch-wall');
      }
    }
    if (before === errors.length) attachedObjects++;
  }
  for (const passage of config.passages || [])
    for (let y=passage.y1;y<=passage.y2;y++) for (let x=passage.x1;x<=passage.x2;x++) {
      const blocker=scene.objects.find(object=>buildingObjectTraits(object).blocksDoor && buildingObjectContains(object,x,y));
      if (grid.solid(x,y) || blocker) add('passage',x,y,passage.id,`Blocked passage${blocker ? ': '+blocker.id : ''}`);
    }
  for (const run of config.platformRuns || []) {
    if (run.step !== 7 && !run.reason) add('platform-level',run.x,run.levels[0],run.id,'Nonstandard step requires an explicit reason');
    for (let y=run.levels[0];y<=run.levels.at(-1);y++)
      if (grid.platform(run.x,y) && !run.levels.includes(y))
        add('platform-level',run.x,y,run.id,'Unexpected intermediate platform level');
    for (let i=0;i<run.levels.length;i++) {
      const y=run.levels[i];
      if (!grid.platform(run.x,y)) add('platform-level',run.x,y,run.id,'Required platform level is absent');
      if (i && y-run.levels[i-1] !== run.step) add('platform-level',run.x,y,run.id,'Nonuniform planned platform step');
    }
  }
  return {errors,warnings,metrics:{foregroundTiles:grid.solids.size,backgroundTiles:grid.backgrounds.size,
    checkedWallTiles:checkedWalls.size,objects:scene.objects.length,physicalObjects,attachedObjects,
    doors:scene.objects.filter(object=>object.kind==='door').length,openableDoors}};
}
