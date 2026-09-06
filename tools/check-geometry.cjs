#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const {loadScene,SCENES}=require("./lib/load-scene.cjs");
const {geometryDigest}=require("./lib/geometry-snapshot.cjs");
const golden=require("./fixtures/geometry.json");
for(const entry of SCENES){
  const {run}=loadScene(entry), data=run("({D,MAT,WALL,STYLE,ENG})");
  const expected=golden.scenes[entry];
  assert.equal(geometryDigest(data),expected,`${entry}: geometry/render inputs changed. Review the design before updating tools/fixtures/geometry.json.`);
  function changed(object,key,value){
    const owned=Object.hasOwn(object,key), previous=object[key];object[key]=value;
    try {assert.notEqual(geometryDigest(data),expected,`${entry}: digest missed ${key}`);}
    finally {if(owned)object[key]=previous;else delete object[key];}
  }
  const object=data.D.objects[0];
  changed(object,"x",object.x+1);
  // Adding, toggling and deleting an explicit flag must all change the digest.
  changed(object,"hideLabel",!object.hideLabel);
  for(const item of data.D.objects.filter(item=>Object.hasOwn(item,"hideLabel"))){
    const previous=Object.getOwnPropertyDescriptors(item);delete item.hideLabel;
    try {assert.notEqual(geometryDigest(data),expected,"digest missed removal of hideLabel");}
    finally {for(const key of Object.keys(item))delete item[key];Object.defineProperties(item,previous);}
  }
  changed(object,"inactive",!object.inactive);
  changed(object,"controlRole","SENTINEL_CONTROL_ROLE");
  changed(data.D.rooms[0],"name","SENTINEL_ROOM_LABEL");
  if(data.ENG.devices.length)changed(data.ENG.devices[0],"hideLabel",!data.ENG.devices[0].hideLabel);
  const history=data.D.designHistory || data.D.validation;
  const previous=history.status;history.status="FORGED";
  assert.equal(geometryDigest(data),expected,"stored status must not influence independent geometry");history.status=previous;
  console.log(`PASS ${entry}: independent geometry, labels and engineering golden`);
}
