const doc=Zotero.getMainWindow().document,checks=[],check=(name,ok)=>checks.push({name,ok:!!ok});
const count=L.voice.panels.size;
for(let i=0;i<3;i++){await L.showSettings(null,doc);await Zotero.Promise.delay(180);doc.querySelector('.cl-settings')._clClose();await Zotero.Promise.delay(350);}
check('closing settings releases embedded voice panels',L.voice.panels.size===count);
await L.showSettings(null,doc,'voice');await Zotero.Promise.delay(500);
const frame=doc.querySelector('.cl-settings');check('new logo used in settings',frame.querySelector('img').src.includes('/assets/loom.png'));check('four settings tabs',frame.querySelectorAll('[role=tab]').length===4);
return {passed:checks.every(c=>c.ok),checks};
