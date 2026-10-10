const V=L.voice,U=L.referencesScope.CiteLensUI,w=Zotero.getMainWindow(),wait=ms=>Zotero.Promise.delay(ms),r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID);if(!r)throw Error('Open QA PDF');w.Zotero_Tabs.select(r._tabID||r.tabID);
const doc=r._iframeWindow.document,win=doc.defaultView,ui=V.ensurePanel(r),checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const previous=V.get('companionInteractions',true),reduced=Services.prefs.prefHasUserValue('ui.prefersReducedMotion')?Services.prefs.getIntPref('ui.prefersReducedMotion'):null;
Services.prefs.setIntPref('ui.prefersReducedMotion',0);V.set('companionInteractions',true);
const settle=async()=>{await U.pageScopes.get(doc)?.queue;await ui.waitMotion();for(let i=0;i<100&&doc.querySelector('[data-dock-motion],[data-workspace-motion]');i++)await wait(30);await wait(120);};
const panel=id=>id==='listening'?ui.panel:doc.querySelector(id==='references'?'.cl-root':id==='settings'?'.cl-settings':'.pn-map-window');
const open=async id=>{L.showHome(r,doc);await settle();if(id!=='listening'){ui.panel.querySelector('[data-loom-page='+id+']').click();await settle();}if(id==='settings')await panel(id)._plReady;return panel(id);};
const sample=async(ms=1400)=>{const frames=[],renderers=new Set();for(let i=0;i<ms/25;i++){const sprite=ui.find('mascotInteraction');if(sprite.dataset.gesture==='dock-present')frames.push(Number(sprite.dataset.frame));for(const p of doc.querySelectorAll('[data-dock-renderer]'))renderers.add(p.dataset.dockRenderer);await wait(25);}return {frames,renderers:[...renderers]};};
try{
 await wait(250);for(const view of [...U.livePages(doc)])view.snap(false);
 ui.action('orb').click();const opening=await sample();await settle();check('opening mascot performs multiple registered poses',new Set(opening.frames).size>=3,opening);check('listening primary is an accessible headphones-only control',ui.action('primary').querySelector('img').src.endsWith('/headphones.svg')&&!!ui.action('primary').getAttribute('aria-label')&&win.getComputedStyle(ui.find('primaryLabel')).clipPath!=='none');
 for(const from of ['listening','references','network','settings']){
  await open(from);
  for(const to of ['listening','references','network','settings'].filter(x=>x!==from)){
   await open(from);let docked=false,switched=false;const watch=new win.MutationObserver(records=>{for(const record of records){if(record.attributeName==='data-dock-motion'&&record.target.dataset.dockMotion)docked=true;if(record.attributeName==='data-workspace-motion'&&record.target.dataset.workspaceMotion)switched=true;}});watch.observe(doc.documentElement,{subtree:true,attributes:true,attributeFilter:['data-dock-motion','data-workspace-motion']});
   panel(from).querySelector('[data-loom-page='+to+']').click();await settle();watch.disconnect();check(from+' to '+to+' switches directly without returning to mascot',!docked&&switched&&!panel(to).hidden&&panel(from).hidden,{docked,switched});
  }
 }
 const pdf=r._internalReader._primaryView._iframeWindow.document;
 for(const id of ['listening','references','network','settings']){
  for(const [name,surface] of [['reader',doc],['PDF',pdf],['Zotero',w.document]]){
   const frame=await open(id);surface.documentElement.dispatchEvent(new surface.defaultView.MouseEvent('pointerdown',{bubbles:true}));const closing=await sample();await settle();check(id+' closes on '+name+' click with shared dock renderer',frame.hidden&&closing.renderers.length>0&&closing.renderers.every(x=>opening.renderers.includes(x)),closing);check(id+' close restores mascot folding poses',new Set(closing.frames).size>=3,closing.frames);
  }
 }
 await open('settings');const embedded=panel('settings').querySelector('iframe').contentDocument;embedded.body.dispatchEvent(new embedded.defaultView.MouseEvent('pointerdown',{bubbles:true}));await wait(100);check('settings iframe interaction does not dismiss its own workspace',!panel('settings').hidden);
 ui.action('orb').click();await settle();check('mascot click collapses current workspace',panel('settings')?.hidden||!panel('settings')?.isConnected);
 return {passed:true,version:Zotero.version,checks};
}catch(e){return {passed:false,checks,error:String(e),stack:e.stack};}finally{V.set('companionInteractions',previous);if(reduced===null)Services.prefs.clearUserPref('ui.prefersReducedMotion');else Services.prefs.setIntPref('ui.prefersReducedMotion',reduced);}
