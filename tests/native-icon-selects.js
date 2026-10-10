const V=L.voice,Q=L.referencesScope,U=Q.CiteLensUI,T=Q.CiteLensTranslation,wait=ms=>Zotero.Promise.delay(ms),checks=[];
const reader=Zotero.Reader._readers.find(r=>r._tabID||r.tabID),doc=reader._iframeWindow.document,w=doc.defaultView;
Zotero.getMainWindow().Zotero_Tabs.select(reader._tabID||reader.tabID);
const saved=T.get('translationProvider','tencenttransmart'),savedConfigs=V.get('llmConfigs','{}'),savedProvider=V.get('llmProvider','');
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const centre=el=>{const b=el.getBoundingClientRect();return b.left+b.width/2+el.ownerDocument.defaultView.mozInnerScreenX;};
const inspect=async(button,menuSelector,name)=>{
 button.click();await wait(240);const d=button.ownerDocument,win=d.defaultView,menu=button.closest('.pv-shell')?._pvSelects?.menu||d.querySelector(menuSelector),icon=button.querySelector('img');
 check(name+' icon-only trigger',!!icon&&!button.textContent.trim());
 if(icon.classList.contains('pl-flag'))check(name+' flags have no hover text',!button.hasAttribute('title')&&!button.dataset.pvTooltip&&!button.dataset.clTooltip&&[...menu.querySelectorAll('[role=option]')].every(row=>!row.hasAttribute('title')&&!row.dataset.pvTooltip&&!row.dataset.clTooltip));
 check(name+' compact menu',menu.getBoundingClientRect().width<=52,menu.getBoundingClientRect().width);
 const rows=[...menu.querySelectorAll('[role=option]')];
 check(name+' icon-only aligned options',rows.length>0&&rows.every(row=>{const img=row.querySelector('img'),mark=row.querySelector('.cl-select-check,.pv-select-check');return img&&img.complete&&img.naturalWidth>0&&Math.abs(centre(img)-centre(icon))<1&&(!mark||win.getComputedStyle(mark).display==='none')&&!!row.getAttribute('aria-label');}),rows.map(row=>({label:row.getAttribute('aria-label'),offset:row.querySelector('img')?centre(row.querySelector('img'))-centre(icon):null})));
 button.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(180);
};
try{
 V.set('llmConfigs','{}');check('unconfigured LLM has a generic symbol',L.providerMeta('llm').id==='llm');V.set('llmProvider','deepseek');V.set('llmConfigs',JSON.stringify({deepseek:{model:'deepseek-flash'}}));check('configured LLM uses its provider logo',L.providerMeta('llm').id==='deepseek');V.set('llmConfigs',savedConfigs);V.set('llmProvider',savedProvider);
 await L.showSettings(reader,doc);await U.pageScopes.get(doc)?.queue;await wait(700);const f=doc.querySelector('.cl-settings');
 await inspect(f.querySelector('[data-translation-setting-proxy=translationTarget]'),'.cl-select-popover','translation flags');
 await inspect(f.querySelector('[data-translation-setting-proxy=translationProvider]'),'.cl-select-popover','translation services');
 const service=f.querySelector('select[data-translation-setting=translationProvider]');service.value='llm';service.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(200);f.querySelector('.pl-provider-settings').click();await wait(300);
 await inspect(f.querySelector('[data-translation-setting-proxy=llmProvider]'),'.cl-select-popover','LLM providers');
 f._plSelect('appearance');await wait(200);check('switching settings category hides model editor',f.querySelector('.cl-llm-settings').hidden&&!f.querySelector('.cl-settings-tabs').hidden);await inspect(f.querySelector('[data-select-id=cl-setting-interfaceLanguage]'),'.cl-select-popover','interface flags');
 f._plSelect('voice');await wait(250);const inside=f.querySelector('iframe').contentDocument;
 await inspect(inside.querySelector('[data-select-field=speechLanguage] button'),'.pv-select-popover','speech flags');
 const speech=inside.querySelector('[data-field=speechLanguage]');check('speech language always shows a concrete supported choice',speech.value!=='auto'&&[...speech.options].map(o=>o.value).join(',')==='en,zh,ja,fr');
 const oldLanguage=V.get('speechLanguage','en'),oldVoice=V.get('voice','af_heart');
 try{for(const code of ['en','zh','ja','fr']){speech.value=code;speech.dispatchEvent(new inside.defaultView.Event('change',{bubbles:true}));await wait(80);const voices=inside.querySelector('[data-field=voice]');check(code+' selection changes speech and retains numbered voices',V.get('speechLanguage','en')===code&&V.speechLanguage()===code&&voices.options.length>0&&[...voices.options].every(o=>/[12]$/.test(o.textContent)),[...voices.options].map(o=>o.textContent));}}finally{V.set('speechLanguage',oldLanguage);V.set('voice',oldVoice);V.syncSettings();}

 return {passed:true,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}finally{V.set('llmConfigs',savedConfigs);V.set('llmProvider',savedProvider);T.set('translationProvider',saved);V.syncSettings();}
