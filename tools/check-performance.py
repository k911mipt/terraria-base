#!/usr/bin/env python3
"""Test profile aggregation independently of browser speed and optional CDP RSS."""
import importlib.util
from pathlib import Path
import unittest
import tempfile
import io
from contextlib import redirect_stderr
from unittest.mock import patch, MagicMock

spec = importlib.util.spec_from_file_location('profile_planner', Path(__file__).with_name('profile-planner.py'))
profile = importlib.util.module_from_spec(spec)
spec.loader.exec_module(profile)


class ProfileReportTests(unittest.TestCase):
    def test_empty_is_missing_not_fast(self):
        self.assertEqual(profile.stats([]), {'n':0,'median':None,'p95':None,'max':None})

    def test_percentile_uses_nearest_rank(self):
        self.assertEqual(profile.stats(list(range(1,21))), {'n':20,'median':10.5,'p95':19,'max':20})
        self.assertEqual(profile.stats([7]), {'n':1,'median':7,'p95':7,'max':7})

    def test_invalid_numbers_are_not_results(self):
        for value in (float('nan'),float('inf'),-1):
            with self.subTest(value=value), self.assertRaises(ValueError):
                profile.stats([value])

    def test_missing_phase_is_not_zero(self):
        rows = [{'scene':'index.html','device':'desktop','status':'PASS','startupReadyMs':20,
                 'lookupMicrosecondsPerCall':{'objectAt':[1,3],'roomAt':[2,4]},
                 'phases':{'panZoom':{'rafCallbackElapsedMs':[1,2]}}}]
        summary = profile.summarize(rows)
        self.assertEqual(summary['index.html/desktop']['lookupUs']['objectAt']['median'],2)
        self.assertEqual(summary['index.html/desktop']['rafCallbackElapsedMs']['hover']['n'],0)
        self.assertIsNone(summary['desert.html/mobile']['startupReadyMs']['median'])

    def test_failed_profile_is_not_aggregated(self):
        summary = profile.summarize([{'scene':'index.html','device':'desktop','status':'FAIL'}])
        self.assertEqual(summary['index.html/desktop']['startupReadyMs']['n'],0)

    def test_empty_map_is_not_a_hover_workload(self):
        class NoTargets:
            def evaluate(self, _):
                return []
        with self.assertRaisesRegex(AssertionError, 'visible object targets'):
            profile.visible_targets(NoTargets())

    def test_unavailable_rss_is_not_zero(self):
        class Unsupported:
            def send(self, _):
                raise RuntimeError('CDP unavailable')
        result=profile.process_rss(Unsupported())
        self.assertFalse(result['available'])
        self.assertNotIn('summedRssBytes',result)
        self.assertIn('CDP unavailable',result['error'])


class ProfileOutputTests(unittest.TestCase):
    def test_new_nested_output(self):
        with tempfile.TemporaryDirectory() as root:
            output=Path(root)/'nested'/'run'
            profile.prepare_output(output)
            self.assertTrue(output.is_dir())
            self.assertEqual(list(output.iterdir()), [])

    def test_empty_directory_is_already_claimed(self):
        with tempfile.TemporaryDirectory() as root:
            output=Path(root)/'run'
            profile.prepare_output(output)
            with self.assertRaises(FileExistsError):
                profile.prepare_output(output)
            self.assertEqual(list(output.iterdir()), [])

    def test_rerun_preserves_all_old_results(self):
        with tempfile.TemporaryDirectory() as root:
            output=Path(root)
            old={'summary.json':b'old PASS', 'index-desktop-5.json':b'old repeat',
                 'index-mobile-1.png':b'old image', 'index-mobile-1.heapprofile':b'old heap'}
            for name, value in old.items():
                (output/name).write_bytes(value)
            with self.assertRaises(FileExistsError):
                profile.prepare_output(output)
            self.assertEqual({p.name:p.read_bytes() for p in output.iterdir()},old)

    def test_output_file_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as root:
            output=Path(root)/'run'; output.write_bytes(b'keep')
            with self.assertRaises(FileExistsError):
                profile.prepare_output(output)
            self.assertEqual(output.read_bytes(),b'keep')

    def test_symlink_is_not_followed(self):
        with tempfile.TemporaryDirectory() as root:
            target=Path(root)/'target'; target.mkdir()
            output=Path(root)/'run'; output.symlink_to(target,target_is_directory=True)
            with self.assertRaises(FileExistsError):
                profile.prepare_output(output)
            self.assertTrue(output.is_symlink())
            self.assertEqual(list(target.iterdir()),[])

    def test_cli_fails_before_git_browser_or_summary(self):
        with tempfile.TemporaryDirectory() as root, \
             patch('sys.argv',['profile-planner.py','--repeats','1','--output',root]), \
             patch.object(profile.subprocess,'run') as git, \
             patch.object(profile,'sync_playwright') as browser, \
             redirect_stderr(io.StringIO()) as stderr:
            with self.assertRaises(SystemExit) as failure:
                profile.main()
            self.assertEqual(failure.exception.code,2)
            self.assertIn('Choose a new --output directory',stderr.getvalue())
            git.assert_not_called(); browser.assert_not_called()
            self.assertEqual(list(Path(root).iterdir()),[])


class ProfileProvenanceTests(unittest.TestCase):
    def test_favicon_is_part_of_application_digest(self):
        with tempfile.TemporaryDirectory() as root, patch.object(profile,'ROOT',Path(root)):
            for name in ['index.html','styles.css','deployment.json','favicon.svg','js/start.js']:
                file=Path(root)/name; file.parent.mkdir(parents=True,exist_ok=True); file.write_text(name)
            before=profile.application_digest()
            (Path(root)/'favicon.svg').write_text('<svg>changed</svg>')
            self.assertNotEqual(before,profile.application_digest())
            changed=profile.application_digest()
            (Path(root)/'notes.txt').write_text('not a loaded resource')
            self.assertEqual(changed,profile.application_digest())
            (Path(root)/'favicon.svg').unlink()
            with self.assertRaises(FileNotFoundError):
                profile.application_digest()

    def test_failed_profile_retains_identity_partial_measurements_and_error(self):
        results=[]
        browser=MagicMock(); context=browser.new_context.return_value
        page=context.new_page.return_value; page.goto.return_value.status=200
        page.evaluate.side_effect=lambda expression: 42 if expression=='__profile.readyMs' else {}
        context.new_cdp_session.return_value.send.return_value={}
        with tempfile.TemporaryDirectory() as root, \
             patch.object(profile,'process_rss',return_value={'available':False}), \
             patch.object(profile,'focus_room',side_effect=RuntimeError('partial-profile failure')):
            with self.assertRaisesRegex(RuntimeError,'partial-profile failure'):
                profile.one_profile(browser,MagicMock(),'http://localhost','index.html','desktop',2,Path(root),results)
            self.assertEqual(len(results),1)
            record=results[0]
            self.assertEqual((record['scene'],record['device'],record['repeat']),('index.html','desktop',2))
            self.assertEqual(record['status'],'FAIL')
            self.assertEqual(record['startupReadyMs'],42)
            self.assertIn('partial-profile failure',record['error'])
            self.assertEqual(record['failures'],[])
            self.assertEqual(profile.json.loads((Path(root)/'index-desktop-2.json').read_text()),record)
            self.assertEqual(profile.summarize(results)['index.html/desktop']['startupReadyMs']['n'],0)
        context.close.assert_called_once()

    def test_browser_setup_failure_is_retained_in_run_list(self):
        results=[]; browser=MagicMock(); browser.new_context.side_effect=RuntimeError('setup failure')
        with tempfile.TemporaryDirectory() as root, self.assertRaisesRegex(RuntimeError,'setup failure'):
            profile.one_profile(browser,None,'http://localhost','desert.html','mobile',3,Path(root),results)
        self.assertEqual(results,[{'scene':'desert.html','device':'mobile','repeat':3,'status':'FAIL'}])


if __name__ == '__main__':
    unittest.main()
