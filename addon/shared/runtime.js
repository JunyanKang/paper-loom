/* Native XPI runtime manager. Bundled manifests pin every byte before execution. */
var LoomRuntime = {
  state:{phase:'idle',message:'尚未检查声音',progress:0},listeners:new Set(),job:null,dead:false,
  async init(owner) {
    this.owner=owner;this.dead=false;
    const prop=k=>{try{return String(Services.sysinfo.getProperty(k));}catch(_){return '';}};
    this.platform=LoomRuntimeCore.platform({os:Services.appinfo.OS,arch:prop('arch'),abi:Services.appinfo.XPCOMABI,version:prop('version')});
    this.root=PathUtils.join(Services.dirsvc.get('UAppData',Components.interfaces.nsIFile).path,'paper-loom');
    this.cache=PathUtils.join(this.root,'downloads');
    await IOUtils.makeDirectory(this.cache,{ignoreExisting:true});
    if(this.platform.supported) {
      const data=await (await Zotero.getMainWindow().fetch(owner.rootURI+'catalogs/runtime-'+this.platform.key+'.json')).json();
      this.catalog=LoomRuntimeCore.manifest(data,this.platform.key);
    }
    const installed=await this.detectInstalled(owner.voice.engineRoot());
    this.emit(installed?'installed':'idle',installed?'已找到离线声音，可试听或检查。':this.platform.supported?'可在这里安装离线声音。':this.platform.reason);
  },
  async detectInstalled(root){
    // A Python executable alone does not mean the separately downloaded voices exist.
    const required=[Zotero.isWin?'python/python.exe':'python/bin/python3','models/kokoro-v1.0.onnx','models/voices-v1.0.bin'];
    const found=await Promise.all(required.map(async name=>{try{const info=await IOUtils.stat(PathUtils.join(root,...name.split('/')));return info.type==='regular'&&info.size>0;}catch(_){return false;}}));
    return found.every(Boolean);
  },
  subscribe(fn){this.listeners.add(fn);fn(this.state);return ()=>this.listeners.delete(fn);},
  emit(phase,message,progress=this.state.progress) {if(['installed','ready'].includes(phase))this.needsRepair=false;else if(['idle','error'].includes(phase))this.needsRepair=true;if(['installed','ready'].includes(phase))this.installed=true;else if(phase==='idle')this.installed=false;this.state={phase,message,progress,updatedAt:this.state.phase===phase&&this.state.message===message?this.state.updatedAt:Date.now()};for(const fn of this.listeners)try{fn(this.state);}catch(e){Zotero.logError(e);}},
  check(job){if(this.dead||job.cancelled)throw Error('下载已取消，已完成的分片会保留。');},
  async hash(path) {
    const stream=Components.classes['@mozilla.org/network/file-input-stream;1'].createInstance(Components.interfaces.nsIFileInputStream);
    stream.init(Zotero.File.pathToFile(path),0x01,0,0);
    try{const hash=Components.classes['@mozilla.org/security/hash;1'].createInstance(Components.interfaces.nsICryptoHash);hash.init(hash.SHA256);if(stream.available())hash.updateFromStream(stream,0xffffffff);return Array.from(hash.finish(false),x=>x.charCodeAt(0).toString(16).padStart(2,'0')).join('');}finally{stream.close();}
  },
  async valid(path,row){try{return (await IOUtils.stat(path)).size===row.bytes&&await this.hash(path)===row.sha256;}catch(_){return false;}},
  cancel(){if(this.job){this.job.cancelled=true;this.cancelDownload?.();this.owner.voice.engineTestProcess?.kill();this.emit('cancelling','正在取消…');}},
  async install() {
    if(this.job)return this.job.promise;
    if(!this.catalog)throw Error(this.platform.reason);
    const job={kind:'install',cancelled:false};this.job=job;
    job.promise=this.run(job).catch(e=>{this.emit(job.cancelled?'cancelled':'error',e.message,0);throw e;}).finally(()=>{if(this.job===job)this.job=null;this.cancelDownload=null;this.emit(this.state.phase,this.state.message);});
    return job.promise;
  },
  async run(job) {
    const catalog=this.catalog,total=catalog.packages.reduce((n,p)=>n+p.bytes,0);
    let completed=0,staging=null;
    try {
      const archives=[];
      for(const pkg of catalog.packages) {
        this.check(job);
        const archive=PathUtils.join(this.cache,pkg.sha256+'.zip');
        if(await this.valid(archive,pkg)){completed+=pkg.bytes;archives.push(archive);continue;}
        for(const part of pkg.parts) {
          this.check(job);const path=PathUtils.join(this.cache,part.sha256+'.part');
          if(!await this.valid(path,part)) {
            const partial=path+'.partial';await IOUtils.remove(partial,{ignoreAbsent:true});
            let lastError;
            for(let attempt=0;attempt<3;attempt++) {
              this.check(job);
              try {
                await Zotero.HTTP.download(part.url,partial,{timeout:180000,cancellerReceiver:cancel=>{this.cancelDownload=cancel;if(job.cancelled)cancel();},onProgress:n=>{if(n>part.bytes){this.cancelDownload?.();return;}this.emit('downloading','正在下载 · '+Math.round((completed+n)/1024**2)+' / '+Math.round(total/1024**2)+' MB',Math.min(.68,(completed+n)/total*.68));}});
                this.check(job);
                if(!await this.valid(partial,part))throw Error('分片校验失败，请重试。');
                await IOUtils.move(partial,path,{noOverwrite:false});lastError=null;break;
              }catch(e){lastError=e;await IOUtils.remove(partial,{ignoreAbsent:true});this.check(job);if(attempt<2)await Zotero.Promise.delay(700*(attempt+1));}
            }
            if(lastError)throw lastError;
          }
          completed+=part.bytes;this.emit('downloading','正在下载 · '+Math.round(completed/1024**2)+' / '+Math.round(total/1024**2)+' MB',completed/total*.68);
        }
        this.emit('verifying','正在校验声音包…',.70);
        const assembling=archive+'.partial';await IOUtils.write(assembling,new Uint8Array());
        for(const part of pkg.parts){this.check(job);const bytes=await IOUtils.read(PathUtils.join(this.cache,part.sha256+'.part'));await IOUtils.write(assembling,bytes,{mode:'append'});await Zotero.Promise.delay(0);}
        if(!await this.valid(assembling,pkg))throw Error('声音包校验失败，未更改现有声音。');
        await IOUtils.move(assembling,archive,{noOverwrite:false});archives.push(archive);
      }
      this.check(job);
      const id=catalog.id+'-'+catalog.platform+'-'+Date.now();
      staging=PathUtils.join(this.root,'engines','.install-'+id);
      await IOUtils.makeDirectory(staging,{ignoreExisting:false});
      const expected=new Map(catalog.files.map(f=>['engine/'+f.name,f])),extracted=new Set();
      for(const archive of archives) {
        const zip=Components.classes['@mozilla.org/libjar/zip-reader;1'].createInstance(Components.interfaces.nsIZipReader);
        try {
          zip.open(Zotero.File.pathToFile(archive));const names=zip.findEntries('*');
          while(names.hasMore()) {
            this.check(job);const name=names.getNext(),entry=zip.getEntry(name);
            if(!LoomRuntimeCore.safePath(name))throw Error('声音包包含不安全的路径。');
            if(entry.isDirectory)continue;
            const row=expected.get(name);
            if(name.startsWith('engine/')&&!row)throw Error('声音包包含未声明文件。');
            if(row&&(entry.realSize!==row.bytes||extracted.has(name)))throw Error('声音文件与清单不一致。');
            if(!row&&!name.startsWith('Licenses/')&&!['VC_redist.x64.exe','Paper Voice License.txt'].includes(name))throw Error('声音包包含未知内容。');
            const path=PathUtils.join(staging,...name.split('/'));await IOUtils.makeDirectory(PathUtils.parent(path),{ignoreExisting:true});
            zip.extract(name,Zotero.File.pathToFile(path));
            if(row){extracted.add(name);if(!await this.valid(path,row))throw Error('声音文件校验失败：'+row.name);}
            if(!Zotero.isWin&&name.startsWith('engine/python/'))await IOUtils.setPermissions(path,(entry.permissions&0o111)?0o755:0o644);
            if(extracted.size%20===0){this.emit('extracting','正在准备引擎与音色…',.72+extracted.size/expected.size*.18);await Zotero.Promise.delay(0);}
          }
        }finally{zip.close();}
      }
      if(extracted.size!==expected.size)throw Error('声音文件不完整。');
      this.check(job);
      // The package supplies dependencies; the matching XPI supplies the worker protocol.
      const worker=await (await Zotero.getMainWindow().fetch(this.owner.rootURI+'shared/worker.py')).text();
      await IOUtils.writeUTF8(PathUtils.join(staging,'engine','worker.py'),worker);
      this.emit('testing','正在实际合成声音，确认可以使用…',.94);
      await this.owner.voice.testEngineFolder(PathUtils.join(staging,'engine'),{cancelled:()=>job.cancelled||this.dead});
      this.check(job);
      const destination=PathUtils.join(this.root,'engines',id);
      await IOUtils.move(staging,destination);staging=null;
      this.check(job);
      await IOUtils.writeJSON(PathUtils.join(destination,'installation.json'),{schema:1,runtime:catalog.id,platform:catalog.platform,installedAt:new Date().toISOString()});
      this.check(job);
      this.owner.voice.set('engineAutoPath',PathUtils.join(destination,'engine'));this.owner.voice.set('enginePath','');this.owner.voice.engineLocationDirty=true;
      Services.prefs.savePrefFile(null);
      this.emit('ready','引擎和声音已安装，可离线听读。',1);this.owner.voice.syncSettings();
      return destination;
    }finally{if(staging)await IOUtils.remove(staging,{recursive:true,ignoreAbsent:true});}
  },
  async diagnose() {
    if(this.job)throw Error('请先等待当前检查或下载完成。');
    const job={kind:'check',cancelled:false};this.job=job;
    job.promise=(async()=>{
      this.emit('testing','正在检查声音…',0);
      await this.owner.voice.testEngineFolder(this.owner.voice.engineRoot(),{cancelled:()=>job.cancelled||this.dead});
      if(job.cancelled||this.dead)throw Error('声音检查已取消');
      this.emit('ready','声音检查通过',1);return true;
    })().catch(e=>{this.emit(job.cancelled?'cancelled':'error',job.cancelled?'声音检查已取消':'声音检查未通过，请修复声音。',0);throw e;})
      .finally(()=>{if(this.job===job)this.job=null;this.emit(this.state.phase,this.state.message);});
    return job.promise;
  },
  async stop(){this.dead=true;this.cancel();await this.job?.promise.catch(()=>{});this.listeners.clear();}
};
