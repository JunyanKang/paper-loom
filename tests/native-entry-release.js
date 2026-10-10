const w=Zotero.getMainWindow(),d=w.document,wait=ms=>Zotero.Promise.delay(ms),checks=[],check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
const entry=d.querySelector('.pl-library-entry'),search=d.getElementById('zotero-tb-search'),tab=L.demoReader?._tabID||L.demoReader?.tabID;
w.Zotero_Tabs.select('zotero-pane');await wait(500);check('launcher at left of search',entry.getBoundingClientRect().right<search.getBoundingClientRect().left);
if(L.captureDocs)await L.captureDocs(d.getElementById('zotero-items-toolbar'),'library-toolbar');
if(tab){w.Zotero_Tabs.select(tab);await wait(500);const ui=L.voice.panels.get(L.demoReader),b=ui.action('orb').getBoundingClientRect();check('floating book survives tab switch',b.width>30&&b.height>30);ui.action('orb').click();await wait(400);check('floating book opens listening panel',!ui.panel.hidden);ui.action('close').click();await wait(400);check('close keeps floating book',ui.panel.hidden&&ui.action('orb').getBoundingClientRect().width>30);}
await L.referencesScope.CiteLensUpdater.check();return {passed:true,checks,updateState:L.referencesScope.CiteLensUpdater.snapshot()};
