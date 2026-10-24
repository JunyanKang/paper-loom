if(!/qa-profile-assistant122b$/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const checks=[],check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);},A=L.assistant;
const title='BANP opens chromatin and activates CpG-island-regulated genes';let items=await Zotero.Items.getAll(Zotero.Libraries.userLibraryID),parent=items.find(x=>x.isRegularItem()&&x.getField('title')===title);
if(!parent){parent=new Zotero.Item('journalArticle');parent.setField('title',title);parent.setField('DOI','10.1038/s41586-021-03689-8');await parent.saveTx();await Zotero.Attachments.importFromFile({file:PathUtils.join(Services.dirsvc.get('Home',Components.interfaces.nsIFile).path,'Zotero','storage','WU4RE6LI','Grand et al. - 2021 - BANP opens chromatin and activates CpG-island-regulated genes.pdf'),parentItemID:parent.id});}
const attachment=await parent.getBestAttachment();let r=await Zotero.Reader.open(attachment.id);for(let i=0;i<100&&!r;i++){await Zotero.Promise.delay(100);r=Zotero.Reader._readers.find(r=>r.itemID===attachment.id&&!r._isTabClosed);}await r._initPromise;
for(let i=0;i<150&&!L.references.readerReady(r);i++)await Zotero.Promise.delay(200);
L.qaReader=r;const refs=await L.references.references(r),muhar=refs.find(r=>r.number===28),gaidatzis=refs.find(r=>r.number===29);
check('real PDF reference 28 is Muhar 2018',muhar?.author==='Muhar'&&String(muhar.year)==='2018');check('real PDF reference 29 is Gaidatzis 2015',gaidatzis?.author==='Gaidatzis'&&String(gaidatzis.year)==='2015');
const view=await A.open(r,{}),doc=view.doc,win=doc.defaultView,context=view.context;
const scope={Zotero,Components,IOUtils,PathUtils,Services,ChromeUtils,PaperLoom:L,LoomAssistant:A};for(const name of ['core','store'])Services.scriptloader.loadSubScript(L.rootURI+'assistant/'+name+'.js',scope);
const session=await scope.LoomAssistantStore.create(context),message={role:'assistant',status:'done',text:'SLAM-seq（引用 28，Muhar et al. 2018）用于区分转录与 RNA 稳定性的变化。EISA（引用 29，Gaidatzis et al. 2015）比较内含子与外显子信号。原文位置 [P11]。',sources:[{id:'P11',itemID:attachment.id,page:10,title}]};
session.messages=[{role:'user',text:'这里的 SLAM-seq 和 EISA 是什么？',context},message];view.session=session;view.render();
for(let i=0;i<100&&view.frame.querySelectorAll('.pl-ai-message-text .pl-ai-citation').length<3;i++)await Zotero.Promise.delay(100);
let buttons=[...view.frame.querySelectorAll('.pl-ai-message-text .pl-ai-citation')];check('two paper references plus existing page link',buttons.length===3);
check('reference wording retained',buttons.some(b=>b.textContent==='引用 28，Muhar et al. 2018'));
for(const [name,record]of [['Muhar',muhar],['Gaidatzis',gaidatzis]]){const b=buttons.find(b=>b.textContent.includes(name));b.click();await Zotero.Promise.delay(200);const card=doc.querySelector('.pl-ai-reference-popover');check(name+' uses shared bibliographic card',!!card?.querySelector('.cl-card-tools'));check(name+' correct title',L.referencesScope.CiteLensCore.norm(card.querySelector('.cl-title')?.textContent)===L.referencesScope.CiteLensCore.norm(record.title));view.citation.close();}
buttons.find(b=>b.textContent.includes('Muhar')).click();await Zotero.Promise.delay(200);
const T=L.referencesScope.CiteLensTranslation,original=T.translate;
// The shared abstract UI may resolve the real abstract online. A controlled translation isolates UI wiring from service availability.
doc.querySelector('.pl-ai-reference-popover .cl-title').click();await Zotero.Promise.delay(2500);
check('real reference opens shared abstract panel',!!doc.querySelector('.cl-summary'));check('abstract has translation and bilingual modes',doc.querySelectorAll('.cl-summary [data-mode]').length===3);
T.translate=async()=>({text:'受控翻译：用于验证真实引文卡的摘要翻译切换。'});try{doc.querySelector('.cl-summary [data-mode=translation]').click();await Zotero.Promise.delay(500);check('shared translation handler reached',doc.querySelector('.cl-summary').textContent.includes('受控翻译'));}finally{T.translate=original;}
view.citation?.close();
await scope.LoomAssistantStore.flush();const loaded=await scope.LoomAssistantStore.load(session.id);check('resolved bibliography persisted with history',loaded.messages[1].paperCitations?.length===2);
// Old conversation remains tied to its own message context even if the view points to a different PDF.
const old=view.reader;view.reader={itemID:-1};view.session=loaded;view.render();await Zotero.Promise.delay(500);check('history does not switch to unrelated current PDF',view.frame.querySelectorAll('.pl-ai-message-text .pl-ai-citation').length===3);view.reader=old;
const canvas=doc.createElement('canvas');canvas.width=win.innerWidth*2;canvas.height=win.innerHeight*2;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.drawWindow(win,0,0,win.innerWidth,win.innerHeight,'rgb(255,255,255)');await IOUtils.write('/tmp/loom125-paper-citations.png',new Uint8Array(await (await win.fetch(canvas.toDataURL())).arrayBuffer()));canvas.width=canvas.height=0;
return {passed:true,checks,references:[muhar,gaidatzis].map(r=>({number:r.number,title:r.title,author:r.author,year:r.year,doi:r.DOI||r.doi})),screenshot:'/tmp/loom125-paper-citations.png'};
