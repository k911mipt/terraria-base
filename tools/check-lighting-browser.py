#!/usr/bin/env python3
"""Real-HTTP regressions for computed project lighting, using the shared smoke server."""
from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
import re
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("smoke", ROOT / "tools/check-browser.py")
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)
MUTATIONS = {
    "zero-radius": "D.objects.find(o=>o.kind==='light').lightRadius=0;",
    "inflated-radius": "D.objects.find(o=>o.kind==='light').lightRadius=1000000;",
    "removed-sources": "D.objects=D.objects.filter(o=>!LIGHT_KINDS.has(o.kind));",
    "blocked-source": "{const o=D.objects.find(o=>o.kind==='light');D.solids.push({x1:o.x,x2:o.x,y1:o.y,y2:o.y,mat:'gray_brick'});}",
}
smoke.AUDIT_MUTATIONS.update(MUTATIONS)


def check(browser, origin, entry, mutation, artifacts):
    context = browser.new_context(viewport=smoke.VIEWPORTS["desktop"], device_scale_factor=1)
    page = context.new_page()
    log, failures = [], []
    smoke.watch(page, origin, log, failures)
    smoke.route_startup(page, MUTATIONS[mutation])
    name = Path(entry).stem + "-" + mutation
    result = {"scene": entry, "mutation": mutation, "status": "FAIL"}
    try:
        response = page.goto(f"{origin}/{entry}", wait_until="load")
        assert response and response.status == 200
        smoke.healthy(page, failures)
        report = smoke.check_computed_audit(page, entry, mutation)
        light = report["lighting"]
        assert page.locator(".lighting-audit").count() == 1
        if mutation == "removed-sources":
            assert light["status"] == "WARN"
            assert light["zones"] and all(zone["covered"] == 0 and not zone["influencingSources"] for zone in light["zones"])
        else:
            assert report["status"] == "FAIL" and light["status"] == "FAIL"
            rule = "lighting-source" if mutation == "blocked-source" else "lighting-contract"
            assert any(error["rule"] == rule for error in light["errors"])
            if mutation == "blocked-source":
                assert light["excludedSources"] and any("object-overlap" in source["rules"] for source in light["excludedSources"])
        page.locator(".lighting-audit > summary").click()
        assert "не игровая яркость" in page.locator(".lighting-audit").inner_text()
        assert page.locator("#status > .badge.good").count() == 0
        result.update(status="PASS", audit=report)
        print(f"PASS lighting {name}", flush=True)
    except Exception as error:
        result["error"] = str(error)
        raise
    finally:
        try:
            smoke.save_screenshot(page, artifacts / f"{name}.png", result)
        finally:
            (artifacts / f"{name}.json").write_text(json.dumps({**result, "log": log, "failures": failures}, ensure_ascii=False, indent=2))
            context.close()


def main():
    artifacts = ROOT / "browser-artifacts/lighting"
    artifacts.mkdir(parents=True, exist_ok=True)
    with smoke.serve() as origin, sync_playwright() as playwright:
        options = {"headless": True}
        if executable := os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"):
            options["executable_path"] = executable
        browser = playwright.chromium.launch(**options)
        try:
            for entry in smoke.SCENES:
                for mutation in MUTATIONS:
                    check(browser, origin, entry, mutation, artifacts)
        finally:
            browser.close()
    print("PASS 16 real-HTTP project lighting scenarios")


if __name__ == "__main__":
    main()
