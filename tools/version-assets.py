#!/usr/bin/env python3
"""Stamp one release across HTML, CSS, entry points and all native JS imports."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SCENES = ('index.html', 'desert.html', 'underground.html', 'jungle.html')
START, END = '<!-- planner-release:start -->', '<!-- planner-release:end -->'

def clean_html(text: str) -> str:
    text = re.sub(r'\n    ' + re.escape(START) + r'.*?' + re.escape(END) + r'\n', '\n', text, flags=re.S)
    return re.sub(r'((?:src|href)="\./(?:js/[^"?]+\.js|[^"/?]+\.(?:css|svg)))\?[^" ]*"', r'\1"', text)

def outputs(root: Path = ROOT) -> dict[str, str]:
    scripts = sorted(p.relative_to(root).as_posix() for p in (root / 'js').rglob('*.js'))
    files = scripts + ['js/package.json', 'styles.css', 'scene-tabs.css', 'favicon.svg']
    digest = hashlib.sha256()
    for name in sorted(files + list(SCENES)):
        content = clean_html((root/name).read_text()).encode() if name in SCENES else (root/name).read_bytes()
        digest.update(name.encode() + b'\0' + str(len(content)).encode() + b'\0' + content)
    version = digest.hexdigest()
    import_map = {'imports': {'./'+name: './'+name+'?v='+version for name in scripts}}
    block = ('    '+START+'\n    <meta name="planner-release" content="'+version+'" />\n'
             '    <script type="importmap">'+json.dumps(import_map, separators=(',', ':'))+'</script>\n    '+END+'\n')
    result = {'deployment.json': json.dumps({'version': version}, indent=2)+'\n'}
    for name in SCENES:
        source = clean_html((root/name).read_text())
        source = re.sub(r'((?:src|href)="\./(?:js/[^"?]+\.js|[^"/?]+\.(?:css|svg)))"',
                        lambda m: m[1]+'?v='+version+'"', source)
        result[name] = source.replace('  </head>', block+'  </head>')
    return result

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--write', action='store_true', help='Refresh generated release stamps after changing source')
    group.add_argument('--check', action='store_true', help='Verify stamps without writing files (the default)')
    args = parser.parse_args()
    stale = []
    for name, expected in outputs().items():
        p = ROOT/name
        if args.write:
            p.write_text(expected, encoding='utf-8')
        elif not p.exists() or p.read_text() != expected:
            stale.append(name)
    if stale:
        print('FAIL stale release metadata: '+', '.join(stale))
        print('Run python tools/version-assets.py --write after reviewing source edits.')
        return 1
    print('PASS complete native graph and CSS use one content-derived release version')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
