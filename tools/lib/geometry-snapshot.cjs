'use strict';
const {createHash}=require('node:crypto');
// Only model/rendering input. A metadata-only item-contract migration must not
// alter the geometry snapshot, and a data-stored PASS is not an input at all.
function geometryDigest({D,MAT,WALL,STYLE}) {
  const pick=(object,keys)=>Object.fromEntries(keys.filter(key=>Object.hasOwn(object,key)).map(key=>[key,object[key]]));
  const rectangles=items=>items.map(item=>pick(item,['x1','y1','x2','y2','mat','shape']));
  const objects=D.objects.map(item=>pick(item,['id','name','short','x','y','w','h','kind','style',
    'chestFamily','chestPaintEn','paintColor','accent','icon','facing','direction','tier']));
  return createHash('sha256').update(JSON.stringify({bounds:D.bounds,solids:rectangles(D.solids),
    backgrounds:rectangles(D.backgrounds),objects,MAT,WALL,STYLE})).digest('hex');
}
module.exports={geometryDigest};
