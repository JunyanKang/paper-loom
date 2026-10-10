from pathlib import Path
import json,time,sys,uuid,shutil,os
root=Path(__file__).resolve().parents[1]
variant=os.environ.get('PAPER_LOOM_QA_VARIANT','')
if variant and not variant.isalnum():raise SystemExit('Invalid QA variant')
suffix='-'+variant if variant else ''
results=root/('test-results'+suffix);result=results/'result.json'
ready=json.loads((results/'ready.json').read_text(encoding='utf-8'))
if Path(ready['profile'])!=root/('qa-profile'+suffix):raise SystemExit('Refusing non-QA profile')
before=result.stat().st_mtime_ns if result.exists() else 0
name=sys.argv[1];source=root/'tests'/name
(results/'command.js').write_text(source.read_text(encoding='utf-8')+'\n// '+str(uuid.uuid4())+'\n',encoding='utf-8')
until=time.monotonic()+float(sys.argv[2] if len(sys.argv)>2 else 120)
while time.monotonic()<until:
 if result.exists() and result.stat().st_mtime_ns!=before:
  try:data=json.loads(result.read_text(encoding='utf-8'))
  except json.JSONDecodeError:time.sleep(.1);continue
  shutil.copy2(result,results/(source.stem+'.json'))
  print(json.dumps(data,ensure_ascii=False,indent=2))
  raise SystemExit(0 if data.get('ok') and data.get('value',{}).get('passed',True) else 1)
 time.sleep(.2)
raise SystemExit('Native test timed out')
