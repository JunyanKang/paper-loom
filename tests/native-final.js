const results={};
results['native-smoke']=await (async()=>{
const checks=[],check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail}),win=Zotero.getMainWindow(),doc=win.document;
check('both modules started',L.started&&!L.voice.dead&&!L.references.dead);
check('only one tools entry',!!doc.getElementById('paper-loom-tools')&&!doc.getElementById('paper-voice-tools')&&!doc.getElementById('cite-lens-tools'));
check('architecture detected',Runtime.platform.supported&&Runtime.platform.key==='macOS-arm64',Runtime.platform);
await L.showSettings(null,doc);
await Zotero.Promise.delay(1200);
const frame=doc.querySelector('.cl-settings');
check('shared settings built',!!frame?.querySelector('iframe')?.contentDocument.querySelector('[data-loom-settings]'),frame?.textContent.slice(0,160));
check('all settings categories',frame?.querySelectorAll('.cl-settings-tabs [role=tab]').length===4);
frame?._plSelect('voice');await Zotero.Promise.delay(200);
check('in-XPI engine download',!!frame?.querySelector('iframe')?.contentDocument.querySelector('[data-loom-action=install-runtime]'));
check('voice and sample controls',!!frame?.querySelector('iframe')?.contentDocument.querySelector('[data-field=voice]')&&!!frame?.querySelector('iframe')?.contentDocument.querySelector('[data-action=sample]'));
frame?._plSelect('shortcuts');check('custom shortcuts retained',frame?.querySelector('iframe')?.contentDocument.querySelectorAll('[data-shortcut]').length>=8);
frame?._plSelect('appearance');check('original themes retained',frame?.querySelectorAll('[data-theme-choice]').length>=10);
L.voice.set('translationTarget','fr');check('shared target config',L.referencesScope.CiteLensTranslation.get('translationTarget')==='fr');
L.referencesScope.CiteLensTranslation.set('translationTarget','zh-Hans');check('reverse config sharing',L.voice.get('translationTarget')==='zh-Hans');
check('matching voice catalog',Runtime.catalog?.files.length>3000);
frame?._clClose?.();
return {passed:checks.every(c=>c.ok),checks};

})();
results['native-reader']=await (async()=>{
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
check('single floating Reader entry with all destinations',!doc.querySelector('[data-cite-lens=toolbar],[data-paper-voice=toolbar]')&&L.voice.panels.get(reader)?.root.querySelectorAll('.pl-navigation [data-loom-page]').length===4);
const panel=L.voice.ensurePanel(reader);L.voice.showPanel(reader);
check('four reading modes',panel.root.querySelectorAll('[data-mode]').length===4);
check('companion quick controls retained',!!panel.action('quickPause')&&!!panel.action('quickPrevious')&&!!panel.action('quickTranslate'));
await L.showSettings(reader,doc);await Zotero.Promise.delay(400);const settings=doc.querySelector('.cl-settings');
check('Reader uses same settings center',typeof settings?._plSelect==='function'&&settings.querySelectorAll('.cl-settings-tabs [role=tab]').length===4);
settings?._clClose?.();await Zotero.Promise.delay(400);
const record={title:'Paper Loom reading and collaboration fixture',year:'2026',author:'Example',abstract:'This is a synthetic integration fixture for the Paper Loom reading application. It verifies that citation discovery and audio playback share the same reading environment. The fixture contains no experimental findings or scientific conclusions.',verified:true};
const U=L.referencesScope.CiteLensUI,dialog=U.dialog(doc,'Integration fixture'),card=U.card(doc,record,reader,{context:{parentID:attachment.parentItemID},detailed:true});dialog.root.append(card);
const title=card.querySelector('.cl-title');if(title){U.abstractPopover(doc,card,title,()=>record);await Zotero.Promise.delay(500);}
check('abstract has listening action',!!doc.querySelector('[data-loom-action=listen-abstract]'));
L.qaReader=reader;L.qaAttachment=attachment;L.qaFixtureDialog=dialog;
return {passed:checks.every(c=>c.ok),checks,readerID:reader.itemID,runtime:Runtime.state};

})();
results['native-network']=await (async()=>{
const checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const Q=L.referencesScope,{CiteLensCareerUI:CU,CiteLensCareer:C,CiteLensServices:S,CiteLensUI:U}=Q,doc=Zotero.getMainWindow().document;
const until=async(fn,label)=>{for(let n=0;n<600;n++){if(fn())return;await Zotero.Promise.delay(150);}throw Error('Timed out: '+label);};
let frame;
try{
 frame=L.references.showNetwork();await U.pageQueue;await until(()=>frame._pnModel&&frame.querySelector('.pn-map-stage')?.getAttribute('aria-busy')==='false','author network');
 const author=frame._pnModel.nodes.find(n=>n.kind==='author'&&n.title==='Ada Example')||frame._pnModel.nodes.find(n=>n.kind==='author');
 check('local coauthor graph builds',!!author,{nodes:frame._pnModel.nodes.length});await frame._pnSelect(author.id);await Zotero.Promise.delay(700);
 check('author inspector retains associated papers',frame.querySelectorAll('.pn-member-paper').length>0);
 const row=frame.querySelector('.pn-member-paper');check('paper actions preserved',!!row.querySelector('[data-icon=open]')&&!!row.querySelector('[data-icon=copy]')&&!!row.querySelector('[data-icon=retry]'));
 const camera=JSON.stringify(frame._pnCamera),job=frame._pnJob;
 // Read-only public ORCID retrieval. This record is a separate live-data test, not the synthetic local author's identity.
 const career=CU.open(doc,{orcid:'0000-0002-9053-5249',name:'Dawang Zhou',host:frame});
 await until(()=>career.querySelector('.pn-career-event'),'public ORCID career');
 check('live public career loaded',career.querySelectorAll('.pn-career-event').length>0,{events:career.querySelectorAll('.pn-career-event').length});
 check('career stays within graph and preserves inspector',career.parentElement===frame.querySelector('.pn-map-stage')&&!frame.querySelector('.pn-map-inspector').inert);
 check('career publication tools preserved',!!career.querySelector('.pn-career-paper-tools [data-icon=doi]')&&!!career.querySelector('.pn-career-paper-tools [data-icon=copy]'));
 career._clClose();check('return preserves graph job and camera',job===frame._pnJob&&camera===JSON.stringify(frame._pnCamera));
 L.qaNetwork=frame;return {passed:true,checks};
}catch(e){return {passed:false,checks,error:String(e),detail:frame?.querySelector('.pn-career-status')?.textContent};}

})();
results['native-audio']=await (async()=>{
const checks=[],check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
const result=L.qaRuntimeTask?await L.qaRuntimeTask:{passed:await Runtime.diagnose()};check('installed engine performs real synthesis',result?.passed,result);
if(!result?.passed)return {passed:false,checks};
const V=L.voice,reader=L.qaReader||L.currentReader();
if(!reader)throw Error('Run native-reader.js first');
L.qaFixtureDialog?.close();await Zotero.Promise.delay(300);
await V.ensureWorker();check('worker running',!!V.process);
const saved={mode:V.get('mode','selection'),voice:V.get('voice','af_heart'),readTranslation:V.get('readTranslation',false)};
V.set('readTranslation',false);V.set('voice','af_heart');V.set('mode','selection');
const sample='This is an integration test of Paper Loom. Reading, listening and citation discovery now work together in one Zotero extension. We can pause the voice, continue listening, and stop when we are ready.';
const task=V.speak(sample,reader,true);
for(let i=0;i<200&&!['playing','error'].includes(V.state);i++)await Zotero.Promise.delay(100);
check('actual audio playback starts',V.state==='playing',{state:V.state,status:V.status});
if(V.state==='playing'){V.togglePause();await Zotero.Promise.delay(200);check('pause works',V.state==='paused');V.togglePause();await Zotero.Promise.delay(150);check('resume works',V.state==='playing');}
V.stop();await task;check('stop completes',!['playing','paused','loading'].includes(V.state));
for(const [key,value] of Object.entries(saved))V.set(key,value);
return {passed:checks.every(c=>c.ok),checks};

})();
results['native-integration']=await (async()=>{
const checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);},doc=Zotero.getMainWindow().document,T=L.referencesScope.CiteLensTranslation;
const size=L.voice.get('captionSize',12),provider=T.get('translationProvider','tencenttransmart'),target=T.get('translationTarget','zh-Hans');
try{
 check('single library launcher',doc.querySelectorAll('.pl-library-entry').length===1);
 L.voice.setCaptionStyle('captionSize',16);check('caption font size shared with abstracts',T.get('translationSize')==='16');
 await L.showSettings(null,doc);const frame=doc.querySelector('.cl-settings'),tabs=[...frame.querySelectorAll('.cl-settings-tabs [role=tab]')];await Zotero.Promise.delay(400);
 check('four setting tabs stay on one row',Math.max(...tabs.map(b=>b.getBoundingClientRect().y))-Math.min(...tabs.map(b=>b.getBoundingClientRect().y))<2);
 check('one translation size control',!frame.querySelector('[data-translation-setting=translationSize]')&&!!frame.querySelector('iframe').contentDocument.querySelector('[data-field=captionSize]'));
 check('periodic discovery and auto-install settings both retained',!!frame.querySelector('.pl-update-schedule select')&&!!frame.querySelector('#cl-setting-autoUpdate'));
 frame._plSelect('voice');await Zotero.Promise.delay(300);const iframe=frame.querySelector('iframe'),panel=iframe.contentDocument.querySelector('.pv-panel');check('voice settings use one outer scroll area',panel.getBoundingClientRect().height<=iframe.clientHeight);
 frame._clClose();const queue=L.showQueue();await L.referencesScope.CiteLensUI.pageQueue;await Zotero.Promise.delay(500);check('library opens actual later-reading list',queue.querySelector('[data-view=queue]').getAttribute('aria-selected')==='true');queue._clClose();
 const empty=PathUtils.join(PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),'test-results','empty-hash.fixture');await IOUtils.write(empty,new Uint8Array());check('empty package files hash correctly',await Runtime.hash(empty)==='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
 T.set('translationProvider','tencenttransmart');T.set('translationTarget','zh-Hans');const translated=await L.voice.translate('The retina detects light.','en');check('shared translation service returns real translation',!!translated.text&&translated.text!=='The retina detects light.',{text:translated.text});
 return {passed:true,checks};
}catch(e){return {passed:false,checks,error:String(e),stack:e.stack};}finally{L.voice.setCaptionStyle('captionSize',size);T.set('translationProvider',provider);T.set('translationTarget',target);}

})();
return {passed:Object.values(results).every(r=>r.passed),results};
