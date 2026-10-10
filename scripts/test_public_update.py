"""Upgrade a supplied previous XPI through the live public feed in a disposable profile."""
from pathlib import Path
import json,os,subprocess,sys,time,zipfile
r=Path(__file__).resolve().parents[1];source=Path(sys.argv[1]).resolve();profile=r/'qa-profile-upgrade101';results=r/'test-results-upgrade101';library=r/'qa-library-upgrade101'
for p in [profile/'extensions',results,library]:p.mkdir(parents=True,exist_ok=True)
if (profile/'extensions.json').exists():raise SystemExit('Use a fresh upgrade QA profile')
prefs={'extensions.zotero.dataDir':str(library),'extensions.zotero.useDataDir':True,'extensions.zotero.firstRun2':False,'extensions.zotero.firstRunGuidance':False,'extensions.autoDisableScopes':0,'extensions.enabledScopes':15,'app.update.auto':False,'extensions.update.enabled':False}
(profile/'user.js').write_text(''.join('user_pref('+json.dumps(k)+','+json.dumps(v)+');\n' for k,v in prefs.items()),encoding='utf-8')
harness=(r/'tests/native-public-update.js').read_text(encoding='utf-8').replace('__ROOT__',json.dumps(str(r)))
with zipfile.ZipFile(source) as original,zipfile.ZipFile(profile/'extensions/paper-loom@local.research.xpi','w',zipfile.ZIP_DEFLATED) as target:
 for name in original.namelist():
  data=original.read(name)
  if name=='bootstrap.js':data+=b'\nvar previousStartup=startup;startup=async function(data){await previousStartup(data);Services.scriptloader.loadSubScript(data.rootURI+"qa-public-update.js",LoomScope);};\n'
  target.writestr(name,data)
 target.writestr('qa-public-update.js',harness)
with (results/'zotero.log').open('w') as log:
 binary=os.environ.get('PAPER_LOOM_QA_BINARY',str(r.parent/'.build/Paper Voice QA.app/Contents/MacOS/zotero'))
 proc=subprocess.Popen([binary,'-no-remote','-profile',str(profile),'-ZoteroDebugText'],stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 try:
  deadline=time.monotonic()+240
  while time.monotonic()<deadline:
   if (results/'result.json').exists():
    result=json.loads((results/'result.json').read_text(encoding='utf-8'));print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(0 if result['passed'] else 1)
   time.sleep(.5)
  raise TimeoutError('Public update check')
 finally:
  proc.terminate()
  try:proc.wait(timeout=15)
  except subprocess.TimeoutExpired:proc.kill()
