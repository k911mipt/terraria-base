#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {loadScene,SCENES}=require('./lib/load-scene.cjs');
const placements={
 'index.html': {PYLON:{y:37},P1_VOID:{x:41},P2_VOID:{x:92},P2_FORGE:{x:95},P1_FLAG:{y:30},P2_FLAG:{y:30},
   P1_LIGHT_UP:{y:28,h:2},P2_LIGHT_UP:{y:28,h:2},P1_LIGHT_LOW:{y:35,h:2},P2_LIGHT_LOW:{y:35,h:2}},
 'underground.html': {UG_SHAFT_LIGHT:{x:38,y:23,h:2}},
 'jungle.html': {JG_WITCH_TORCH:{x:48,y:31,h:3}},
};
for(const entry of SCENES){
 const {run,runFile}=loadScene(entry);runFile('js/runtime/building-audit.js');
 const D=run('D'), errors=run('auditBuilding(D,BLOCK_SPECS).errors');
 assert.equal(errors.length,0,JSON.stringify(errors));
 for(const [id,fields] of Object.entries(placements[entry]||{})){
  const object=D.objects.find(o=>o.id===id);assert(object,id);
  for(const [key,value] of Object.entries(fields))assert.equal(object[key],value,`${id}: ${key}`);
 }
 if(entry==='desert.html'){
  const lanterns=D.objects.filter(o=>o.style==='lantern_warm');assert.equal(lanterns.length,13);
  for(const object of lanterns)assert.equal(object.h,2,object.id);
  for(let n=1;n<=6;n++)assert.equal(D.objects.find(o=>o.id===`DESERT_ACCESS_LIGHT_${n}`).y,21+n*7);
 }
 console.log(`PASS ${entry}: corrected support, doors and wall continuity`);
}
