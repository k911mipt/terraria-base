#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {deploymentChanged}=require('../js/runtime/deployment.js');
const A='a'.repeat(64), B='b'.repeat(64);
async function scenario({current=A,version=A,url='https://site.example/base/index.html',fetchError=false,status=200,malformed=false,timeout=false}={}) {
  const replacements=[],pending=new Set();
  const win={AbortController,
    location:{href:url,replace:value=>replacements.push(value)},
    setTimeout(callback,delay){const id=setTimeout(callback,delay);pending.add(id);return id;},
    clearTimeout(id){clearTimeout(id);pending.delete(id);},
    fetch:async(_,options)=>{
      assert.equal(options.cache,'no-store');assert.equal(options.credentials,'same-origin');
      if(timeout)return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('timeout'))));
      if(fetchError)throw new Error('offline');
      return {ok:status===200,json:async()=>{if(malformed)throw new Error('JSON');return {version};}};
    }
  };
  Object.defineProperty(win,'localStorage',{get(){throw new Error('Storage denied');}});
  const document={baseURI:url,defaultView:win,querySelector:()=>current?{content:current}:null};
  const changed=await deploymentChanged(document,{timeout:5});
  assert.equal(pending.size,0,'probe leaked timer');
  return {changed,replacements};
}
(async()=>{
  for(const input of [{},{current:null},{fetchError:true},{status:503},{malformed:true},{timeout:true},{version:'javascript:alert(1)'},{version:12},{version:B,url:`https://site.example/base/index.html?_v=${B}`}]){
    const result=await scenario(input);assert.equal(result.changed,false);assert.deepEqual(result.replacements,[]);
  }
  const result=await scenario({version:B,url:'https://site.example/base/index.html?mode=visual&_cache_check=old#section'});
  assert.equal(result.changed,true);assert.equal(result.replacements.length,1);
  const target=new URL(result.replacements[0]);
  assert.equal(target.origin,'https://site.example');assert.equal(target.pathname,'/base/index.html');
  assert.equal(target.searchParams.get('_v'),B);assert.equal(target.searchParams.get('mode'),'visual');
  assert.equal(target.searchParams.has('_cache_check'),false);assert.equal(target.hash,'#section');
  console.log('PASS 10 deployment probe cases: same/new release, one redirect, timeout, offline, bad response, forbidden storage');
})().catch(error=>{console.error(error);process.exitCode=1;});
