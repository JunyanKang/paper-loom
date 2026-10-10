const loomQAPath=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path);if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
if(!Zotero.Reader._readers.some(r=>r._tabID||r.tabID)){const a=await Zotero.Attachments.importFromFile({file:PathUtils.join(loomQAPath,'docs','demo','reading-demo.pdf')});const reader=await Zotero.Reader.open(a.id);await reader._initPromise;for(let i=0;i<100&&!L.voice.panels.has(reader);i++)await Zotero.Promise.delay(100);await Zotero.Promise.delay(800);}
const wait=ms=>Zotero.Promise.delay(ms),V=L.voice,U=L.referencesScope.CiteLensUI,r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID),doc=r._iframeWindow.document,ui=V.ensurePanel(r),checks=[],check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
const settle=async()=>{await U.pageScopes.get(doc)?.queue;await ui.waitMotion();for(let i=0;i<80&&doc.querySelector('[data-dock-motion]');i++)await wait(50);await wait(200);};
Zotero.getMainWindow().Zotero_Tabs.select(r._tabID||r.tabID);await wait(250);
try{
 for(const v of [...U.livePages(doc)])v.snap(false);V.dismissPanel(r);await settle();ui.action('orb').click();await settle();
 const main=ui.panel;check('mascot opens listening directly without a launcher window',!main.hidden&&!doc.querySelector('.pl-home'));check('main header contains all four icon destinations',main.querySelectorAll('.pv-header .pl-main-actions [data-loom-page]').length===4);
 check('back subtitle close and duplicate settings are absent',!main.querySelector('.pl-home-back')&&!ui.action('close').getClientRects().length&&!ui.action('settings').getClientRects().length&&!main.querySelector('.pv-brand>span').getClientRects().length);
 const header=main.querySelector('.pv-header').getBoundingClientRect();check('icon group fits on the title row',Array.from(main.querySelectorAll('.pl-main-actions button')).every(b=>{const r=b.getBoundingClientRect();return r.y>=header.y&&r.bottom<=header.bottom+1&&r.right<=header.right+1;}));
 for(const id of ['references','network','settings']){
  main.querySelector('[data-loom-page='+id+']').click();await settle();const view=id==='references'?doc.querySelector('.cl-root'):id==='network'?doc.querySelector('.pn-map-window'):doc.querySelector('.cl-settings');
  check(id+' opens without global tabs or icon groups',!view.hidden&&!view.querySelector('.pl-navigation,.pl-main-actions'));const back=view.querySelector('.pl-home-back');check(id+' has one return control',!!back&&view.querySelectorAll('.pl-home-back').length===1);
  const globals=[...view.querySelectorAll(':scope>header [data-icon=settings],:scope>header [data-network-entry],:scope>header [data-list-entry]')];check(id+' has no duplicate global header shortcuts',globals.every(e=>!e.getClientRects().length));
  back.click();await settle();check(id+' returns listening',!main.hidden);check(id+' collapses after listening opens',view.hidden);
 }
 ui.action('orb').click();await settle();check('mascot collapses main panel',main.hidden);ui.action('orb').click();await settle();check('next click opens listening again',!main.hidden);
 main.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await settle();check('Escape collapses main panel',main.hidden);ui.action('orb').click();await settle();
 const out=PathUtils.join(PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),PathUtils.filename(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path).replace('qa-profile','test-results'));
 const capture=async(name)=>{const w=doc.defaultView,c=doc.createElement('canvas');c.width=w.innerWidth*2;c.height=w.innerHeight*2;const ctx=c.getContext('2d');ctx.scale(2,2);ctx.drawWindow(w,0,0,w.innerWidth,w.innerHeight,'#f7f7f2');await IOUtils.write(PathUtils.join(out,name+'.png'),Uint8Array.from(w.atob(c.toDataURL().split(',')[1]),v=>v.charCodeAt(0)));};
 await capture('listening-reader');return {passed:true,version:Zotero.version,checks};
}catch(e){return {passed:false,checks,error:String(e),stack:e.stack};}
