#!/usr/bin/env python3
"""Run the complete planner validation, identically locally and in CI."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def validation_steps(root: Path = ROOT) -> list[tuple[str, list[str]]]:
    """Discover syntax/regression files; keep integration stages explicit."""
    steps = [("runner-regressions", [sys.executable, "tools/check-validation.py"])]
    for directory, pattern in (("js", "*.js"), ("tools", "*.cjs")):
        for file in sorted((root / directory).rglob(pattern)):
            relative = file.relative_to(root).as_posix()
            steps.append(("syntax-" + relative.replace("/", "-"), ["node", "--check", relative]))
    for file in sorted((root / "tools").glob("check-*.cjs")):
        steps.append((file.stem, ["node", file.relative_to(root).as_posix()]))
    steps.extend([
        ("construction-audit", ["node", "tools/audit-building.cjs"]),
        ("scene-audit", ["node", "tools/audit-scene.cjs"]),
        ("browser", [sys.executable, "tools/check-browser.py"]),
        ("cache-rollout", [sys.executable, "tools/check-ui-rollout.py"]),
        ("lighting-browser", [sys.executable, "tools/check-lighting-browser.py"]),
    ])
    return steps


def run_steps(steps: list[tuple[str, list[str]]], root: Path, artifacts: Path) -> int:
    """Keep diagnostics for every attempted stage, including crashes/timeouts."""
    artifacts.mkdir(parents=True, exist_ok=True)
    results = []
    try:
        for name, command in steps:
            print(f"\n=== {name}: {' '.join(command)} ===", flush=True)
            try:
                result = subprocess.run(command, cwd=root, capture_output=True, text=True,
                                        errors="replace", timeout=600)
                output = result.stdout + result.stderr
                code = result.returncode
            except subprocess.TimeoutExpired as error:
                # TimeoutExpired can retain bytes even when text=True was used.
                parts = [error.stdout, error.stderr]
                output = "".join(part.decode("utf-8", errors="replace") if isinstance(part, bytes)
                                 else part or "" for part in parts)
                output += f"\nTimeoutExpired: {error}\n"
                code = 1
            except OSError as error:
                output, code = f"{type(error).__name__}: {error}\n", 1
            print(output, end="" if output.endswith("\n") else "\n", flush=True)
            (artifacts / f"{name}.log").write_text(output, encoding="utf-8")
            results.append({"stage": name, "command": command, "exitCode": code,
                            "status": "PASS" if code == 0 else "FAIL"})
            # Do not run a broken planner for ten more minutes. The failing
            # stage and any already-created browser evidence remain available.
            if code != 0:
                return 1
        return 0
    finally:
        (artifacts / "summary.json").write_text(
            json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--list", action="store_true", help="Print the exact ordered stage list as JSON")
    args = parser.parse_args()
    steps = validation_steps()
    if args.list:
        print(json.dumps(steps, ensure_ascii=False, indent=2))
        return 0
    version = subprocess.run(["node", "--version"], capture_output=True, text=True, check=True).stdout.strip()
    if not version.startswith("v22."):
        raise SystemExit(f"Use Node.js 22 (CI: 22.16.0); found {version}")
    if sys.version_info < (3, 10):
        raise SystemExit("Python 3.10 or newer is required")
    return run_steps(steps, ROOT, ROOT / "validation-artifacts")


if __name__ == "__main__":
    sys.exit(main())
