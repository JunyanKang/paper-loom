// Current product surfaces with explicit demonstration content; no model request.
const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;
if(!profile.endsWith('qa-profile-docs129'))throw Error('Dedicated documentation profile only');
const base=PathUtils.parent(profile),out=PathUtils.join(base,'docs','images'),wait=ms=>Zotero.Promise.delay(ms),V=L.voice,A=L.assistant,Q=L.referencesScope,U=Q.CiteLensUI,S=Q.CiteLensServices,H=Q.CiteLensThemes;
let parent=(await Zotero.Items.getAll(Zotero.Libraries.userLibraryID)).find(i=>i.getField('title')==='Reading the developing retina');
if(!parent){parent=new Zotero.Item('journalArticle');parent.setField('title','Reading the developing retina');parent.setField('publicationTitle','Paper Loom demonstration library');parent.setField('date','2026');await parent.saveTx();}
let attachment=parent.getAttachments().map(id=>Zotero.Items.get(id)).find(i=>i.attachmentContentType==='application/pdf');
if(!attachment)attachment=await Zotero.Attachments.importFromFile({file:PathUtils.join(base,'docs','demo','reading-demo.pdf'),parentItemID:parent.id});
let reader=await Zotero.Reader.open(attachment.id);for(let i=0;i<100&&!reader;i++){await wait(100);reader=Zotero.Reader._readers.find(r=>r.itemID===attachment.id);}if(!reader)throw Error('Demo reader did not open');await reader._initPromise;
Zotero.getMainWindow().Zotero_Tabs.select(reader._tabID||reader.tabID);await wait(500);
const doc=reader._iframeWindow.document,win=doc.defaultView,capture=new Function('IOUtils','PathUtils',await IOUtils.readUTF8(PathUtils.join(base,'tests','docs-capture.js'))+';return captureDocs;')(IOUtils,PathUtils);
const saved={theme:S.state.settings.theme,global:S.state.settings.globalBackground,transparency:S.state.settings.transparency,language:V.get('interfaceLanguage'),translation:V.translate,text:V.selectionTranslationText,state:V.state},images=[],checks=[];
const check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
const backdrop=doc.createElement('div');backdrop.style.cssText='position:fixed;inset:0;background:#101b20;z-index:19;pointer-events:none';doc.documentElement.append(backdrop);
const snap=async(frame)=>{await U.pageScopes.get(doc)?.queue;frame._clPage.snap(true);frame.dispatchEvent(new win.PointerEvent('pointerenter'));await wait(400);frame._clPage.snap(true);};
const originalHistory=A.historyUI,storeScope={Zotero,Services,IOUtils,PathUtils,Components,PaperLoom:L,LoomAssistant:A};
for(const file of ['core','store','history'])Services.scriptloader.loadSubScript(L.rootURI+'assistant/'+file+'.js',storeScope);
const Store=storeScope.LoomAssistantStore;
const cleanDemo=async()=>{await Store.init();for(const s of [...Store.index.sessions])if(/^(Demo ·|演示 ·)/.test(s.title))await Store.remove(s.id);};await cleanDemo();
let popup;
try{
S.state.settings.theme='midnight';S.state.settings.globalBackground='';S.state.settings.transparency=0;H.refresh();A.setWidthScale(1);V.set('captionSize',14);
for(const lang of ['zh','en']){
 V.setLanguage(lang);for(const page of [...U.livePages(doc)])page.destroy();
 await L.showSettings(reader,doc);await U.pageScopes.get(doc)?.queue;const settings=doc.querySelector('.cl-settings');await settings._plReady;await snap(settings);images.push(await capture(settings,'appearance-'+lang,out));settings._clPage.destroy();
 const view=await A.open(reader,{kind:'selection',page:0,original:'Photoreceptors detect incoming light, interneurons shape visual signals, and retinal ganglion cells carry the output to the brain.',translation:'感光细胞检测入射光，中间神经元加工视觉信号，视网膜神经节细胞将输出传递至大脑。'});await snap(view.frame);
 const session=await Store.create(view.context),zh=lang==='zh';session.title=zh?'演示 · 从细胞到视觉信号':'Demo · From cells to visual signals';
 session.messages=[{role:'user',text:zh?'请用简短表格解释这段演示材料中的三类细胞。':'Explain the three cell types in this demo passage in a short table.',time:Date.now(),context:view.context},{role:'assistant',status:'done',text:zh?'这段文字按信号传递顺序介绍了三类细胞 [P1]。\n\n| 细胞 | 主要作用 |\n|---|---|\n| 感光细胞 | 检测入射光 |\n| 中间神经元 | 加工视觉信号 |\n| 视网膜神经节细胞 | 向大脑传递输出 |\n\n可以继续问：这些细胞在发育过程中如何建立联系？\n\n*演示内容，用于说明界面操作。*':'The passage introduces three cell types in signal order [P1].\n\n| Cell | Main role |\n|---|---|\n| Photoreceptors | Detect incoming light |\n| Interneurons | Shape visual signals |\n| Retinal ganglion cells | Send output to the brain |\n\nNext question: how do these cells connect during development?\n\n*Demo content illustrating the interface.*',sources:[{id:'P1',title:'Reading the developing retina',itemID:attachment.id,page:0}],activity:[{text:zh?'读取演示材料 · PDF 第 1 页':'Read demo material · PDF page 1',at:Date.now()}],time:Date.now()}];
 await Store.save(session);view.session=session;view.render();view.input.value='';await snap(view.frame);view.scrollToLatest();await wait(120);
 check(lang+' assistant answer has table and page link',!!view.frame.querySelector('.pl-ai-answer table')&&!!view.frame.querySelector('.pl-ai-citation'));
 check(lang+' assistant content fits bubble',view.frame.querySelector('.pl-ai-answer').scrollWidth<=view.frame.querySelector('.pl-ai-answer').clientWidth+1);
 images.push(await capture(view.frame,'assistant-'+lang,out));
 view.frame.querySelector('.pl-ai-context-trigger').click();await wait(120);check(lang+' source preview opens above input',!!doc.querySelector('.pl-ai-context-popover'));images.push(await capture(view.frame,'assistant-context-'+lang,out));view.composerTools.close();
 for(const [days,count] of [[2,2],[5,5],[9,10]]){const old=await Store.create(view.context),at=Date.now()-days*86400000;old.title=zh?'演示 · 阅读笔记':'Demo · Reading notes';old.created=old.updated=at;old.messages=Array.from({length:count},()=>({role:'user',text:zh?'解释演示材料。':'Explain the demo material.',time:at}));await Store.save(old);}
 await view.history.show();await snap(view.frame);check(lang+' calendar contains demo record',!!view.frame.querySelector('.pl-ai-history-row'));images.push(await capture(view.frame,'assistant-history-'+lang,out));view.frame._clPage.destroy();await cleanDemo();
 V.stop();V.set('auto',false);V.set('selectionTranslation',true);V.set('readTranslation',false);V.set('translationProvider','bing');V.set('translationTarget','zh-Hans');V.setMode('selection');
 const original='Photoreceptors detect incoming light, interneurons shape visual signals, and retinal ganglion cells carry the output to the brain.';
 V.translate=async()=>({text:'感光细胞检测入射光，中间神经元加工视觉信号，视网膜神经节细胞将输出传递至大脑。'});V.selectionTranslationText=async()=>original;
 popup=doc.createElement('div');popup.className='selection-popup page-popup-0';popup.style.cssText='position:fixed;left:160px;top:240px;z-index:2147483646';doc.body.append(popup);
 const pdfView=reader._internalReader._primaryView._iframeWindow.PDFViewerApplication.pdfViewer,page=pdfView.getPageView(0),pageBox=page.div.getBoundingClientRect(),clip=pdfView.container.getBoundingClientRect(),y=Math.max(pageBox.top,clip.top)+80,point=page.viewport.convertToPdfPoint(100,y-pageBox.top);
 V.onSelection({doc,reader,params:{annotation:{text:original,position:{pageIndex:0,rects:[[point[0],point[1]-12,point[0]+160,point[1]]]}}},append:card=>popup.append(card)});await wait(700);
 check(lang+' selection popup visible',win.getComputedStyle(popup).visibility==='visible'&&popup.dataset.pvAnchorHidden!=='true');
 const ai=popup.querySelector('[data-selection-assistant]');check(lang+' selection AI entry paints',!!ai&&ai.getBoundingClientRect().width>15&&win.getComputedStyle(ai.querySelector('.pl-ai-icon')).maskImage!=='none');
 images.push(await capture(popup,'selection-translation-'+lang,out));popup.remove();popup=null;
 V.set('translation',true);V.set('readTranslation',true);V.set('mode','paragraph');V.state='paused';V.set('rate',1);
 const units=await V.documentUnits(reader),unit=units.find(u=>u.text.startsWith('A useful reading strategy'))||units.find(u=>u.text.includes('retina transforms light'));
 V.showTranslation(reader,unit,'有效的阅读策略始于一个问题：什么在随时间变化？涉及哪些细胞类型？','');const c=V.caption;c.box.dispatchEvent(new win.PointerEvent('pointerenter'));c.tools.querySelector('.pv-caption-rate-host').dispatchEvent(new win.PointerEvent('pointerenter'));await wait(250);
 const captionAI=c.tools.querySelector('[data-caption-action=assistant]');check(lang+' reading AI entry paints',!!captionAI&&captionAI.getBoundingClientRect().width>15&&win.getComputedStyle(captionAI.querySelector('.pl-ai-icon')).maskImage!=='none');
 images.push(await capture([c.box,c.tools.querySelector('.pv-caption-connected-surface')],'caption-controls-'+lang,out));V.hideTranslation(true);
}
const meta=await IOUtils.readJSON(PathUtils.join(out,'capture-sizes.json'));for(const row of images){meta.images=meta.images.filter(x=>x.name!==row.name);meta.images.push({...row,version:L.version||'1.2.7',fixture:'reading-demo.pdf'});}await IOUtils.writeJSON(PathUtils.join(out,'capture-sizes.json'),meta);return {passed:true,checks,images};
}finally{A.historyUI=originalHistory;popup?.remove();backdrop.remove();V.hideTranslation(true);V.translate=saved.translation;V.selectionTranslationText=saved.text;V.state=saved.state;V.setLanguage(saved.language);S.state.settings.theme=saved.theme;S.state.settings.globalBackground=saved.global;S.state.settings.transparency=saved.transparency;H.refresh();}
