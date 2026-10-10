"""Generate the public Zotero update feed for the immutable release XPI."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'addon/manifest.json').read_text(encoding='utf-8'));v=m['version'];app=m['applications']['zotero'];xpi=root/'dist'/f'paper-loom-{v}.xpi'
feed={'addons':{app['id']:{'updates':[{'version':v,'update_link':f'https://github.com/JunyanKang/paper-loom/releases/download/v{v}/{xpi.name}','update_hash':'sha512:'+hashlib.sha512(xpi.read_bytes()).hexdigest(),'applications':{'zotero':{'strict_min_version':app['strict_min_version'],'strict_max_version':app['strict_max_version']}}}]}}}
(root/'updates.json').write_text(json.dumps(feed,indent=2)+'\n')
print('updates.json ->',v)
