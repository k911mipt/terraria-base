#!/usr/bin/env python3
"""Regressions for the complete validation command (standard library only)."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("planner_validate", Path(__file__).with_name("validate.py"))
validate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validate)


class ValidationCommandTests(unittest.TestCase):
    def test_discovery_includes_new_nested_js_and_all_checkers(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for file in ("js/nested/entry.js", "tools/check-new.cjs", "tools/lib/helper.cjs"):
                path = root / file
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("", encoding="utf-8")
            commands = [command for _, command in validate.validation_steps(root)]
            for command in (["node", "--check", "js/nested/entry.js"],
                            ["node", "--check", "tools/lib/helper.cjs"],
                            ["node", "tools/check-new.cjs"],
                            [sys.executable, "tools/check-browser.py"]):
                self.assertIn(command, commands)

    def test_failure_cannot_be_hidden_by_later_success(self):
        with tempfile.TemporaryDirectory() as temporary, contextlib.redirect_stdout(io.StringIO()):
            root = Path(temporary)
            steps = [("ok", [sys.executable, "-c", "print('first evidence')"]),
                     ("bad", [sys.executable, "-c", "raise SystemExit(7)"]),
                     ("never", [sys.executable, "-c", "print('not executed')"])]
            self.assertEqual(validate.run_steps(steps, root, root / "logs"), 1)
            report = json.loads((root / "logs/summary.json").read_text())
            self.assertEqual([stage["status"] for stage in report], ["PASS", "FAIL"])
            self.assertEqual(report[-1]["exitCode"], 7)
            self.assertIn("first evidence", (root / "logs/ok.log").read_text())
            self.assertFalse((root / "logs/never.log").exists())

    def test_missing_executable_is_a_recorded_failure(self):
        with tempfile.TemporaryDirectory() as temporary, contextlib.redirect_stdout(io.StringIO()):
            root = Path(temporary)
            self.assertEqual(validate.run_steps([("missing", [str(root / "absent")])], root, root / "logs"), 1)
            self.assertEqual(json.loads((root / "logs/summary.json").read_text())[0]["status"], "FAIL")

    def test_timeout_retains_partial_stdout_and_stderr(self):
        for stdout, stderr in ((b"partial stdout\n", b"partial stderr\n"),
                               ("partial stdout\n", "partial stderr\n"),
                               (None, None)):
            with self.subTest(stdout=stdout), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                error = validate.subprocess.TimeoutExpired(["test"], 600, output=stdout, stderr=stderr)
                with patch.object(validate.subprocess, "run", side_effect=error), \
                     contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(validate.run_steps([("timeout", ["test"])], root, root / "logs"), 1)
                output = (root / "logs/timeout.log").read_text()
                self.assertIn("TimeoutExpired", output)
                if stdout is not None:
                    self.assertIn("partial stdout", output)
                    self.assertIn("partial stderr", output)
                self.assertEqual(json.loads((root / "logs/summary.json").read_text())[0]["status"], "FAIL")

    def test_success_returns_zero_and_records_evidence(self):
        with tempfile.TemporaryDirectory() as temporary, contextlib.redirect_stdout(io.StringIO()):
            root = Path(temporary)
            self.assertEqual(validate.run_steps([("ok", [sys.executable, "-c", "print('PASS')"])], root, root / "logs"), 0)
            self.assertEqual(json.loads((root / "logs/summary.json").read_text())[0]["status"], "PASS")


if __name__ == "__main__":
    unittest.main()
