"""Exercise the actual Windows XPI runtime installer in an isolated Zotero profile."""
from pathlib import Path
import os,subprocess,sys,time,json,urllib.request
if sys.platform!='win32':raise SystemExit('Windows only')
r=Path(__file__).resolve().parents[1];build=r/'.build/windows';build.mkdir(parents=True,exist_ok=True)
setup=build/'Zotero-setup.exe'
url='https://download.zotero.org/client/beta/11.0-beta.1%2Bb0db83d9d/Zotero-11.0-beta.1%2Bb0db83d9d_x64_setup.exe'
urllib.request.urlretrieve(url,setup)
install=build/'Zotero';ini=build/'install.ini';ini.write_text('[Install]\nInstallDirectoryPath='+str(install)+'\nDesktopShortcut=false\nQuickLaunchShortcut=false\nStartMenuShortcuts=false\n',encoding='utf-16')
subprocess.run([str(setup),'/S','/INI='+str(ini)],check=True,timeout=240)
binary=install/'zotero.exe';assert binary.exists(),binary
os.environ['PAPER_LOOM_QA_VARIANT']='windows';os.environ['PYTHONUTF8']='1'
subprocess.run([sys.executable,str(r/'scripts/qa.py'),'--build-only'],check=True)
results=r/'test-results-windows';profile=r/'qa-profile-windows'
with (results/'zotero.log').open('w',encoding='utf-8') as log:
 proc=subprocess.Popen([str(binary),'-no-remote','-profile',str(profile),'-wait-for-browser','-ZoteroDebugText'],stdout=log,stderr=subprocess.STDOUT)
 try:
  deadline=time.monotonic()+180
  while time.monotonic()<deadline:
   if (results/'startup-error.txt').exists():raise RuntimeError((results/'startup-error.txt').read_text(encoding='utf-8'))
   if (results/'ready.json').exists():break
   if proc.poll() is not None:raise RuntimeError('Zotero exited: '+str(proc.returncode))
   time.sleep(1)
  else:raise TimeoutError('Zotero startup')
  subprocess.run([sys.executable,str(r/'scripts/run_native.py'),'native-windows-release.js','1500'],check=True,timeout=1520)
  for name in ['native-credentials.js','native-window-coexistence.js']:
   subprocess.run([sys.executable,str(r/'scripts/run_native.py'),name,'180'],check=True,timeout=200)
 finally:
  # Only the isolated CI process tree.
  subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],check=False,stdout=subprocess.DEVNULL)
