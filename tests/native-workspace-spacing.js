if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const Q=L.referencesScope,U=Q.CiteLensUI,wait=ms=>Zotero.Promise.delay(ms),r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID),checks=[];
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
try{const d=r._iframeWindow.document,w=d.defaultView;Zotero.getMainWindow().Zotero_Tabs.select(r._tabID||r.tabID);await L.showSettings(r,d);await U.pageScopes.get(d)?.queue;await wait(300);const metrics={};
for(const id of ['references','network']){
 d.querySelector('.cl-settings [data-loom-page='+id+']').click();await U.pageScopes.get(d)?.queue;await wait(500);
 const f=d.querySelector(id==='references'?'.cl-root':'.pn-map-window'),control=f.querySelector(id==='references'?'.cl-tabs':'.pn-map-search input'),next=f.querySelector(id==='references'?'.cl-search':'.pn-map-stage'),a=f.getBoundingClientRect(),b=control.getBoundingClientRect(),c=next.getBoundingClientRect();
 metrics[id]={top:b.top-a.top,height:b.height,gap:c.top-b.bottom};
 check(id+' visible controls fit their workspace',b.width>100&&b.right<=a.right&&c.bottom<=a.bottom);
 const canvas=d.createElement('canvas');canvas.width=Math.ceil(a.width*2);canvas.height=240;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.drawWindow(w,a.x,a.y,a.width,120,'#fff');const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path,out=PathUtils.join(PathUtils.parent(profile),PathUtils.filename(profile).replace('qa-profile','test-results'));await IOUtils.write(PathUtils.join(out,'header-'+id+'.png'),Uint8Array.from(w.atob(canvas.toDataURL().split(',')[1]),x=>x.charCodeAt(0)));
}
for(const [key,expected] of Object.entries({top:20,height:34,gap:10})){check(key+' matches across list and network',Math.abs(metrics.references[key]-metrics.network[key])<.1,metrics);check(key+' follows shared spacing',Math.abs(metrics.references[key]-expected)<.1,metrics);}
return {passed:true,checks};}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}
