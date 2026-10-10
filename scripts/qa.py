"""Build and run only a dedicated, disposable Zotero profile."""
from pathlib import Path
import json,zipfile,subprocess,sys,os,signal,time
root=Path(__file__).resolve().parents[1]
variant=os.environ.get('PAPER_LOOM_QA_VARIANT','')
if variant and not variant.isalnum():raise SystemExit('Invalid QA variant')
suffix='-'+variant if variant else ''
profile=root/('qa-profile'+suffix);results=root/('test-results'+suffix);library=root/('qa-library'+suffix)
for p in [profile/'extensions',results,library]:p.mkdir(parents=True,exist_ok=True)
if (results/'qa.pid').exists():
 pid=int((results/'qa.pid').read_text(encoding='utf-8'))
 try:
  command=subprocess.check_output(['ps','-p',str(pid),'-o','command='],text=True).strip()
  if str(profile) in command:
   os.kill(pid,signal.SIGTERM)
   for _ in range(50):
    try:os.kill(pid,0)
    except ProcessLookupError:break
    time.sleep(.1)
 except subprocess.CalledProcessError:pass
if '--fresh' in sys.argv:
 archive=root/('qa-archive-'+str(int(time.time())));archive.mkdir()
 for p in [profile,library]:
  if p.exists():p.rename(archive/p.name)
 for p in [profile/'extensions',library]:p.mkdir(parents=True,exist_ok=True)
prefs={'extensions.zotero.dataDir':str(library),'extensions.zotero.useDataDir':True,'extensions.zotero.firstRun2':False,'extensions.zotero.firstRunGuidance':False,'extensions.autoDisableScopes':0,'extensions.enabledScopes':15,'extensions.zotero.httpServer.enabled':False,'app.update.auto':False,'extensions.update.enabled':False}
cache_backup=root/('qa-cache-'+str(time.time_ns()));cache_backup.mkdir()
for name in ['extensions.json','addonStartup.json.lz4','startupCache']:
 p=profile/name
 if p.exists():p.rename(cache_backup/name)
if os.environ.get('PAPER_LOOM_QA_ENGINE'):prefs['extensions.paperLoom.voice.engineAutoPath']=os.environ['PAPER_LOOM_QA_ENGINE']
(profile/'user.js').write_text(''.join(f'user_pref({json.dumps(k)}, {json.dumps(v)});\n' for k,v in prefs.items()),encoding='utf-8')
subprocess.run([sys.executable,str(root/'scripts/build.py')],check=True)
harness=r"""
(async()=>{
 const base=__ROOT__,resultsPath=__RESULTS__,L=PaperLoom;
 await IOUtils.writeUTF8(PathUtils.join(resultsPath,'ready.json'),JSON.stringify({version:Zotero.version,profile:Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path,started:L.started,platform:LoomRuntime.platform}));
 let busy=false,last='';
 L.qaTimer=Zotero.getMainWindow().setInterval(async()=>{
  if(busy)return;const path=PathUtils.join(resultsPath,'command.js');if(!await IOUtils.exists(path))return;
  const code=await IOUtils.readUTF8(path);if(code===last)return;last=code;busy=true;
  try{const value=await new Function('L','Zotero','IOUtils','PathUtils','Services','ChromeUtils','Components','Runtime','return (async()=>{'+code+'})()')(L,Zotero,IOUtils,PathUtils,Services,ChromeUtils,Components,LoomRuntime);await IOUtils.writeUTF8(PathUtils.join(resultsPath,'result.json'),JSON.stringify({ok:true,value},null,2));}
  catch(e){await IOUtils.writeUTF8(PathUtils.join(resultsPath,'result.json'),JSON.stringify({ok:false,error:String(e),stack:e.stack},null,2));}
  finally{busy=false;}
 },300);
})();""".replace('__ROOT__',json.dumps(str(root))).replace('__RESULTS__',json.dumps(str(results)))
with zipfile.ZipFile(profile/'extensions/paper-loom@local.research.xpi','w',zipfile.ZIP_DEFLATED) as z:
 for p in (root/'addon').rglob('*'):
  if not p.is_file() or p.name=='.DS_Store':continue
  data=p.read_bytes()
  if p.relative_to(root/'addon').as_posix()=='bootstrap.js':
   data=data.decode()+'\nvar actualStartup=startup;startup=async function(data){try{await actualStartup(data);Services.scriptloader.loadSubScript(data.rootURI+"qa-harness.js",LoomScope);}catch(e){await IOUtils.writeUTF8('+json.dumps(str(results/'startup-error.txt'))+',String(e)+"\\n"+e.stack);}};'
  z.writestr(p.relative_to(root/'addon').as_posix(),data)
 z.writestr('qa-harness.js',harness)
for name in ['ready.json','startup-error.txt','command.js','result.json']:(results/name).unlink(missing_ok=True)
if '--build-only' not in sys.argv:
 log=open(results/'zotero.log','w')
 proc=subprocess.Popen([os.environ.get('PAPER_LOOM_QA_BINARY',str(root.parent/'.build/Paper Voice QA.app/Contents/MacOS/zotero')),'-no-remote','-profile',str(profile),'-ZoteroDebugText'],stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
 (results/'qa.pid').write_text(str(proc.pid));print('Isolated QA PID:',proc.pid)
