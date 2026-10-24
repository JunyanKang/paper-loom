// Geometry regression in a disposable profile; no API requests or real keys.
if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const wait=ms=>Zotero.Promise.delay(ms),attachment=(await Zotero.Items.getAll(Zotero.Libraries.userLibraryID)).find(x=>x.isAttachment()),r=await Zotero.Reader.open(attachment.id);await r._initPromise;for(let i=0;i<200&&!L.references.readerReady(r);i++)await wait(100);
const d=r._iframeWindow.document,w=d.defaultView,S=L.referencesScope.CiteLensServices,I=L.referencesScope.CiteLensI18n,T=L.referencesScope.CiteLensTranslation,checks=[],check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);},near=(a,b)=>Math.abs(a-b)<1;
await L.assistant.saveConfig({id:'minimax',endpoint:'https://api.minimax.cn/v1',model:'MiniMax-M3.1-Flash-Preview',protocol:'openai',vision:true},'');
async function capture(panel,name){const rect=panel.getBoundingClientRect(),c=d.createElement('canvas');c.width=Math.ceil(rect.width*2);c.height=Math.ceil(rect.height*2);const cx=c.getContext('2d');cx.scale(2,2);cx.drawWindow(w,rect.x,rect.y,rect.width,rect.height,'white');await IOUtils.write('/tmp/loom-settings-123-'+name+'.png',Uint8Array.from(w.atob(c.toDataURL().split(',')[1]),x=>x.charCodeAt(0)));}
await L.showSettings(r,d);await wait(250);const frame=d.querySelector('.cl-settings'),panel=frame.querySelector('[data-task=assistant]'),translation=frame.querySelector('[data-task=translation]'),origin=frame.querySelector('[data-assistant-settings]');
for(const lang of ['zh','en']){
 S.state.settings.interfaceLanguage=lang;I.refresh();if(panel.hidden)origin.click();await wait(200);
 const model=panel.querySelector('[data-llm=model]'),endpoint=panel.querySelector('[data-llm=endpoint]'),key=panel.querySelector('[data-llm=key]'),search=panel.querySelector('#cl-setting-assistantSearch'),vision=panel.querySelector('#cl-setting-assistantVision'),toggle=panel.querySelector('.cl-model-toggle'),rows=[...panel.querySelectorAll('.cl-setting-row')],base=endpoint.getBoundingClientRect(),fieldOffset=base.left-panel.getBoundingClientRect().left;
 check(lang+' model has usable text width',model.getBoundingClientRect().width>180&&model.value==='MiniMax-M3.1-Flash-Preview');
 check(lang+' model button is compact',toggle.getBoundingClientRect().width<=30);
 check(lang+' text fields align',[model,key,search].every(x=>near(x.getBoundingClientRect().left,base.left)));
 check(lang+' labels share width',rows.every(x=>near(x.firstChild.getBoundingClientRect().width,rows[0].firstChild.getBoundingClientRect().width)));
 check(lang+' labels stay on one line',rows.every(x=>{const label=x.querySelector('label'),range=d.createRange();range.selectNodeContents(label);return range.getBoundingClientRect().width<=x.firstChild.getBoundingClientRect().width+1&&label.getBoundingClientRect().height<25;}));
 const trailing=[toggle,...panel.querySelectorAll('.cl-setting-row>.cl-icon-button'),vision].map(x=>x.getBoundingClientRect());check(lang+' trailing controls centered together',trailing.every(x=>near(x.left+x.width/2,trailing[0].left+trailing[0].width/2)));
 check(lang+' toggle retains track width',vision.getBoundingClientRect().width>=28&&vision.getBoundingClientRect().width<=32);
 check(lang+' no vertical clipping',panel.querySelector('.cl-llm-content').scrollHeight<=panel.querySelector('.cl-llm-content').clientHeight+1);
 check(lang+' panel fits workspace',panel.getBoundingClientRect().bottom<=frame.getBoundingClientRect().bottom+1);
 await capture(panel,'assistant-'+lang);
 const provider=panel.querySelector('.cl-llm-provider .cl-select-trigger');provider.click();await wait(100);const menu=d.querySelector('.cl-select-popover:not([hidden])'),box=menu.getBoundingClientRect();
 check(lang+' providers open above in two rows',box.bottom<=panel.getBoundingClientRect().top+2&&new Set([...menu.children].map(x=>Math.round(x.getBoundingClientRect().top))).size===2);
 check(lang+' provider menu fits viewport',box.left>=0&&box.top>=0&&box.right<=w.innerWidth&&box.bottom<=w.innerHeight);
 check(lang+' provider surface is connected',panel.classList.contains('cl-llm-connected'));
 menu.querySelector('[role=option][data-index="'+panel.querySelector('select[data-provider-catalog]').selectedIndex+'"]').click();await wait(100);
 toggle.click();await wait(100);const models=d.querySelector('.cl-select-popover:not([hidden])');check(lang+' models open downward',models.getBoundingClientRect().top>=model.getBoundingClientRect().bottom);models.querySelector('[role=option]').click();await wait(100);
 const before=model.getBoundingClientRect();L.assistant.installStyle(d);await wait(100);check(lang+' opening assistant does not change settings geometry',near(model.getBoundingClientRect().left,before.left)&&near(model.getBoundingClientRect().width,before.width));
 origin.click();T.set('translationProvider','llm');await wait(100);frame.querySelector('.pl-provider-settings').click();await wait(150);
 const tm=translation.querySelector('[data-llm=model]'),te=translation.querySelector('[data-llm=endpoint]');tm.value='MiniMax-M3.1-Flash-Preview';te.value='https://api.minimax.cn/v1';check(lang+' both editors use identical label columns',near(te.getBoundingClientRect().left-translation.getBoundingClientRect().left,fieldOffset));
 await capture(translation,'translation-'+lang);frame.querySelector('.pl-provider-settings').click();
}
return {passed:true,checks};
