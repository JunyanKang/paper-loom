const win=Zotero.getMainWindow(),doc=win.document,U=L.referencesScope.CiteLensUI;
win.Zotero_Tabs.select('zotero-pane');
await L.showHome(null,doc);const ui=L.voice.ensurePanel(L.workspaceReaders.get(doc)),checks=[],check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
const settle=async()=>{await U.pageScopes.get(doc)?.queue;await ui.waitMotion();for(let n=0;n<100&&doc.querySelector('[data-dock-motion]');n++)await Zotero.Promise.delay(50);await Zotero.Promise.delay(200);};
try{
 await settle();const main=doc.querySelector('.cl-settings'),b=main.getBoundingClientRect();check('library launcher opens HTML controls in XUL host',!main.hidden&&main.namespaceURI==='http://www.w3.org/1999/xhtml'&&b.width>300);
 for(const id of ['references','network']){
  main.querySelector('[data-loom-page='+id+']').click();await settle();const view=doc.querySelector(id==='references'?'.cl-root':id==='network'?'.pn-map-window':'.cl-settings');
  check(id+' available without PDF',!!view&&!view.hidden&&view.getBoundingClientRect().width>200);
  check(id+' has three footer destinations',view.querySelectorAll('.pl-main-actions button').length===3);
  view.querySelector('[data-loom-page=settings]').click();await settle();check(id+' returns to settings',!main.hidden&&view.hidden);
 }
 ui.action('orb').click();await settle();check('library mascot collapses workspace',main.hidden);
 return {passed:true,version:Zotero.version,checks};
}catch(e){return {passed:false,checks,error:String(e),stack:e.stack};}
