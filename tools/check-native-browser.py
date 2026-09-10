#!/usr/bin/env python3
"""Native HTTP startup/isolation tests, without globals or compatibility aliases."""
from __future__ import annotations
import importlib.util
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('smoke', ROOT / 'tools/check-browser.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def check(browser, origin, entry, device, artifacts):
    context = browser.new_context(viewport=smoke.VIEWPORTS[device], device_scale_factor=1,
                                  is_mobile=device == 'mobile', has_touch=device == 'mobile')
    page = context.new_page()
    page.add_init_script("document.addEventListener('planner-started', event => {window.__nativeAPI=event.detail;});")
    log, failures = [], []
    # Resource/error observation only. Unlike smoke mutation tests, no routes and
    # no application source injection: the native imports must work as published.
    page.on('pageerror', lambda error: failures.append(str(error)))
    page.on('requestfailed', lambda request: failures.append(f'{request.url}: {request.failure}'))
    page.on('response', lambda response: log.append({'url': response.url, 'status': response.status,
                                                    'type': response.request.resource_type}))
    name = Path(entry).stem + '-' + device
    result = {'scene': entry, 'device': device, 'status': 'FAIL'}
    try:
        response = page.goto(origin + '/' + entry, wait_until='load')
        assert response and response.status == 200
        smoke.healthy(page, failures)
        page.wait_for_function('!!window.__nativeAPI')
        assert page.evaluate("['D','ENG','cam','caches','OBJECT_RENDERERS','TILE_RENDERERS'].every(key=>!Object.hasOwn(window,key))")
        version = page.locator('meta[name="planner-release"]').get_attribute('content')
        resources = [row for row in log if row['type'] in ('script', 'stylesheet')]
        assert resources and all(row['status'] == 200 and ('?v=' + version) in row['url'] for row in resources)
        assert all('/tools/' not in row['url'] for row in log), 'application loaded a test helper'
        object_id = smoke.CONTROL_DOORS[smoke.SCENES.index(entry)]
        page.evaluate("id=>{const a=window.__nativeAPI,o=a.state.D.objects.find(o=>o.id===id);a.focus(o.x-3,o.y-3,o.x+3,o.y+5,2,false);}", object_id)
        smoke.settle(page)
        point = page.evaluate("""id=>{
          const s=window.__nativeAPI.state,o=s.D.objects.find(o=>o.id===id),r=s.viewport.getBoundingClientRect();
          return {x:r.left+(o.x+.5-s.cam.x)*s.cam.scale,y:r.top+(o.y+1.5-s.cam.y)*s.cam.scale};
        }""", object_id)
        if device == 'mobile':
            page.locator('.toolbar-toggle').tap()
            page.evaluate('window.scrollTo(0,0)')
            smoke.settle(page)
            point = page.evaluate("""id=>{const s=window.__nativeAPI.state,o=s.D.objects.find(o=>o.id===id),r=s.viewport.getBoundingClientRect();
              return {x:r.left+(o.x+.5-s.cam.x)*s.cam.scale,y:r.top+(o.y+1.5-s.cam.y)*s.cam.scale};}""", object_id)
            page.touchscreen.tap(**point)
        else:
            page.mouse.click(**point)
        assert page.evaluate('window.__nativeAPI.state.selected?.id') == object_id
        # Reuse the same imported module graph with a second document/state.
        second = page.evaluate("""async () => {
          const frame=document.createElement('iframe');frame.width=800;frame.height=600;
          const markup=document.documentElement.outerHTML.replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/g,'');
          frame.srcdoc=markup; document.body.append(frame);
          await new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));
          const module=await import(new URL(document.querySelector('[data-planner-entry]').dataset.plannerEntry,document.baseURI).href);
          const first=window.__nativeAPI, second=module.start(frame.contentDocument);
          window.__secondAPI=second;
          const isolated=['D','ENG','cam','caches','history','TILE_RENDERERS','OBJECT_RENDERERS','viewportPointers'].every(k=>first.state[k]!==second.state[k]);
          first.state.history.push({x:987}); const before=JSON.stringify(second.state.cam);
          first.destroy(); first.destroy();
          return {isolated,before,stopped:first.state.destroyed,readyRemoved:!first.state.viewport.hasAttribute('data-ready'),
            timers:first.state.timers.size,listeners:first.state.cleanups.length,pointers:first.state.viewportPointers.size,
            caches:Object.values(first.state.caches).every(c=>c.width===0&&c.height===0),secondHistory:second.state.history.length};
        }""")
        assert second['isolated'] and second['stopped'] and second['readyRemoved'] and second['caches']
        assert second['timers'] == second['listeners'] == second['pointers'] == second['secondHistory'] == 0
        page.wait_for_function("window.__secondAPI.state.viewport.dataset.ready==='true'")
        assert page.evaluate('JSON.stringify(window.__secondAPI.state.cam)') == second['before']
        page.evaluate('window.__secondAPI.fit()')
        smoke.settle(page)
        assert page.evaluate("!window.__secondAPI.state.destroyed && window.__secondAPI.state.OBJECT_RENDERERS.size>0")
        assert not failures, failures
        result.update(status='PASS', resourceCount=len(resources), version=version, lifecycle=second)
    except Exception as error:
        result['error'] = f'{type(error).__name__}: {error}'
        raise
    finally:
        try:
            smoke.save_screenshot(page, artifacts / (name + '.png'), result)
        finally:
            (artifacts / (name + '.json')).write_text(json.dumps({**result, 'resources':log, 'failures':failures}, ensure_ascii=False, indent=2))
            context.close()
    print('PASS native HTTP ' + name, flush=True)
    return result


def check_ready_observer(browser):
    # Shared negative-gate observer must catch a transient set+remove in one turn.
    page = browser.new_page()
    try:
        page.set_content('<div id="viewport"></div>')
        page.evaluate(smoke.READY_OBSERVER)
        page.evaluate("const v=document.getElementById('viewport');v.dataset.ready='true';v.removeAttribute('data-ready');")
        smoke.settle(page)
        assert page.evaluate('window.__smokeReadyObserved')
    finally:
        page.close()


def main():
    artifacts = ROOT / 'browser-artifacts/native'
    artifacts.mkdir(parents=True, exist_ok=True)
    results = []
    with smoke.serve() as origin, sync_playwright() as playwright:
        options = {'headless':True}
        if executable := os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'):
            options['executable_path'] = executable
        browser = playwright.chromium.launch(**options)
        try:
            check_ready_observer(browser)
            for entry in smoke.SCENES:
                for device in smoke.VIEWPORTS:
                    results.append(check(browser, origin, entry, device, artifacts))
        finally:
            browser.close()
            (artifacts/'summary.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print('PASS 8 native HTTP/isolation scenarios without compatibility globals')

if __name__ == '__main__':
    main()
