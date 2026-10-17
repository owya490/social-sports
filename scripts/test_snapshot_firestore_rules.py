import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('snapshot', Path(__file__).with_name('snapshot-firestore-rules.py'))
snapshot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(snapshot)

class SnapshotTests(unittest.TestCase):
    def run_snapshot(self, ruleset, source, extra=()):
        Path('.tmp').mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir='.tmp') as output:
            responses = [io.BytesIO(json.dumps(value).encode()) for value in [
                {'rulesetName': ruleset}, {'source': {'files': [{'name': 'firestore.rules', 'content': source}]}}
            ]]
            with patch('sys.argv', ['snapshot', '--output', output, *extra]), \
                 patch.object(snapshot.subprocess, 'check_output', return_value='mock-token'), \
                 patch.object(snapshot.urllib.request, 'urlopen', side_effect=responses), \
                 contextlib.redirect_stdout(io.StringIO()):
                snapshot.main()
            self.assertEqual((Path(output) / 'firestore.rules').read_text(), source)

    def test_saves_reviewed_baseline(self):
        name = f'projects/{snapshot.PROJECT}/rulesets/reviewed'
        self.run_snapshot(name, 'source', ['--expected-ruleset', name])

    def test_refuses_drift(self):
        with self.assertRaisesRegex(SystemExit, 'drifted'):
            self.run_snapshot(f'projects/{snapshot.PROJECT}/rulesets/changed', 'source', ['--expected-ruleset', 'reviewed'])

    def test_refuses_other_project(self):
        with self.assertRaisesRegex(SystemExit, 'Unexpected ruleset project'):
            self.run_snapshot('projects/socialsportsprod/rulesets/unexpected', 'source')

    def test_verifies_published_source(self):
        self.run_snapshot(f'projects/{snapshot.PROJECT}/rulesets/reviewed', Path('firestore.rules').read_text(), ['--verify-source'])
        with self.assertRaisesRegex(SystemExit, 'does not match'):
            self.run_snapshot(f'projects/{snapshot.PROJECT}/rulesets/reviewed', 'different', ['--verify-source'])

if __name__ == '__main__':
    unittest.main()
