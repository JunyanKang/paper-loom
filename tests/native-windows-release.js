const checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
check('Windows x64 catalog selected',Runtime.platform.key==='Windows-x64',Runtime.platform);
Runtime.root=PathUtils.join(PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),'runtime-qa');Runtime.cache=PathUtils.join(Runtime.root,'downloads');await IOUtils.makeDirectory(Runtime.cache,{ignoreExisting:true});
check('all resource URLs belong to Paper Loom',Runtime.catalog.packages.every(p=>p.parts.every(v=>v.url.startsWith('https://github.com/JunyanKang/paper-loom/releases/download/'))));
const destination=await Runtime.install();check('download, extraction, verification and native synthesis',Runtime.state.phase==='ready',{destination});
await L.voice.ensureWorker();check('worker exposes 14 voices',L.voice.workerVoices.length===14);
for(const [voice,text] of [['af_heart','The retina detects light.'],['zf_xiaobei','视网膜将光线转化为神经信号。'],['jf_alpha','網膜は光を神経信号に変換します。'],['ff_siwis','La rétine transforme la lumière en signaux nerveux.']]){
 const response=await L.voice.requestSpeech(text,voice,1);check('synthesis '+voice,!!response.audio&&response.duration>0,{duration:response.duration});
}
const w=Zotero.getMainWindow(),entry=w.document.querySelector('.pl-library-entry'),search=w.document.getElementById('zotero-tb-search');check('left library launcher',entry.getBoundingClientRect().right<search.getBoundingClientRect().left);
return {passed:true,zotero:Zotero.version,checks};
