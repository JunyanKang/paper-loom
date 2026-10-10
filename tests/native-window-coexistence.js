const checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);},wait=ms=>Zotero.Promise.delay(ms),U=L.referencesScope.CiteLensUI,V=L.voice,w=Zotero.getMainWindow();
const base=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path);
if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
let r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID);if(!r){const a=await Zotero.Attachments.importFromFile({file:PathUtils.join(base,'docs','demo','reading-demo.pdf')});r=await Zotero.Reader.open(a.id);}
await r._initPromise;for(let i=0;i<100&&!V.panels.has(r);i++)await wait(100);
const doc=r._iframeWindow.document,voice=V.panels.get(r);let detached;
const settle=async()=>{await Promise.all([...U.livePages()].map(v=>U.pageScopes.get(v.frame.ownerDocument)?.queue));for(let i=0;i<60;i++){if(![...V.panels.values()].some(v=>v.panel.dataset.pvVisible==='false'&&!v.panel.hidden))break;await wait(100);}await wait(350);};
try{
 for(const view of [...U.livePages()])view.destroy();
 V.showPanel(r);await wait(600);check('listening opens',!voice.panel.hidden);check('toolbar entry removed',!doc.querySelector('[data-cite-lens=toolbar],[data-paper-voice=toolbar]'));check('floating panel contains all four destinations',voice.root.querySelectorAll('.pl-navigation button').length===4);
 const refs=L.references.showPanel(r);await settle();check('references collapse listening',voice.panel.hidden&&!refs.hidden);
 const original=refs;L.references.showPanel(r);await settle();check('reference view is reused',original===L.references.panels.get(r));
 await L.showSettings(r,doc);await settle();const settings=doc.querySelector('.cl-settings');check('settings replaces references',refs.hidden&&!settings.hidden);const secret=settings.querySelector('[data-llm=key]');if(secret)secret.value='unsaved-fixture';
 const home=L.showHome(r,doc);await settle();check('home replaces settings',settings.parentElement.hidden&&!home.overlay.hidden);
 await L.showSettings(r,doc);await settle();check('settings reopens once and keeps draft',doc.querySelectorAll('.cl-settings').length===1&&(!secret||secret.value==='unsaved-fixture'));if(secret)secret.value='';
 V.showPanel(r);await settle();check('listening replaces workspace',settings.parentElement.hidden&&!voice.panel.hidden);
 check('floating entry stays available',voice.action('orb').getBoundingClientRect().width>0);
 L.references.showPanel(r);await settle();const rb=refs.getBoundingClientRect(),ob=voice.action('orb').getBoundingClientRect();check('reference panel leaves space for listening dock',!refs.hidden&&rb.bottom<ob.top,{ref:rb.toJSON(),orb:ob.toJSON(),hidden:refs.hidden,voiceHidden:voice.panel.hidden});
 detached=await Zotero.Reader.open(r.itemID,null,{openInWindow:true,allowDuplicate:true});await detached._initPromise;for(let i=0;i<100&&!V.panels.has(detached);i++)await wait(100);
 const other=detached._iframeWindow.document;await L.showSettings(detached,other);await settle();check('separate window does not collapse first document',!refs.hidden);
 const otherSettings=other.querySelector('.cl-settings');L.showHome(r,doc);await settle();check('first document does not collapse separate window',!otherSettings.parentElement.hidden);
 const child=U.dialog(other,'Edit fixture',{keepParentVisible:true});check('child dialog makes parent inert',otherSettings.parentElement.inert);child.close();check('closing child restores parent',!otherSettings.parentElement.inert&&!otherSettings.parentElement.hidden);
 L.showHome(detached,other);L.references.showPanel(r);await settle();check('rapid actions in separate windows both settle',!other.querySelector('.pl-home').parentElement.hidden&&!refs.hidden);
 const state=V.state;V.showPanel(r);await wait(500);V.dismissPanel(r);await wait(500);check('collapse does not change playback state',V.state===state);
 L.showConflicts(doc);const conflict=doc.getElementById('paper-loom-conflicts'),buttons=[...conflict.querySelectorAll('button')];check('import buttons fit their labels',buttons.every(b=>b.scrollWidth<=b.clientWidth+1&&b.clientHeight>=36));check('product has no Chinese alias',conflict.querySelector('h2').textContent==='Paper Loom');conflict.remove();
 detached._window.close();detached=null;await wait(150);await L.showSettings(r,doc);await settle();check('closing another window leaves navigation usable',!doc.querySelector('.cl-settings').parentElement.hidden);V.setCaptionStyle('captionSize',14);V.setLanguage('en');check('font and language settings work after window closes',V.get('captionSize')===14||V.get('captionSize')==='14');return {passed:true,version:Zotero.version,checks};
}catch(e){return {passed:false,checks,error:String(e),stack:e.stack};}finally{detached?._window?.close();}
