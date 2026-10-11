const V=L.voice,T=L.referencesScope.CiteLensTranslation,U=L.referencesScope.CiteLensUI,doc=Zotero.getMainWindow().document,wait=ms=>Zotero.Promise.delay(ms),checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const saved=Object.fromEntries(['voice','speechLanguage','readTranslation','translationTarget','voiceFor_en','voiceFor_ja','voiceFor_fr','voiceFor_en-GB','voiceFor_en-US'].map(k=>[k,V.get(k)]));
try{
 V.set('readTranslation',false);V.setVoice('af_heart');V.setTranslationTarget('ja');V.setReadTranslation(true);
 await L.showSettings(null,doc,'voice');await U.pageScopes.get(doc)?.queue;await wait(250);
 const frame=doc.querySelector('.cl-settings'),inside=frame.querySelector('iframe').contentDocument,root=inside.querySelector('.pv-shell'),button=inside.querySelector('[data-select-field=voice] button'),voice=inside.querySelector('[data-field=voice]'),sample=inside.querySelector('[data-action=sample]');
 check('enabling translated speech selects target voice',V.settingsVoiceLanguage()==='ja'&&voice.value.startsWith('j')&&!button.disabled);
 T.set('translationTarget','fr');await wait(100);check('shared abstract target updates voice picker',voice.value==='ff_siwis'&&button.querySelector('.pl-voice-symbol').dataset.voice==='ff_siwis');
 button.click();await wait(60);T.set('translationTarget','de');await wait(250);
 check('unsupported target keeps translated mode enabled',V.get('readTranslation')===true&&T.get('translationTarget')==='de');
 check('unsupported target disables picker and sample',voice.disabled&&button.disabled&&sample.disabled);
 check('unsupported flag remains visible without stale portrait',button.querySelector('.pl-flag')?.src.endsWith('/de.svg')&&!button.querySelector('.pl-voice-avatar'));
 check('open menu closes when language becomes unsupported',root._pvSelects.menu.hidden);button.click();check('disabled picker cannot reopen',root._pvSelects.menu.hidden);
 T.set('translationTarget','en');await wait(100);check('supported language restores controls',!button.disabled&&!sample.disabled&&voice.value==='af_heart');
 V.selectTranslationVoice('en-GB','bf_emma');await wait(100);check('caption accent and voice update settings',voice.value==='bf_emma'&&T.get('translationTarget')==='en');
 V.setVoice('jf_alpha');await wait(100);check('settings voice updates all shared translation consumers',T.get('translationTarget')==='ja'&&voice.value==='jf_alpha');
 V.setReadTranslation(false);await wait(60);check('original voice preference preserved',voice.value==='af_heart');
 return {passed:true,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}finally{for(const [k,v] of Object.entries(saved))if(v!==undefined)V.set(k,v);V.syncSettings();}
