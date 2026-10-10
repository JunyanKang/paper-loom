from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parents[1]
addon=root/'addon'
(addon/'voice/panel-style.js').write_text('var PaperVoiceStyle = '+json.dumps((addon/'voice/panel.css').read_text(encoding='utf-8'),ensure_ascii=False)+';\n',encoding='utf-8')
version=json.loads((addon/'manifest.json').read_text(encoding='utf-8'))['version']
# Cache revisions are computed from this product's actual code.
digest=hashlib.sha256()
for p in sorted((addon/'references').glob('*.js')):
 if p.name!='network-revisions.js':digest.update(p.name.encode());digest.update(p.read_bytes())
revisions={'schema':1,**{k:digest.hexdigest() for k in ['references','reports','topics','authors','abstracts','input','snapshot','enhancement']}}
(addon/'references/network-revisions.js').write_text('var PaperNexusNetworkRevisions = '+json.dumps(revisions)+';\n')
out=root/'dist';out.mkdir(exist_ok=True);path=out/f'paper-loom-{version}.xpi'
with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(addon.rglob('*')):
  if not p.is_file() or p.name=='.DS_Store':continue
  info=zipfile.ZipInfo(p.relative_to(addon).as_posix(),(2026,10,10,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.create_system=3;info.external_attr=0o100644<<16;z.writestr(info,p.read_bytes())
(out/'SHA256SUMS').write_text(hashlib.sha256(path.read_bytes()).hexdigest()+'  '+path.name+'\n')
print(path)
