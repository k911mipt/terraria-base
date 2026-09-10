#!/usr/bin/env python3
"""Real HTTP release A→B with retained native-module/CSS cache; no request routing."""
from __future__ import annotations
from contextlib import contextmanager
from collections import Counter
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
import os
from pathlib import Path
import re
import tempfile
import threading
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('release_tests',ROOT/'tools/check-version-assets.py')
fixtures=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixtures)
SCENES=fixtures.version.SCENES


def make_release(path: Path, marker: str, unversioned: bool):
    fixtures.copy_sources(path)
    for file in ('js/data/index.js','js/data/desert/index.js','js/data/underground/index.js','js/data/jungle/index.js'):
        target=path/file;target.write_text(target.read_text()+f'\nD.__releaseProbe = {json.dumps(marker)};\n')
    renderer=path/'js/runtime/render-cache.js'
    renderer.write_text(renderer.read_text()+f'\nexport const RELEASE_PROBE = {json.dumps(marker)};\n')
    css=path/'styles.css';css.write_text(css.read_text()+f'\n:root {{ --release-probe: {marker}; }}\n')
    version=fixtures.stamp(path)
    if unversioned:
        # Negative control intentionally repeats dependency/CSS URLs; the visible
        # HTML/manifest remains B while cached native modules still belong to A.
        for entry in SCENES:
            target=path/entry;target.write_text(re.sub(r'\?v=[0-9a-f]{64}','',target.read_text()))
    return version


class CacheHandler(SimpleHTTPRequestHandler):
    def __init__(self,*args,state,**kwargs):
        self.state=state
        super().__init__(*args,directory=str(state['A']),**kwargs)

    def log_message(self,*_args):
        pass

    def end_headers(self):
        path=urlsplit(self.path).path
        self.send_header('Cache-Control','public, max-age=31536000, immutable' if path.endswith(('.js','.css','.svg')) else 'no-store')
        super().end_headers()

    def do_GET(self):
        parts=urlsplit(self.path);path=parts.path
        self.state['requests'].append({'phase':self.state['phase'],'path':self.path})
        if path=='/deployment.json' and self.state.get('probe') in ('503','malformed'):
            self.send_response(503 if self.state['probe']=='503' else 200)
            self.send_header('Content-Type','application/json');self.end_headers()
            self.wfile.write(b'not-json');return
        phase=self.state['phase']
        if phase=='B' and self.state.get('stale') and path.endswith('.html') and not parts.query:
            phase='A' # A stale document/old CDN edge, but a current uncached manifest.
        self.directory=str(self.state[phase])
        super().do_GET()


@contextmanager
def serve(state):
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(CacheHandler,state=state))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try: yield f'http://127.0.0.1:{server.server_port}'
    finally: server.shutdown();server.server_close();thread.join()


def ready(page):
    page.wait_for_selector('#viewport[data-ready="true"]',timeout=10000)
    page.wait_for_function('!!window.__nativeAPI')


def observed(page):
    return page.evaluate("""async()=>({
      data:window.__nativeAPI.state.D.__releaseProbe,
      renderer:(await import(new URL('./js/runtime/render-cache.js',document.baseURI).href)).RELEASE_PROBE,
      css:getComputedStyle(document.documentElement).getPropertyValue('--release-probe').trim(),
      version:document.querySelector('meta[name="planner-release"]').content,
      scripts:performance.getEntriesByType('resource').filter(r=>/\\.(?:js|css)(?:\\?|$)/.test(r.name)).map(r=>r.name)
    })""")


def check(browser,entry,mode,artifacts):
    name=Path(entry).stem+'-'+mode;result={'scene':entry,'mode':mode,'status':'FAIL'}
    context=browser.new_context(viewport={'width':1280,'height':900},device_scale_factor=1)
    context.add_init_script("document.addEventListener('planner-started',event=>{window.__nativeAPI=event.detail;});")
    if mode=='storage':
        context.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError');}});")
    page=context.new_page();failures=[]
    page.on('pageerror',lambda error:failures.append(str(error)))
    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory);a=root/'A';b=root/'B';a.mkdir();b.mkdir()
        negative=mode=='negative-control'
        av=make_release(a,'A',negative);bv=make_release(b,'B',negative)
        assert av!=bv
        state={'A':a,'B':b,'phase':'A','requests':[],'stale':mode=='stale-html',
               'probe':mode if mode in ('503','malformed') else None}
        with serve(state) as origin:
            try:
                page.goto(origin+'/'+entry,wait_until='load');ready(page)
                initial=observed(page)
                assert (initial['data'],initial['renderer'],initial['css'])==('A','A','A')
                assets=lambda:Counter(r['path'] for r in state['requests'] if urlsplit(r['path']).path.endswith(('.js','.css')))
                primed=assets()
                # New document visit in SAME context. No route() calls: Chromium's
                # real HTTP cache remains enabled and request counts prove reuse.
                page.goto(origin+'/'+entry+'?visit=2',wait_until='load');ready(page)
                observed(page)
                assert assets()==primed,'fixture did not retain browser asset cache'
                if mode in ('new-html','stale-html','negative-control'):
                    state['phase']='B'
                    page.goto(origin+'/'+entry,wait_until='load');ready(page)
                    fresh=observed(page)
                    if negative:
                        assert fresh['version']==bv
                        assert (fresh['data'],fresh['renderer'],fresh['css'])==('A','A','A'), 'negative control did not expose stale assets'
                        result['detectedMixedRelease']=True
                    else:
                        assert (fresh['data'],fresh['renderer'],fresh['css'])==('B','B','B'),fresh
                        assert fresh['version']==bv and all('?v='+bv in url for url in fresh['scripts']),fresh
                        page.reload(wait_until='load');ready(page)
                        assert observed(page)['data']=='B'
                        page.close();page=context.new_page()
                        page.on('pageerror',lambda error:failures.append(str(error)))
                        page.goto(origin+'/'+entry,wait_until='load');ready(page)
                        reopened=observed(page)
                        assert (reopened['data'],reopened['renderer'],reopened['css'])==('B','B','B'),reopened
                        documents=[r for r in state['requests'] if r['phase']=='B' and urlsplit(r['path']).path.endswith('.html')]
                        assert len(documents)<=5,documents # visit+one redirect, reload, reopen+one redirect
                    result['observed']=fresh
                elif mode=='offline':
                    context.set_offline(True)
                    # Already available plan and imported probe remain usable.
                    assert page.evaluate("""async()=>{
                      const {deploymentChanged}=await import(new URL('./js/runtime/deployment.js',document.baseURI).href);
                      const changed=await deploymentChanged(document);window.__nativeAPI.fit();
                      return !changed&&!window.__nativeAPI.state.destroyed;
                    }""")
                    assert page.locator('#viewport[data-ready="true"]').count()==1
                    context.set_offline(False)
                else:
                    assert len([r for r in state['requests'] if '_v=' in r['path']])==0,'probe failure caused reload'
                assert not failures,failures
                result.update(status='PASS',cachedAssets=len(primed),releaseA=av,releaseB=bv)
            except Exception as error:
                result['error']=f'{type(error).__name__}: {error}';raise
            finally:
                # A failed screenshot must not mask the original network/JS error.
                try: page.screenshot(path=str(artifacts/(name+'.png')))
                except Exception as error:
                    result['screenshot_error']=str(error)
                    if result['status']=='PASS':result['status']='FAIL';raise
                finally:
                    (artifacts/(name+'.json')).write_text(json.dumps({**result,'requests':state['requests'],'failures':failures},ensure_ascii=False,indent=2))
                    context.close()
    print('PASS cache '+name,flush=True)
    return result


def main():
    artifacts=ROOT/'browser-artifacts/cache';artifacts.mkdir(parents=True,exist_ok=True);results=[]
    with sync_playwright() as playwright:
        options={'headless':True}
        if executable:=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE'):options['executable_path']=executable
        browser=playwright.chromium.launch(**options)
        try:
            for entry in SCENES:
                for mode in ('new-html','stale-html','negative-control'):
                    results.append(check(browser,entry,mode,artifacts))
            for mode in ('offline','storage','503','malformed'):
                results.append(check(browser,'index.html',mode,artifacts))
        finally:
            browser.close();(artifacts/'summary.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    print('PASS 16 real-HTTP release/cache scenarios')

if __name__=='__main__':main()
