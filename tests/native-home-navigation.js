const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;if(!/qa-profile/.test(profile))throw Error('QA only');
const wait=ms=>Zotero.Promise.delay(ms),V=L.voice,U=L.referencesScope.CiteLensUI;
if(!Zotero.Reader._readers.some(r=>r._tabID||r.tabID)){const a=await Zotero.Attachments.importFromFile({file:PathUtils.join(PathUtils.parent(profile),'docs','demo','reading-demo.pdf')});const reader=await Zotero.Reader.open(a.id);await reader._initPromise;for(let i=0;i<100&&!V.panels.has(reader);i++)await wait(100);}
const r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID),doc=r._iframeWindow.document,ui=V.ensurePanel(r),checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const settle=async()=>{await U.pageScopes.get(doc)?.queue;await ui.waitMotion();for(let i=0;i<80&&doc.querySelector('[data-dock-motion]');i++)await wait(50);await wait(100);};
const selectors={settings:'.cl-settings',references:'.cl-root',network:'.pn-map-window'};
Zotero.getMainWindow().Zotero_Tabs.select(r._tabID||r.tabID);await wait(250);
try{
 for(const v of [...U.livePages(doc)])v.snap(false);ui.action('orb').click();await settle();let frame=doc.querySelector(selectors.settings);
 check('mascot opens settings and no listening window',!frame.hidden&&ui.panel.hidden&&!doc.querySelector('.pl-home'));
 let anchor=null;
 for(const id of ['references','network','settings']){
  frame.querySelector('[data-loom-page='+id+']').click();await settle();frame=doc.querySelector(selectors[id]);const nav=frame.querySelector('.pl-main-actions'),b=nav.getBoundingClientRect();
  check(id+' has three destinations',!frame.hidden&&nav.querySelectorAll('[data-loom-page]').length===3);
  check(id+' marks current page',nav.querySelector('[aria-current=page]')?.dataset.loomPage===id);
  if(anchor)check(id+' bottom navigation stays anchored',Math.abs(b.right-anchor.right)<1&&Math.abs(b.bottom-anchor.bottom)<1,{current:b.toJSON(),anchor});else anchor=b.toJSON();
  check(id+' finished with opaque interactive content',!frame.inert&&doc.defaultView.getComputedStyle(frame).opacity==='1'&&!frame.dataset.workspaceMotion);
 }
 frame.querySelector('[data-loom-page=references]').click();await settle();const retained=doc.querySelector('.cl-root'),search=retained.querySelector('.cl-search'),prior=search.value;search.value='retained search';search.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));
 retained.querySelector('[data-loom-page=network]').click();retained.querySelector('[data-loom-page=settings]').click();await settle();frame=doc.querySelector('.cl-settings');
 check('rapid switching leaves only the latest page visible',[...U.livePages(doc)].filter(v=>!v.container.hidden).length===1&&!frame.hidden);
 frame.querySelector('[data-loom-page=references]').click();await settle();check('reference state retained',doc.querySelector('.cl-root')===retained&&search.value==='retained search');search.value=prior;search.dispatchEvent(new doc.defaultView.Event('input',{bubbles:true}));
 ui.action('orb').click();await settle();check('mascot closes the active workspace',[...U.livePages(doc)].every(v=>v.container.hidden));
 ui.action('orb').click();await settle();check('reopening returns to settings',!doc.querySelector('.cl-settings').hidden);
 doc.querySelector('.cl-settings').dispatchEvent(new doc.defaultView.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await settle();check('Escape closes settings',[...U.livePages(doc)].every(v=>v.container.hidden));
 return {passed:true,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}
