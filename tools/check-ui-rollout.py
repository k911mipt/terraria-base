#!/usr/bin/env python3
"""HTTP cache regression for the common-UI rollout. No request interception."""
from __future__ import annotations

from collections import Counter
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
import os
from pathlib import Path
import threading
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("smoke", ROOT / "tools/check-browser.py")
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)
SHARED = tuple(f"/js/runtime/{name}.js" for name in
               ("scene-ui", "formatters", "tables", "prepare", "interactions", "start"))
TOKEN = "v=common-ui-20260907"


@contextmanager
def serve_rollout(unversioned=False):
    state = {"phase": "A", "requests": []}

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def log_message(self, *_args):
            pass

        def end_headers(self):
            path = urlsplit(self.path).path
            cache = "public, max-age=31536000, immutable" if path.endswith((".js", ".css")) else "no-store"
            self.send_header("Cache-Control", cache)
            super().end_headers()

        def send_text(self, text, content_type):
            data = text.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_HEAD(self):
            # The deployment probe is not the resource-version regression.
            self.send_response(204)
            self.end_headers()

        def do_GET(self):
            parsed = urlsplit(self.path)
            state["requests"].append({"phase": state["phase"], "url": self.path})
            if state["phase"] == "A" and parsed.path in SHARED:
                return self.send_text("(window.__legacyURLs ||= []).push(" + json.dumps(parsed.path) + ");", "text/javascript")
            if parsed.path.lstrip("/") in smoke.SCENES:
                if state["phase"] == "A":
                    html = "<!doctype html><title>Old cached UI fixture</title>" + "".join(
                        f'<script src="{path}"></script>' for path in SHARED)
                else:
                    html = (ROOT / parsed.path.lstrip("/")).read_text()
                    if unversioned:
                        for path in SHARED:
                            html = html.replace("." + path + "?" + TOKEN, "." + path)
                return self.send_text(html, "text/html; charset=utf-8")
            super().do_GET()

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}", state
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def check(browser, entry, unversioned, artifacts):
    context = browser.new_context(viewport=smoke.VIEWPORTS["desktop"], device_scale_factor=1)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    name = Path(entry).stem + ("-unversioned" if unversioned else "-versioned")
    result = {"scene": entry, "unversioned": unversioned, "status": "FAIL"}
    with serve_rollout(unversioned) as (origin, state):
        try:
            url = origin + "/" + entry
            page.goto(url, wait_until="load")
            assert page.evaluate("window.__legacyURLs.length") == len(SHARED)
            counts = Counter(item["url"] for item in state["requests"] if item["url"] in SHARED)
            assert counts == Counter(SHARED), "legacy resources were not primed"
            page.goto(url + "?cache-proof=1", wait_until="load")
            assert page.evaluate("window.__legacyURLs.length") == len(SHARED)
            assert Counter(item["url"] for item in state["requests"] if item["url"] in SHARED) == counts, "cache was not retained"
            state["phase"] = "B"
            page.goto(url + "?deployment=B", wait_until="load")
            smoke.settle(page)
            if unversioned:
                assert page.evaluate("window.__legacyURLs.length") == len(SHARED), "negative control did not use cached old scripts"
                assert not page.locator('#viewport[data-ready="true"]').count(), "mixed rollout unexpectedly started"
            else:
                smoke.healthy(page, errors)
                for fresh_page in (False, True):
                    if fresh_page:
                        page = context.new_page()
                        page.on("pageerror", lambda error: errors.append(str(error)))
                        page.goto(url, wait_until="load")
                    else:
                        page.reload(wait_until="load")
                    smoke.healthy(page, errors)
                    assert page.evaluate("window.__legacyURLs === undefined"), "old shared scripts executed in B"
                    loaded = page.evaluate("performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script').map(e=>e.name)")
                    for path in SHARED:
                        assert any(urlsplit(resource).path == path and urlsplit(resource).query == TOKEN for resource in loaded), path
            result["status"] = "PASS"
            print(f"PASS rollout {name}", flush=True)
        except Exception as error:
            result["error"] = str(error)
            raise
        finally:
            try:
                page.screenshot(path=str(artifacts / f"{name}.png"))
                (artifacts / f"{name}.json").write_text(json.dumps({**result,
                    "requests": state["requests"], "pageerrors": errors}, ensure_ascii=False, indent=2))
            finally:
                context.close()


def main():
    artifacts = ROOT / "browser-artifacts/ui-rollout"
    artifacts.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        options = {"headless": True}
        if executable := os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"):
            options["executable_path"] = executable
        browser = playwright.chromium.launch(**options)
        try:
            for entry in smoke.SCENES:
                for unversioned in (True, False):
                    check(browser, entry, unversioned, artifacts)
        finally:
            browser.close()
    print("PASS 8 cached UI rollout scenarios")


if __name__ == "__main__":
    main()
