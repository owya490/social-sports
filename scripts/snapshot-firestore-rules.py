#!/usr/bin/env python3
"""Read the dev release and its source; never mutate Firebase resources."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request

PROJECT = 'socialsports-44162'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--expected-ruleset')
    parser.add_argument('--verify-source', action='store_true')
    args = parser.parse_args()
    token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()

    def get(resource):
        request = urllib.request.Request(
            'https://firebaserules.googleapis.com/v1/' + resource,
            headers={'Authorization': 'Bearer ' + token})
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)

    release = get(f'projects/{PROJECT}/releases/cloud.firestore')
    ruleset_name = release['rulesetName']
    if not ruleset_name.startswith(f'projects/{PROJECT}/rulesets/'):
        raise SystemExit('Unexpected ruleset project')
    ruleset = get(ruleset_name)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'release.json').write_text(json.dumps(release, indent=2) + '\n')
    (output / 'ruleset.json').write_text(json.dumps(ruleset, indent=2) + '\n')
    files = ruleset['source']['files']
    if len(files) != 1:
        raise SystemExit('Expected one source file; inspect the saved ruleset before proceeding')
    source = files[0]['content']
    (output / 'firestore.rules').write_text(source)
    print(f'Project: {PROJECT}\nRuleset: {ruleset_name}\nSource SHA256: {hashlib.sha256(source.encode()).hexdigest()}')
    if args.expected_ruleset and ruleset_name != args.expected_ruleset:
        raise SystemExit('Live rules drifted from the reviewed snapshot; inspect again')
    if args.verify_source and source != Path('firestore.rules').read_text():
        raise SystemExit('Deployed source does not match this commit')

if __name__ == '__main__':
    main()
