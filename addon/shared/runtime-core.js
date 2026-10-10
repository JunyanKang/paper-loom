/* Pure policy: platform matching and package validation. No I/O. */
var LoomRuntimeCore = {
  platform({os='',arch='',abi='',version=''}) {
    const cpu=(arch+' '+abi).toLowerCase(), arm=/aarch64|arm64/.test(cpu), x64=/x86_64|x64|amd64/.test(cpu);
    if(/darwin|mac/i.test(os)) {
      if(arm) {
        // Gecko reports the Darwin kernel version; Darwin 23 corresponds to macOS 14.
        const kernel=parseInt(version,10);
        if(Number.isFinite(kernel)&&kernel<23)return {supported:false,label:'macOS 版本过低',reason:'离线声音需要 macOS 14 或更新版本。'};
        return {supported:true,key:'macOS-arm64',label:'macOS · Apple Silicon'};
      }
      return {supported:false,label:'macOS · Intel',reason:'暂未提供 Intel Mac 声音包；可导入经过验证的兼容声音文件夹。'};
    }
    if(/win/i.test(os))return !arm&&x64?{supported:true,key:'Windows-x64',label:'Windows · Intel / AMD x64'}:{supported:false,label:arm?'Windows · ARM64':'Windows · 未识别架构',reason:'暂未提供此架构的声音包；不会自动下载不匹配的版本。'};
    return {supported:false,label:os||'未识别系统',reason:'暂未提供此系统的声音包。文献、翻译和研究网络仍可使用。'};
  },
  safePath(name) {
    if(typeof name!=='string'||!name||name.length>4096||/[\0-\x1f\\:]/.test(name)||name.startsWith('/'))return false;
    return name.split('/').filter((_,i,a)=>i<a.length-1||a[i]).every(p=>p&&p!=='.'&&p!=='..'&&!/[. ]$/.test(p)&&!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p));
  },
  manifest(value,key) {
    if(value?.schema!==1||value.platform!==key||!/^[\w.-]+$/.test(value.id)||!Array.isArray(value.packages)||value.packages.length!==2||!Array.isArray(value.files)||!value.files.length)throw Error('声音目录格式无效');
    const seen=new Set(),sha=v=>/^[a-f0-9]{64}$/.test(v),size=v=>Number.isSafeInteger(v)&&v>=0&&v<3*1024**3;
    for(const p of value.packages) {
      if(!this.safePath(p.name)||p.name.includes('/')||!sha(p.sha256)||!size(p.bytes)||!Array.isArray(p.parts)||!p.parts.length)throw Error('声音包清单无效');
      let total=0;
      for(const part of p.parts) {
        if(!this.safePath(part.name)||part.name.includes('/')||!sha(part.sha256)||!size(part.bytes)||part.bytes>40*1024**2||!/^https:\/\/github\.com\/JunyanKang\/paper-loom\/releases\/download\/voices-[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(part.url)||seen.has(part.name))throw Error('声音下载地址或分片无效');
        seen.add(part.name);total+=part.bytes;
      }
      if(total!==p.bytes)throw Error('声音包大小不一致');
    }
    seen.clear();
    for(const f of value.files) {
      if(!this.safePath(f.name)||!sha(f.sha256)||!size(f.bytes)||f.link||seen.has(f.name))throw Error('声音文件清单无效');
      seen.add(f.name);
    }
    for(const name of ['worker.py','models/kokoro-v1.0.onnx','models/voices-v1.0.bin',key==='Windows-x64'?'python/python.exe':'python/bin/python3'])if(!seen.has(name))throw Error('声音包缺少必需文件');
    return value;
  }
};
if(typeof module!=='undefined')module.exports=LoomRuntimeCore;
