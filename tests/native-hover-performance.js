if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const V=L.voice,U=L.referencesScope.CiteLensUI,wait=ms=>Zotero.Promise.delay(ms),checks=[],check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
let r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID);if(!r){const items=await Zotero.Items.getAll(Zotero.Libraries.userLibraryID),a=items.find(i=>i.isAttachment()&&i.attachmentContentType==='application/pdf');r=await Zotero.Reader.open(a.id);await r._initPromise;await wait(1000);}
Zotero.getMainWindow().Zotero_Tabs.select(r._tabID||r.tabID);
const d=r._iframeWindow.document,w=d.defaultView,ui=V.ensurePanel(r),orb=ui.action('orb'),M=L.voiceScope.PaperVoiceDockMotion,originalMesh=M.mesh,meshTimes=[],gaps=[];let warmups=0;const oldWarm=V.scheduleWarmup;V.scheduleWarmup=()=>{warmups++;};
M.mesh=function(...args){const t=w.performance.now();try{return originalMesh.apply(this,args);}finally{meshTimes.push(w.performance.now()-t);}};
let measuring=false,last=w.performance.now();const timer=w.setInterval(()=>{const now=w.performance.now();if(measuring)gaps.push(now-last);last=now;},16);
const settle=async()=>{await U.pageScopes.get(d)?.queue;for(let i=0;i<100&&d.querySelector('[data-dock-motion]');i++)await wait(20);};
const event=(node,type,extra={})=>node.dispatchEvent(new node.ownerDocument.defaultView.PointerEvent(type,{bubbles:true,pointerType:'mouse',...extra}));
const memory=async()=>{Components.utils.forceGC();Components.utils.forceCC();await wait(100);const m=Components.classes['@mozilla.org/memory-reporter-manager;1'].getService(Components.interfaces.nsIMemoryReporterManager);return {resident:m.resident,explicit:m.explicit};};
try{
 await L.showHome(r,d);await settle();const f=d.querySelector('.cl-settings');await f._plReady;
 for(const v of U.livePages(d))v.snap(false);
 const baseline=await memory();
 event(d.body,'pointerdown');event(orb,'pointerenter');event(orb,'pointerover');await wait(70);
 const interactive=!f.inert&&w.getComputedStyle(f).pointerEvents!=='none'&&w.getComputedStyle(f).visibility!=='hidden';check('panel accepts entry during opening after PDF click',interactive,{inert:f.inert,motion:f.dataset.dockMotion});
 const inside=f.querySelector('iframe')?.contentDocument;
 event(orb,'pointerout',{relatedTarget:null});event(inside?.body||f,'pointerover');await wait(20);
 // Parent frame boundary event can arrive after its child's pointerover.
 event(d.body,'pointerout',{relatedTarget:null});event(inside?.body||f,'pointermove');await wait(350);await settle();check('child-frame hover survives a late parent pointerout',!f.hidden);
 check('logo does not prewarm speech engine',warmups===0,{warmups});
 const cycles=[];for(let i=0;i<40;i++){last=w.performance.now();measuring=true;const t=w.performance.now();await f._clPage.activate();await settle();await f._clPage.dismiss();await settle();cycles.push(w.performance.now()-t);measuring=false;if(i===9||i===39)cycles.push({memory:await memory()});}
 const after=await memory();check('workspace motion does not allocate screenshot meshes',meshTimes.length===0,{count:meshTimes.length,maxMS:Math.max(0,...meshTimes)});check('all transient motion canvases released',!d.querySelector('.pv-dock-motion'));
 return {passed:checks.every(x=>x.ok),checks,baseline,after,cycles,meshTimes,heartbeat:{maxMS:Math.max(...gaps),over50:gaps.filter(n=>n>50).length,samples:gaps.length},pages:[...U.livePages(d)].length};
}finally{M.mesh=originalMesh;V.scheduleWarmup=oldWarm;w.clearInterval(timer);}
