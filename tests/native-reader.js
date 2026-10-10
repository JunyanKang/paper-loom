const checks=[],check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail}),base=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path);
const main=Zotero.getMainWindow();main.document.querySelector('.cl-settings')?._clClose?.();
let attachment;
const previous=Zotero.Prefs.get('paperLoom.qaAttachment');
if(previous)attachment=Zotero.Items.get(previous);
if(!attachment){
 const parent=new Zotero.Item('journalArticle');parent.setField('title','Paper Loom reading and collaboration fixture');parent.setField('date','2026');parent.setField('abstractNote','This is a synthetic integration fixture for the Paper Loom reading application. It verifies that citation discovery and audio playback share the same reading environment. The fixture contains no experimental findings or scientific conclusions.');parent.setCreators([{creatorType:'author',firstName:'Ada',lastName:'Example'},{creatorType:'author',firstName:'Lin',lastName:'Fixture'}]);await parent.saveTx();
 attachment=await Zotero.Attachments.importFromFile({file:PathUtils.join(base,'tests','two-column.pdf'),parentItemID:parent.id});Zotero.Prefs.set('paperLoom.qaAttachment',attachment.id);
 const related=new Zotero.Item('journalArticle');related.setField('title','Paper Loom linked paper fixture');related.setField('date','2025');related.setCreators([{creatorType:'author',firstName:'Ada',lastName:'Example'},{creatorType:'author',firstName:'Kai',lastName:'Fixture'}]);await related.saveTx();
}
const opened=await Zotero.Reader.open(attachment.id);const reader=opened||Zotero.Reader._readers.find(r=>r.itemID===attachment.id);if(!reader)throw Error('Reader did not open');await reader._initPromise;
for(let n=0;n<100&&!L.references.readerReady(reader);n++)await Zotero.Promise.delay(150);
L.voice.attachReader(reader);L.references.attach(reader);await Zotero.Promise.delay(800);
const doc=reader._iframeWindow.document;
check('real PDF loaded',L.references.readerReady(reader));
const pdf=reader._internalReader._primaryView._iframeWindow.PDFViewerApplication.pdfDocument,processed=await L.references.processedData(reader,pdf);
check('actual PDF character data is available',processed.pages[0]?.chars?.length>100);
const units=await L.voice.documentUnits(reader);check('cross-column full-text reading units',units.some(u=>u.text.includes('retinal cells')&&u.text.includes('photoreceptors')));
check('reference extraction completes',Array.isArray(await L.references.references(reader)));
check('single floating Reader entry with compact header navigation',!doc.querySelector('[data-cite-lens=toolbar],[data-paper-voice=toolbar]')&&!!L.voice.panels.get(reader)?.root.querySelector('.pl-main-actions'));
const panel=L.voice.ensurePanel(reader);L.voice.showPanel(reader);
check('four reading modes',panel.root.querySelectorAll('[data-mode]').length===4);
check('companion quick controls retained',!!panel.action('quickPause')&&!!panel.action('quickPrevious')&&!!panel.action('quickTranslate'));
await L.showSettings(reader,doc);await Zotero.Promise.delay(400);const settings=doc.querySelector('.cl-settings');
check('Reader uses same settings center',typeof settings?._plSelect==='function'&&settings.querySelectorAll('.cl-settings-tabs [role=tab]').length===4);
settings?._clClose?.();await Zotero.Promise.delay(400);
const record={title:'Paper Loom reading and collaboration fixture',year:'2026',author:'Example',abstract:'This is a synthetic integration fixture for the Paper Loom reading application. It verifies that citation discovery and audio playback share the same reading environment. The fixture contains no experimental findings or scientific conclusions.',verified:true};
const U=L.referencesScope.CiteLensUI,dialog=U.dialog(doc,'Integration fixture'),card=U.card(doc,record,reader,{context:{parentID:attachment.parentItemID},detailed:true});dialog.root.append(card);
const title=card.querySelector('.cl-title');if(title){title.focus();U.abstractPopover(doc,card,title,()=>record);doc.querySelector('.cl-summary')?.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));await Zotero.Promise.delay(500);}
check('abstract has listening action',!!doc.querySelector('[data-loom-action=listen-abstract]'));
L.qaReader=reader;L.qaAttachment=attachment;L.qaFixtureDialog=dialog;
return {passed:checks.every(c=>c.ok),checks,readerID:reader.itemID,runtime:Runtime.state};
