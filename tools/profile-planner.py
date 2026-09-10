#!/usr/bin/env python3
"""Optional, real-HTTP planner profile (#37). Measurements, never timing gates."""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import importlib.util
import json
import math
import os
from pathlib import Path
import platform
import statistics
import subprocess
import time

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('smoke', ROOT / 'tools/check-browser.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)
SCENES = ('index.html', 'desert.html')
FOCUS_ROOMS = {'index.html': 'craft', 'desert.html': 'desert_hub'}

# Observe native startup and time rAF callback execution, not GPU presentation.
# Settle uses the unwrapped rAF and is excluded from the measured callbacks.
PROBE = """(() => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__profile = {api: null, readyMs: null, frames: [], recording: false,
    settle: () => new Promise(resolve => raf(() => raf(resolve)))};
  window.requestAnimationFrame = callback => raf(time => {
    const start = performance.now();
    try { return callback(time); }
    finally { if (__profile.recording) __profile.frames.push(performance.now() - start); }
  });
  document.addEventListener('planner-started', event => { __profile.api = event.detail; });
  new MutationObserver(() => {
    if (__profile.readyMs === null && document.querySelector('#viewport[data-ready="true"]'))
      __profile.readyMs = performance.now();
  }).observe(document, {subtree:true, attributes:true, attributeFilter:['data-ready']});
})();"""

# Alternate actual object centers and deterministic empty/background positions.
# A result checksum prevents treating a skipped query loop as successful work.
LOOKUPS = """async ({iterations, batches}) => {
  const {objectAt} = await import(new URL('js/runtime/model.js', document.baseURI).href);
  const {roomAt} = await import(new URL('js/runtime/core.js', document.baseURI).href);
  const s = __profile.api.state, b = s.D.bounds, objects = s.D.objects;
  const points = Array.from({length:256}, (_, i) => {
    const o = objects[i % objects.length];
    return i % 2 ? [o.x + .5, o.y + .5] :
      [b.xMin + ((i * 37) % s.WX), b.yMin + ((i * 17) % s.WY)];
  });
  const results = {objectAt: [], roomAt: [], checksum: 0, iterations};
  for (const name of ['objectAt', 'roomAt']) {
    const query = name === 'objectAt' ? (x,y) => objectAt(s,x,y) : (x,y) => roomAt(s.D,x,y);
    for (let batch=-1; batch<batches; batch++) {
      let checksum = 0;
      const start = performance.now();
      for (let i=0; i<iterations; i++) {
        const p = points[i % points.length], hit = query(p[0],p[1]);
        checksum += hit ? hit.id.length : 1;
      }
      if (batch >= 0) results[name].push((performance.now()-start)*1000/iterations);
      results.checksum += checksum;
    }
  }
  return results;
}"""


def stats(values):
    """Median and nearest-rank p95. Empty sets remain missing, never zero."""
    if not values:
        return {'n': 0, 'median': None, 'p95': None, 'max': None}
    if any(not math.isfinite(x) or x < 0 for x in values):
        raise ValueError('Expected finite, non-negative measurements')
    ordered = sorted(values)
    return {'n': len(values), 'median': statistics.median(ordered),
            'p95': ordered[math.ceil(.95 * len(ordered)) - 1], 'max': ordered[-1]}


def application_digest():
    files = sorted(set(ROOT.glob('*.html')) | set(ROOT.glob('*.css')) |
                   set((ROOT / 'js').rglob('*.js')) | {ROOT / 'deployment.json'})
    digest = hashlib.sha256()
    for path in files:
        digest.update(path.relative_to(ROOT).as_posix().encode() + b'\0' + path.read_bytes() + b'\0')
    return digest.hexdigest()


def metric_snapshot(session):
    return {item['name']: item['value'] for item in session.send('Performance.getMetrics')['metrics']}


def process_rss(browser_session):
    """Linux per-process RSS snapshot, NOT unique memory or Canvas/GPU allocation."""
    try:
        processes = []
        for item in browser_session.send('SystemInfo.getProcessInfo')['processInfo']:
            status = Path(f'/proc/{item["id"]}/status').read_text()
            rss = next(int(line.split()[1]) * 1024 for line in status.splitlines() if line.startswith('VmRSS:'))
            processes.append({'id': item['id'], 'type': item['type'], 'rssBytes': rss})
        return {'available': True, 'processes': processes,
                'summedRssBytes': sum(item['rssBytes'] for item in processes)}
    except Exception as error:
        # CDP/platform capability can be unavailable. Do not invent a zero.
        return {'available': False, 'error': f'{type(error).__name__}: {error}'}


def settle(page):
    page.evaluate('() => __profile.settle()')


def measure_phase(page, session, action):
    before = metric_snapshot(session)
    page.evaluate('__profile.frames=[]; __profile.recording=true')
    started = time.perf_counter()
    try:
        action()
        settle(page)
    finally:
        page.evaluate('__profile.recording=false')
    after = metric_snapshot(session)
    frames = page.evaluate('__profile.frames')
    return {'wallMsIncludingDriverAndFrameWait': (time.perf_counter()-started)*1000,
            'rafCallbackElapsedMs': frames,
            'rendererTaskMs': (after['TaskDuration']-before['TaskDuration'])*1000,
            'scriptMs': (after['ScriptDuration']-before['ScriptDuration'])*1000}


def native_inputs(page, session, mobile):
    box = page.locator('#viewport').bounding_box()
    x = box['x'] + box['width'] / 2
    y = max(box['y'] + 30, min(page.viewport_size['height'] - 80, box['y'] + 160))
    before = page.evaluate('({...__profile.api.state.cam})')
    if mobile:
        session.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{'x':x,'y':y,'id':1}]})
        for offset in range(4, 53, 4):
            session.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{'x':x+offset,'y':y+12,'id':1}]})
        session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    else:
        page.mouse.move(x,y)
        page.mouse.down()
        page.mouse.move(x+60,y+20,steps=16)
        page.mouse.up()
    settle(page)
    assert abs(page.evaluate('__profile.api.state.cam.x') - before['x']) > 1, 'pan did not reach the planner'
    scale = page.evaluate('__profile.api.state.cam.scale')
    if mobile:
        points = lambda d: [{'x':x-d,'y':y,'id':1},{'x':x+d,'y':y,'id':2}]
        session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':points(24)})
        for distance in (28,34,42,50):
            session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':points(distance)})
        session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    else:
        page.mouse.wheel(0,-120)
    settle(page)
    assert page.evaluate('__profile.api.state.cam.scale') > scale, 'zoom did not reach the planner'
    assert page.evaluate('__profile.api.state.viewportPointers.size===0'), 'pointer state leaked'


def focus_room(page, room_id):
    page.evaluate("""id => {
      const api=__profile.api, room=api.state.D.rooms.find(r=>r.id===id);
      if (!room) throw new Error(`Missing profile room ${id}`);
      api.focus(room.x1,room.y1,room.x2,room.y2,12,false);
    }""", room_id)
    settle(page)


def visible_targets(page):
    # Compute setup outside the measured phase. Native mousemove must subsequently
    # reach these real items and populate the tooltip; sky-only hovering is invalid.
    targets = page.evaluate("""async () => {
      const {objectAt}=await import(new URL('js/runtime/model.js',document.baseURI).href);
      const s=__profile.api.state, r=s.viewport.getBoundingClientRect(), seen=new Set();
      return s.D.objects.filter(o=>o.kind!=='zone').flatMap(o=> {
        const wx=o.x+.5, wy=o.y+.5;
        const x=r.left+(wx-s.cam.x)*s.cam.scale, y=r.top+(wy-s.cam.y)*s.cam.scale;
        if (x<r.left+10 || x>Math.min(r.right,innerWidth)-10 ||
            y<r.top+10 || y>Math.min(r.bottom,innerHeight)-10) return [];
        const hit=objectAt(s,wx,wy);
        if (!hit || hit.kind==='zone' || seen.has(hit.id)) return [];
        seen.add(hit.id);
        return [{x,y,id:hit.id,name:hit.name}];
      });
    }""")
    if len(targets) < 3:
        raise AssertionError('Profile requires at least three visible object targets')
    return targets


def camera_snapshot(page):
    return page.evaluate("""() => {
      const s=__profile.api.state, r=s.viewport.getBoundingClientRect();
      return {cam:{...s.cam},mode:s.document.getElementById('mode').value,
        viewport:{x:r.x,y:r.y,width:r.width,height:r.height}};
    }""")


def one_profile(browser, browser_session, origin, entry, device, repeat, output):
    name = f'{Path(entry).stem}-{device}-{repeat}'
    result = {'scene':entry, 'device':device, 'repeat':repeat, 'status':'FAIL'}
    context = browser.new_context(viewport=smoke.VIEWPORTS[device], device_scale_factor=1,
                                  is_mobile=device=='mobile', has_touch=device=='mobile')
    page = context.new_page()
    page.set_default_timeout(15000)
    failures = []
    page.on('pageerror', lambda e: failures.append(str(e)))
    page.on('requestfailed', lambda r: failures.append(f'{r.url}: {r.failure}'))
    page.on('response', lambda r: failures.append(f'{r.url}: HTTP {r.status}') if r.status>=400 else None)
    page.add_init_script(PROBE)
    session = context.new_cdp_session(page)
    session.send('Performance.enable')
    try:
        response = page.goto(origin+'/'+entry, wait_until='load')
        assert response.status == 200
        page.wait_for_selector('#viewport[data-ready="true"]')
        page.wait_for_function('__profile.api && __profile.readyMs !== null')
        result['startupReadyMs'] = page.evaluate('__profile.readyMs')
        result['heapAfterReady'] = session.send('Runtime.getHeapUsage')
        result['processRssAfterReady'] = process_rss(browser_session)
        result['scene'] = entry
        result['canvas'] = page.evaluate("""() => {
          const s=__profile.api.state;
          const measure=map=>Object.entries(map).map(([name,c])=>({name,width:c.width,height:c.height,rgbaBytes:c.width*c.height*4}));
          return {world:{width:s.WX,height:s.WY,objects:s.D.objects.length,rooms:s.D.rooms.length},
            cache:measure(s.caches),screen:measure({base:s.baseCanvas,objects:s.objectCanvas,overlay:s.overlayCanvas})};
        }""")
        mobile = device=='mobile'
        page.select_option('#mode','visual')
        if mobile:
            page.locator('.toolbar-toggle').tap()
            page.evaluate('window.scrollTo(0,0)')
        focus_room(page, FOCUS_ROOMS[entry])
        targets = visible_targets(page)
        result['inputView'] = camera_snapshot(page)
        result['inputView']['roomId'] = FOCUS_ROOMS[entry]
        result['visibleTargetIds'] = [target['id'] for target in targets]
        phases = {}
        if not mobile:
            def hover():
                for i in range(80):
                    target=targets[i % len(targets)]
                    page.mouse.move(target['x'],target['y'])
            phases['hover'] = measure_phase(page,session,hover)
            tip = page.locator('#tip')
            assert tip.is_visible(), 'native hover did not show a tooltip'
            assert targets[79 % len(targets)]['name'] in tip.inner_text(), 'native hover selected the wrong item'
        phases['panZoom'] = measure_phase(page,session,lambda:native_inputs(page,session,mobile))
        result['afterPanZoomView'] = camera_snapshot(page)
        if mobile:
            page.locator('.toolbar-toggle').tap()
            assert page.locator('.toolbar-toggle').get_attribute('aria-expanded') == 'true'
            settle(page)
        if entry=='index.html':
            page.evaluate("""() => {
              const api=__profile.api, f=api.state.ENG.focus;
              api.focus(f.x1,f.y1,f.x2,f.y2,4,false);
            }""")
            settle(page)
            result['engineeringView'] = camera_snapshot(page)
            def modes():
                for mode in ('arena','wiring','visual')*3:
                    page.select_option('#mode', mode)
                    settle(page)
            phases['engineeringModes'] = measure_phase(page,session,modes)
        result['phases'] = phases
        # Dedicated isolated batch cost; not whole pointer-handler/event latency.
        page.select_option('#mode','visual')
        if mobile:
            page.locator('.toolbar-toggle').tap()
            page.evaluate('window.scrollTo(0,0)')
            assert page.locator('.toolbar-toggle').get_attribute('aria-expanded') == 'false'
        settle(page)
        result['lookupMicrosecondsPerCall'] = page.evaluate(LOOKUPS, {'iterations':10000,'batches':10})
        assert result['lookupMicrosecondsPerCall']['checksum'] > 0
        result['heapAfterInputsBeforeGc'] = session.send('Runtime.getHeapUsage')
        # Allocation sampling is SEPARATE from timings and includes collected objects.
        session.send('HeapProfiler.startSampling', {'samplingInterval':4096,
            'includeObjectsCollectedByMajorGC':True, 'includeObjectsCollectedByMinorGC':True})
        try:
            page.evaluate(LOOKUPS, {'iterations':10000,'batches':1})
        finally:
            allocation = session.send('HeapProfiler.stopSampling')['profile']
        (output/(name+'.heapprofile')).write_text(json.dumps(allocation))
        result['allocationProfile'] = name+'.heapprofile'
        result['allocationSampleEstimatedBytes'] = sum(sample['size'] for sample in allocation['samples'])
        session.send('HeapProfiler.collectGarbage')
        result['heapAfterGc'] = session.send('Runtime.getHeapUsage')
        result['processRssAfterGc'] = process_rss(browser_session)
        page.evaluate('__profile.api.fit()')
        settle(page)
        page.screenshot(path=str(output/(name+'.png')))
        assert not failures, failures
        result['status'] = 'PASS'
    except Exception as error:
        result['error'] = f'{type(error).__name__}: {error}'
        raise
    finally:
        result['failures'] = failures
        (output/(name+'.json')).write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
        context.close()
    print('PASS profile '+name, flush=True)
    return result


def summarize(results):
    groups = {}
    for scene in SCENES:
        for device in smoke.VIEWPORTS:
            rows = [r for r in results if r['scene']==scene and r['device']==device and r['status']=='PASS']
            groups[f'{scene}/{device}'] = {
                'startupReadyMs':stats([r['startupReadyMs'] for r in rows]),
                'lookupUs':{key:stats([v for r in rows for v in r['lookupMicrosecondsPerCall'][key]])
                            for key in ('objectAt','roomAt')},
                'rafCallbackElapsedMs':{phase:stats([v for r in rows for v in r['phases'].get(phase,{}).get('rafCallbackElapsedMs',[])])
                                   for phase in ('hover','panZoom','engineeringModes')},
            }
    return groups


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repeats', type=int, default=5)
    parser.add_argument('--output', type=Path, default=ROOT/'performance-artifacts')
    args = parser.parse_args()
    if not 1 <= args.repeats <= 20:
        parser.error('--repeats must be between 1 and 20')
    args.output.mkdir(parents=True,exist_ok=True)
    commit = subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,capture_output=True,text=True,check=True).stdout.strip()
    cpu = next((line.split(':',1)[1].strip() for line in Path('/proc/cpuinfo').read_text().splitlines()
                if line.startswith('model name')),None) if Path('/proc/cpuinfo').exists() else platform.processor()
    report = {'schemaVersion':2,'status':'FAIL','commit':commit,'applicationSha256':application_digest(),
              'environment':{'os':platform.platform(),'cpu':cpu,'python':platform.python_version(),
                  'playwright':importlib.metadata.version('playwright'),'viewports':smoke.VIEWPORTS,
                  'dpr':1,'headless':True,'physicalPhone':False,'throttling':False},
              'expectedProfiles':args.repeats*len(SCENES)*len(smoke.VIEWPORTS),'profiles':[]}
    try:
        with smoke.serve() as origin, sync_playwright() as pw:
            options = {'headless':True}
            if executable := os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'):
                options['executable_path'] = executable
            browser = pw.chromium.launch(**options)
            try:
                report['environment']['chromium'] = browser.version
                browser_session = browser.new_browser_cdp_session()
                for repeat in range(1,args.repeats+1):
                    for entry in SCENES:
                        for device in smoke.VIEWPORTS:
                            report['profiles'].append(one_profile(browser,browser_session,origin,entry,device,repeat,args.output))
            finally:
                browser.close()
        assert len(report['profiles']) == report['expectedProfiles']
        report['status'] = 'PASS'
    except Exception as error:
        report['error'] = f'{type(error).__name__}: {error}'
        raise
    finally:
        report['summary'] = summarize(report['profiles'])
        (args.output/'summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')


if __name__ == '__main__':
    main()
