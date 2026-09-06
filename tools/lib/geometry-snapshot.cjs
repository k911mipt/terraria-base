"use strict";
const {createHash}=require("node:crypto");
// Exclude only descriptive foreground specifications. Preserve all other object
// properties (including hideLabel and future renderer inputs), room labels and
// engineering overlays. Stored validation assertions are never visual evidence.
function geometryDigest({D,MAT,WALL,STYLE,ENG}) {
  const metadata=new Set(["foregroundLayer","foregroundItemRu","foregroundItemEn",
    "foregroundPaintRu","foregroundPaintEn","foregroundNote"]);
  const visualObject=object=>Object.fromEntries(Object.entries(object).filter(([key])=>!metadata.has(key)));
  const pick=(object,keys)=>Object.fromEntries(keys.filter(key=>Object.hasOwn(object,key)).map(key=>[key,object[key]]));
  const rectangles=items=>items.map(item=>pick(item,["x1","y1","x2","y2","mat","shape"]));
  return createHash("sha256").update(JSON.stringify({bounds:D.bounds,rooms:D.rooms,
    reserves:D.reserves,museumChapters:D.museumChapters,solids:rectangles(D.solids),
    backgrounds:rectangles(D.backgrounds),objects:D.objects.map(visualObject),
    engineering:pick(ENG,["stage","focus","circuits","junctionBoxes","devices","futureSlots"]),
    MAT,WALL,STYLE})).digest("hex");
}
module.exports={geometryDigest};
