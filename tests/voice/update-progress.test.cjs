process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const prefs=new Map([['availableUpdateVersion','2.0.0']]),ctx=vm.createContext({Services:{vc:{compare:(a,b)=>a.localeCompare(b,undefined,{numeric:true})}},PaperVoiceUI:{visibility:(el,show)=>el.hidden=!show}});
 vm.runInContext(fs.readFileSync('addon/voice/updater.js','utf8'),ctx);
 const node=()=>({dataset:{},style:{},attrs:{},textContent:'',hidden:false,setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}});
 const panels=Array.from({length:2},()=>{const nodes=new Map();return {root:node(),find:k=>{if(!nodes.has(k))nodes.set(k,node());return nodes.get(k);},action:k=>{if(!nodes.has(k))nodes.set(k,node());return nodes.get(k);}};});
 let listener,starts=0,removes=0;
 const install={version:'2.0.0',progress:0,maxProgress:-1,addListener:l=>listener=l,removeListener:()=>removes++,install:async()=>{starts++;}};
 const p=ctx.PaperVoiceUpdater;Object.assign(p,{version:'1.0.0',updateState:'available',updateInstall:install,get:(k,d)=>prefs.has(k)?prefs.get(k):d,set:(k,v)=>prefs.set(k,v),t:x=>x,livePanels:()=>panels});
 return {p,panels,install,prefs,get listener(){return listener;},get starts(){return starts;},get removes(){return removes;}};
}
test('both panels show real download progress then verification and installation',async()=>{
 const s=setup();await s.p.installUpdate();assert.equal(s.p.updatePhase,'connect');await s.p.installUpdate();assert.equal(s.starts,1);
 s.listener.onDownloadStarted();for(const ui of s.panels){assert.equal(ui.find('updateFeedback').hidden,false);assert.equal(ui.find('updateNoticeActions').hidden,true);assert.equal(ui.find('updateMeter').attrs['aria-valuenow'],undefined);assert.equal(ui.action('updateNotice').dataset.busy,'true');}
 s.install.maxProgress=1000;s.install.progress=378;s.listener.onDownloadProgress();assert.equal(s.p.updateProgress,37);
 for(const ui of s.panels){assert.equal(ui.find('updatePercent').textContent,'37%');assert.equal(ui.find('updateFill').style.width,'37%');assert.equal(ui.find('updateMeter').attrs['aria-valuenow'],'37');}
 s.listener.onDownloadEnded();assert.equal(s.p.updatePhase,'verify');assert.equal(s.p.updateProgress,null);assert.equal(s.panels[0].find('updatePercent').textContent,'');
 s.listener.onInstallStarted();assert.equal(s.panels[0].find('updatePhase').textContent,'正在安装…');
 s.listener.onInstallEnded();assert.equal(s.p.updateState,'current');assert.equal(s.prefs.get('availableUpdateVersion'),'');assert.equal(s.panels[0].action('updateNotice').hidden,true);assert.equal(s.removes,1);
 s.listener.onDownloadProgress();s.listener.onDownloadFailed();assert.equal(s.p.updateState,'current');assert.equal(s.removes,1);
});
test('unknown lengths stay indeterminate, invalid totals cannot display fabricated percentages',async()=>{
 const s=setup();await s.p.installUpdate();
 for(const [progress,total,result] of [[5,0,null],[20,-1,null],[2,NaN,null],[-1,100,null],[NaN,100,null],[0,100,0],[105,100,100]]){s.install.progress=progress;s.install.maxProgress=total;s.listener.onDownloadProgress();assert.equal(s.p.updateProgress,result);assert.equal(s.panels[0].find('updateMeter').dataset.indeterminate,String(result===null));}
});
test('failed download restores actions and visible explanation without clearing the available version',async()=>{
 const s=setup();await s.p.installUpdate();s.listener.onDownloadFailed();s.listener.onInstallFailed();
 assert.equal(s.removes,1);assert.equal(s.p.updateState,'error');assert.equal(s.p.updateInstall,null);assert.equal(s.prefs.get('availableUpdateVersion'),'2.0.0');
 for(const ui of s.panels){assert.equal(ui.find('updateNoticeActions').hidden,false);assert.equal(ui.find('updateFeedback').hidden,false);assert.match(ui.find('updatePhase').textContent,/原版本保留/);assert.equal(ui.find('updateMeter').hidden,true);assert.equal(ui.action('installNotice').disabled,false);assert.equal(ui.action('updateNotice').dataset.busy,'false');}
});
