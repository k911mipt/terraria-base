#!/usr/bin/env python3
"""Real-HTTP smoke tests. Only Playwright is a development dependency."""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import threading
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SCENES = ("index.html", "desert.html", "underground.html", "jungle.html")
CONTROL_DOORS = ("D_P1_CRAFT", "D_INNER_L", "UG_MECH_GOBLIN", "JG_DRYAD_HUB")
VIEWPORTS = {"desktop": {"width": 1800, "height": 1200},
             "mobile": {"width": 390, "height": 844}}


class SmokeFailure(AssertionError):
    pass


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


@contextmanager
def serve():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def settle(page):
    page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")


def watch(page, origin, log, failures):
    # Install BEFORE navigation, including resource listeners. A deployment HEAD
    # probe is not a planner dependency and is isolated from these offline tests.
    def required(request):
        return request.method != "HEAD" and request.resource_type in ("document", "script", "stylesheet")

    def request_failed(request):
        if required(request):
            failures.append(f"resource: {request.url}: {request.failure}")

    def response_received(response):
        if required(response.request):
            log.append({"resource": response.url, "status": response.status})
            if response.status >= 400:
                failures.append(f"resource: HTTP {response.status} {response.url}")

    def route_request(route):
        request = route.request
        if request.method == "HEAD" and "_cache_check=" in request.url:
            log.append({"deployment_probe": request.url, "isolated": True})
            route.fulfill(status=204)
        elif not request.url.startswith(origin + "/"):
            failures.append(f"external resource: {request.url}")
            route.abort()
        else:
            route.continue_()

    page.on("pageerror", lambda error: failures.append(f"javascript: {error}"))
    page.on("console", lambda message: log.append({"console": message.type, "text": message.text}))
    page.on("requestfailed", request_failed)
    page.on("response", response_received)
    page.route("**/*", route_request)


def healthy(page, failures):
    if failures:
        raise SmokeFailure("\n".join(failures))
    try:
        page.wait_for_selector('#viewport[data-ready="true"]', timeout=10000)
    except Exception as error:
        raise SmokeFailure("startup: first render did not complete\n" + "\n".join(failures)) from error
    settle(page)
    if failures:
        raise SmokeFailure("\n".join(failures))
    assert page.locator("#roomRows tr").count() > 0, "room table is empty"
    assert page.locator("#materialRows tr").count() > 0, "material table is empty"
    assert page.locator("#arenaRows tr").count() > 0, "object table is empty"
    assert page.locator("#viewInfo").inner_text(), "no rendered camera information"
    # Look for actual drawn pixels on BOTH cached visible layers, not PNG size
    # or the always-present page heading. A blank canvas cannot pass.
    for selector in ("#baseCanvas", "#objectCanvas"):
        assert page.locator(selector).evaluate("""canvas => {
          if (canvas.width < 1 || canvas.height < 1) return false;
          const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          const colors = new Set();
          for (let i = 0; i < data.length; i += 4 * 13) {
            if (data[i + 3]) colors.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
            if (colors.size > 8) return true;
          }
          return false;
        }"""), f"{selector} is blank or unrendered"


def rows(page):
    return page.locator("#ikv").evaluate("""element => {
      const cells = [...element.children].map(e => e.textContent);
      return Object.fromEntries(cells.flatMap((cell, i) => i % 2 ? [] : [[cell, cells[i + 1]]]));
    }""")


def click_tile(page, x, y, mobile):
    # Focus is only setup; selection must go through a real pointer/touch event.
    page.evaluate("([x, y]) => focusRect(x - 3, y - 3, x + 3, y + 3, 2, false)", [x, y])
    settle(page)
    point = page.evaluate("""([x, y]) => {
      const r = viewport.getBoundingClientRect();
      return { x: r.left + sx(x + .5), y: r.top + sy(y + .5) };
    }""", [x, y])
    if mobile:
        page.touchscreen.tap(**point)
    else:
        page.mouse.click(**point)
    settle(page)


def touch_gesture(page, pinch):
    # Chromium CDP emits real touch/pointer events through the normal handlers.
    # The test does not call beginPinchGesture/updatePinchGesture directly.
    box = page.locator("#viewport").bounding_box()
    width, height = page.viewport_size["width"], page.viewport_size["height"]
    x = max(80, min(width - 80, box["x"] + box["width"] / 2))
    y = max(box["y"] + 60, min(height - 80, box["y"] + 180))
    session = page.context.new_cdp_session(page)
    before = page.evaluate("({...cam})")
    try:
        if pinch:
            points = lambda distance: [
                {"x": x - distance, "y": y, "id": 1},
                {"x": x + distance, "y": y, "id": 2},
            ]
            session.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": points(28)})
            for distance in (34, 42, 52):
                session.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": points(distance)})
        else:
            session.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y, "id": 1}]})
            for dx in (15, 30, 50):
                session.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x + dx, "y": y + 12, "id": 1}]})
        session.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    finally:
        session.detach()
    settle(page)
    after = page.evaluate("({...cam})")
    if pinch:
        assert after["scale"] > before["scale"], "pinch did not increase map scale"
    else:
        assert abs(after["x"] - before["x"]) > 1, "touch pan did not move map"
        assert after["scale"] == before["scale"], "pan unexpectedly changed scale"
    assert page.evaluate("viewportPointers.size === 0 && pinchGesture === null"), "gesture state leaked"


def interact(page, entry, mobile):
    # Static navigation is required even without JavaScript; compare original
    # HTML independently of the dynamically initialized page.
    static_links = re.findall(r'<a class="scene-tab" href="\./([^"]+)"', (ROOT / entry).read_text())
    assert static_links == list(SCENES), f"{entry}: missing static scene tabs"
    assert page.locator(".scene-tab").count() == 4
    assert page.locator('.scene-tab[aria-current="page"]').get_attribute("href") == "./" + entry
    modes = page.locator("#mode option").evaluate_all("options => options.map(o => o.value)")
    images = set()
    for mode in modes:
        page.select_option("#mode", mode)
        settle(page)
        assert page.locator("#mode").input_value() == mode
        # Distinct pixel outputs prove the mode change reached a renderer.
        images.add(page.evaluate("[baseCanvas, objectCanvas, overlayCanvas].map(c => c.toDataURL()).join('|')"))
    assert len(images) == len(modes), "one or more available modes have identical output"
    page.select_option("#mode", "visual")
    page.locator("#fit").click()
    settle(page)
    fitted = page.evaluate("({...cam})")
    page.locator("#craft").click()
    settle(page)
    assert page.evaluate("({...cam})") != fitted, "focus button did nothing"
    page.locator("#back").click()
    settle(page)
    assert page.evaluate("({...cam})") == fitted, "camera history did not restore fit"
    if mobile:
        toggle = page.locator(".toolbar-toggle")
        toggle.tap()
        assert toggle.get_attribute("aria-expanded") == "false"
        assert page.locator(".toolbar").evaluate("el => el.classList.contains('toolbar-collapsed')")
        toggle.tap()
        assert toggle.get_attribute("aria-expanded") == "true"
        toggle.tap()
        # Keep the canvas visible for native touch gestures and tile taps.
        page.evaluate("window.scrollTo(0, 0)")
        settle(page)
    else:
        box = page.locator("#viewport").bounding_box()
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        before = page.evaluate("({...cam})")
        page.mouse.move(x, y)
        page.mouse.down()
        page.mouse.move(x + 80, y + 30, steps=5)
        page.mouse.up()
        settle(page)
        assert page.evaluate("cam.x") != before["x"], "mouse pan did nothing"
        page.mouse.wheel(0, -150)
        settle(page)
        assert page.evaluate("cam.scale") > before["scale"], "wheel zoom did nothing"
    if mobile:
        # fit of the large base may be below the pointer zoom clamp (2px/tile).
        page.evaluate("cam.scale = 4; schedule()")
        settle(page)
        touch_gesture(page, pinch=False)
        touch_gesture(page, pinch=True)
    door_id = CONTROL_DOORS[SCENES.index(entry)]
    obj = page.evaluate("id => D.objects.find(o => o.id === id)", door_id)
    click_tile(page, obj["x"], obj["y"] + 1, mobile)
    assert page.evaluate("selected?.id") == door_id, "door pointer selection failed"
    expected_room = page.evaluate("id => roomForObject(D, D.objects.find(o => o.id === id))?.name || '—'", door_id)
    assert rows(page)["Модуль объекта"] == expected_room
    if entry == "underground.html":
        assert "Гоблин" in rows(page)["Модуль объекта"]
        assert rows(page)["Модуль объекта"] != rows(page)["Область тайла"]
        for x, y in ((24, 8), (29, 10), (44, 9)):
            click_tile(page, x, y, mobile)
            assert rows(page)["Безопасная стена"] == "Да, поставленная игроком"
    empty = page.evaluate("[D.bounds.xMax + 10, D.bounds.yMax + 10]")
    click_tile(page, *empty, mobile)
    assert page.evaluate("selected === null && selectedTile !== null")
    assert "Безопасная стена" not in rows(page)
    assert "Фоновой стены нет" in page.locator("#ikv").inner_text()
    # Reproducible final screenshots: visual, fit, unselected, DPR 1.
    page.evaluate("selected = null; selectedTile = null; hideTip(); fit(false)")
    settle(page)


def scenario(browser, origin, entry, device, artifacts, mutation=None):
    name = f"{Path(entry).stem}-{device}" + (f"-{mutation}" if mutation else "")
    log, failures = [], []
    context = browser.new_context(viewport=VIEWPORTS[device], device_scale_factor=1,
                                  is_mobile=device == "mobile", has_touch=device == "mobile")
    context.tracing.start(screenshots=True, snapshots=True, sources=True)
    page = context.new_page()
    page.set_default_timeout(10000)
    watch(page, origin, log, failures)
    result = {"scene": entry, "device": device, "mutation": mutation, "status": "FAIL"}
    try:
        if mutation:
            scripts = re.findall(r'<script\b[^>]*src="([^"]+)"', (ROOT / entry).read_text())
            startup = urlsplit(scripts[-1]).path.removeprefix("./")
            if mutation == "start-throw":
                source = (ROOT / startup).read_text()
                page.route(f"**/{startup}*", lambda route: route.fulfill(
                    content_type="text/javascript", body='throw new Error("SMOKE_START_FAILURE");\n' + source))
            else:
                target = startup if mutation == "missing-js" else "styles.css"
                page.route(f"**/{target}*", lambda route: route.fulfill(status=404, body="Smoke-test missing resource"))
        response = page.goto(f"{origin}/{entry}", wait_until="load")
        assert response and response.status == 200
        if mutation:
            # The static heading remains visible even in a broken startup.
            assert page.locator(".maphead b").inner_text()
            try:
                healthy(page, failures)
            except SmokeFailure as error:
                expected = "SMOKE_START_FAILURE" if mutation == "start-throw" else "resource: HTTP 404"
                assert expected in str(error), f"wrong failure for {mutation}: {error}"
                result["expected_failure"] = str(error)
            else:
                raise AssertionError(f"{mutation}: broken scene passed the normal readiness gate")
        else:
            healthy(page, failures)
            interact(page, entry, device == "mobile")
            healthy(page, failures)
            # Follow an actual tab, not just inspect its label or href.
            if device == "mobile":
                page.locator(".toolbar-toggle").tap()
            next_entry = SCENES[(SCENES.index(entry) + 1) % len(SCENES)]
            page.locator(f'.scene-tab[href="./{next_entry}"]').click()
            page.wait_for_url(f"**/{next_entry}")
            healthy(page, failures)
            page.goto(f"{origin}/{entry}", wait_until="load")
            healthy(page, failures)
            page.evaluate("document.getElementById('mode').value = 'visual'; fit(false)")
            if device == "mobile" and page.locator(".toolbar-toggle").get_attribute("aria-expanded") == "true":
                page.locator(".toolbar-toggle").tap()
            settle(page)
        result["status"] = "PASS"
    finally:
        try:
            page.screenshot(path=str(artifacts / f"{name}.png"), full_page=False)
        finally:
            (artifacts / f"{name}.json").write_text(json.dumps({**result, "log": log, "failures": failures}, ensure_ascii=False, indent=2))
            context.tracing.stop(path=str(artifacts / f"{name}-trace.zip"))
            context.close()
    print(f"PASS {name}", flush=True)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifacts", type=Path, default=ROOT / "browser-artifacts")
    args = parser.parse_args()
    args.artifacts.mkdir(parents=True, exist_ok=True)
    results = []
    with serve() as origin, sync_playwright() as playwright:
        options = {"headless": True}
        if executable := os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"):
            options["executable_path"] = executable
        browser = playwright.chromium.launch(**options)
        try:
            for entry in SCENES:
                for device in VIEWPORTS:
                    results.append(scenario(browser, origin, entry, device, args.artifacts))
                for mutation in ("start-throw", "missing-js", "missing-css"):
                    results.append(scenario(browser, origin, entry, "desktop", args.artifacts, mutation))
        finally:
            browser.close()
            (args.artifacts / "summary.json").write_text(json.dumps(results, ensure_ascii=False, indent=2))
    print(f"PASS {len(results)} real-HTTP browser scenarios")


if __name__ == "__main__":
    main()
