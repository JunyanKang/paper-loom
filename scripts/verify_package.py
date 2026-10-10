"""Verify that the distributable contains exactly the public addon source."""
from pathlib import Path
import json,hashlib,zipfile
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'addon/manifest.json').read_text(encoding='utf-8'));version=manifest['version'];artifact=root/'dist'/f'paper-loom-{version}.xpi'
with zipfile.ZipFile(artifact) as z:
 assert z.testzip() is None,'ZIP CRC failure'
 expected={p.relative_to(root/'addon').as_posix():p.read_bytes() for p in (root/'addon').rglob('*') if p.is_file() and p.name!='.DS_Store'}
 assert set(z.namelist())==set(expected),'Unexpected packaged files'
 for name,data in expected.items():
  assert z.read(name)==data,'Source mismatch: '+name
  assert 'qa-harness' not in name,'QA bridge in release'
  if name.endswith(('.js','.json','.py','.html')):
   for private in [b'/Users/kangjunyan',b'/Volumes/external',b'qa-profile',b'runtime-qa']:
    assert private not in data,'Development path in '+name
sha=hashlib.sha256(artifact.read_bytes()).hexdigest()
assert (root/'dist/SHA256SUMS').read_text(encoding='utf-8').split()[0]==sha,'Checksum mismatch'
print(json.dumps({'version':version,'files':len(expected),'bytes':artifact.stat().st_size,'sha256':sha,'sourceMatchesXPI':True,'noQAOrPrivatePaths':True},indent=2))
