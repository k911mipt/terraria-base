#!/usr/bin/env python3
"""Regression tests for read-only release validation and transitive import stamps."""
import importlib.util
import json
from pathlib import Path
import re
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('version_assets', ROOT/'tools/version-assets.py')
version = importlib.util.module_from_spec(spec)
spec.loader.exec_module(version)


def copy_sources(target):
    shutil.copytree(ROOT/'js', target/'js')
    for file in (*version.SCENES,'styles.css','scene-tabs.css','favicon.svg'):
        shutil.copy2(ROOT/file, target/file)


def stamp(target):
    outputs = version.outputs(target)
    for name, text in outputs.items():
        (target/name).write_text(text, encoding='utf-8')
    return json.loads(outputs['deployment.json'])['version']


class ReleaseTests(unittest.TestCase):
    def test_all_transitive_imports_are_mapped_and_files_exist(self):
        outputs = version.outputs()
        release = json.loads(outputs['deployment.json'])['version']
        for scene in version.SCENES:
            html = outputs[scene]
            imports = json.loads(re.search(r'<script type="importmap">(.*?)</script>', html, re.S)[1])['imports']
            for file in (ROOT/'js').rglob('*.js'):
                key = './'+file.relative_to(ROOT).as_posix()
                self.assertEqual(imports[key], key+'?v='+release)
                for relative in re.findall(r'(?:from\s*|import\s*)[\'"](\.[^\'"]+)[\'"]', file.read_text()):
                    dependency = (file.parent/relative).resolve()
                    self.assertTrue(dependency.is_file(), f'{file}: {relative}')
                    self.assertIn('./'+dependency.relative_to(ROOT).as_posix(), imports)
            urls = re.findall(r'(?:src|href)="(\./[^"?]+\.(?:js|css))(?:\?([^" ]*))?"', html)
            self.assertTrue(urls)
            self.assertTrue(all(query == 'v='+release for _,query in urls))
            self.assertEqual(len(re.findall(r'<script\b[^>]*src=', html)), 1)
            for tab in version.SCENES:
                self.assertIn('href="./'+tab+'"', html)

    def test_write_is_idempotent_and_check_does_not_write(self):
        with tempfile.TemporaryDirectory() as name:
            target=Path(name);copy_sources(target)
            initial=stamp(target)
            before={p.relative_to(target).as_posix():p.read_bytes() for p in target.rglob('*') if p.is_file()}
            self.assertEqual(initial, stamp(target))
            expected=version.outputs(target)
            self.assertTrue(all((target/name).read_text()==text for name,text in expected.items()))
            self.assertEqual(before,{p.relative_to(target).as_posix():p.read_bytes() for p in target.rglob('*') if p.is_file()})
            file=target/'js/runtime/inspector.js';file.write_text(file.read_text()+'\n// deliberate test mutation\n')
            previous_html=(target/'index.html').read_bytes()
            stale=version.outputs(target)
            self.assertNotEqual(initial,json.loads(stale['deployment.json'])['version'])
            self.assertEqual(previous_html,(target/'index.html').read_bytes(), 'checking must not repair metadata')
            refreshed=stamp(target)
            self.assertEqual(refreshed,stamp(target))

    def test_css_html_and_unloaded_scene_edits_change_the_release(self):
        with tempfile.TemporaryDirectory() as name:
            target=Path(name);copy_sources(target);current=stamp(target)
            for path in ('styles.css','desert.html','js/data/jungle/objects.js'):
                file=target/path;file.write_text(file.read_text()+'\n')
                newer=stamp(target)
                self.assertNotEqual(current,newer,path)
                current=newer


if __name__ == '__main__':
    unittest.main()
