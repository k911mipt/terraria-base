#!/usr/bin/env python3
"""Test profile aggregation independently of browser speed and optional CDP RSS."""
import importlib.util
from pathlib import Path
import unittest

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

    def test_unavailable_rss_is_not_zero(self):
        class Unsupported:
            def send(self, _):
                raise RuntimeError('CDP unavailable')
        result=profile.process_rss(Unsupported())
        self.assertFalse(result['available'])
        self.assertNotIn('summedRssBytes',result)
        self.assertIn('CDP unavailable',result['error'])


if __name__ == '__main__':
    unittest.main()
