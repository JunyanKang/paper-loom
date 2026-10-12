"""Measure a local speech worker with fixed public sentences; never record input/audio."""
from pathlib import Path
import argparse,json,subprocess,time,threading,queue,base64,io,wave

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--engine',required=True,type=Path)
parser.add_argument('--python',required=True,type=Path)
parser.add_argument('--worker',type=Path,default=Path(__file__).resolve().parents[1]/'addon/shared/worker.py')
parser.add_argument('--output',required=True,type=Path)
args=parser.parse_args()
samples=[('af_heart','The retina transforms light into signals that allow us to see the world.'),('zf_xiaobei','视网膜将光信号转换为神经信号，使我们能够看见周围的世界。'),('jf_alpha','網膜は光を神経信号に変え、私たちが世界を見ることを可能にします。'),('ff_siwis','La rétine transforme la lumière en signaux qui nous permettent de voir le monde.')]
started=time.monotonic()
proc=subprocess.Popen([str(args.python),'-E','-s','-B',str(args.worker),str(args.engine)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True)
responses=queue.Queue()
def read():
    for line in proc.stdout:responses.put(line)
    responses.put(None)
threading.Thread(target=read,daemon=True).start()
def receive():
    line=responses.get(timeout=90)
    if line is None:raise RuntimeError('Worker exited without a response')
    return json.loads(line)
try:
    ready=receive()
    if not ready.get('ready'):raise RuntimeError('Worker did not become ready')
    result={'startup_seconds':time.monotonic()-started,'startup_metrics':ready.get('timings'),'samples':[]}
    for voice,text in samples:
        for repeat in range(2):
            tick=time.monotonic();request_id=len(result['samples'])
            proc.stdin.write(json.dumps({'id':request_id,'voice':voice,'rate':1,'text':text})+'\n');proc.stdin.flush()
            response=receive();elapsed=time.monotonic()-tick
            if not response.get('ok') or response.get('id')!=request_id:raise RuntimeError('Speech request failed')
            audio=base64.b64decode(response['audio'],validate=True)
            with wave.open(io.BytesIO(audio)) as wav:
                duration=wav.getnframes()/wav.getframerate()
                assert wav.getnchannels()==1 and wav.getsampwidth()==2 and duration>0
                assert abs(duration-response['duration'])<.002
            result['samples'].append({'voice':voice,'warm':bool(repeat),'roundtrip_seconds':elapsed,'audio_seconds':duration,'timings':response.get('timings')})
    proc.stdin.close();proc.wait(timeout=15)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
finally:
    if proc.poll() is None:proc.kill();proc.wait()
