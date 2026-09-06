#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {loadScene,SCENES}=require('./lib/load-scene.cjs');
const {geometryDigest}=require('./lib/geometry-snapshot.cjs');
const golden=require('./fixtures/geometry.json');
for(const entry of SCENES){
  const {run}=loadScene(entry), data=run('({D,MAT,WALL,STYLE})');
  assert.equal(geometryDigest(data),golden.scenes[entry],`${entry}: geometry/material/renderer input changed. Review the design before intentionally updating tools/fixtures/geometry.json.`);
  const object=data.D.objects[0];object.x++;
  assert.notEqual(geometryDigest(data),golden.scenes[entry],'snapshot must detect coordinate edits');object.x--;
  const status=data.D.validation.status;data.D.validation.status='FORGED';
  assert.equal(geometryDigest(data),golden.scenes[entry],'stored status must not influence independent geometry');data.D.validation.status=status;
  console.log(`PASS ${entry}: independent geometry golden`);
}
