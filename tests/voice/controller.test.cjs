process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const core=require('../../addon/voice/core.js');
const tick=()=>new Promise(r=>setTimeout(r,0));
function setup(){
 const prefs=new Map(),errors=[];
 const host={setTimeout,clearTimeout,setInterval,clearInterval};
 const context={PaperVoiceCore:core,PaperVoiceShortcuts:require('../../addon/voice/shortcuts.js'),Services:{prefs:{savePrefFile(){}}},Components:{utils:{waiveXrays:x=>x}},PaperVoiceTranslation:{},Zotero:{Prefs:{get:k=>prefs.get(k),set:(k,v)=>prefs.set(k,v)},getMainWindow:()=>host,logError:e=>errors.push(e)},console};
 context.PaperVoiceSelectionUI={watchAnchor:()=>()=>{},updateButton(button,text){button.textContent=text;},create(c,d,button){return {card:button};}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('addon/voice/main.js','utf8'),context);
 for(const file of ['pipeline.js','stream-player.js','performance.js'])vm.runInContext(fs.readFileSync('addon/voice/'+file,'utf8'),context);
 const p=context.PaperVoice;p.watchToolbar=()=>{};p.normalizeToolbar=()=>{};p.showPanel=()=>{};p.ensurePanel=()=>{};p.updatePanels=()=>{};p.set('speechLanguage','en');p.set('translation',false);
 const generated=[],played=[],nativePlay=p.playAudio;
 p.ensureWorker=async()=>{};p.engineRoot=()=>'/test/engine';p.scheduleWorkerIdle=()=>{};
 p.requestSpeech=text=>new Promise((resolve,reject)=>generated.push({text,resolve:()=>resolve({audio:text,duration:1}),reject}));
 p.playAudio=async audio=>{played.push(audio)};
 return {p,generated,played,errors,host,nativePlay,context};
}
test('rapid re-selection only plays the latest text',async()=>{
 const {p,generated,played}=setup();const a=p.speak('First selection',{});await tick();
 const b=p.speak('Second selection',{});const c=p.speak('Latest selection',{});
 generated[0].resolve();await tick();assert.equal(generated.length,2);assert.equal(generated[1].text,'Latest selection');
 generated[1].resolve();await Promise.all([a,b,c]);assert.deepEqual(played,['Latest selection']);
});
test('stop during synthesis prevents all playback',async()=>{
 const {p,generated,played}=setup();const a=p.speak('Pending sentence',{});await tick();p.stop();generated[0].resolve();await a;assert.deepEqual(played,[]);assert.equal(p.state,'idle');
});
test('prefetched old paragraph cannot play after a new selection',async()=>{
 const {p,generated,played}=setup();let finish;
 p.playAudio=audio=>{played.push(audio);return new Promise(r=>{finish=r;p.audioDone=r;});};
 const a=p.speak(Array.from({length:30},(_,i)=>'The retina is a complex tissue '+i+'.').join(' '),{});await tick();generated[0].resolve();await tick();
 assert.equal(generated.length,2);const b=p.speak('New selected sentence',{});generated[1].resolve();await tick();
 assert.equal(generated[2].text,'New selected sentence');generated[2].resolve();await tick();finish();await Promise.all([a,b]);
 assert.equal(played.length,2);assert.equal(played[1],'New selected sentence');
});
test('synthesis error is shown and does not produce audio',async()=>{
 const {p,generated,played}=setup();const a=p.speak('A sentence',{});await tick();generated[0].reject(new Error('engine failed'));await a;
 assert.equal(p.state,'error');assert.equal(p.status,'engine failed');assert.deepEqual(played,[]);
});
test('selection rerenders debounce and avoid duplicate speech',async()=>{
 const {p}=setup();p.set('auto',true);p.set('mode','selection');p.translateSelection=()=>{};let calls=[];p.speak=async text=>calls.push(text);
 const doc={createElement:()=>({dataset:{},style:{},setAttribute(){},addEventListener(){}})};
 const e={doc,reader:{},params:{annotation:{text:'Selected words',position:{pageIndex:0}}},append(){}};
 p.onSelection(e);p.onSelection(e);p.onSelection(e);await new Promise(r=>setTimeout(r,330));assert.deepEqual(calls,['Selected words']);
});
test('turning off auto prevents delayed selection from speaking',async()=>{
 const {p}=setup();p.translateSelection=()=>{};let calls=0;p.speak=async()=>calls++;
 p.onSelection({doc:{createElement:()=>({dataset:{},style:{},setAttribute(){},addEventListener(){}})},reader:{},params:{annotation:{text:'Selected words'}},append(){}});
 p.set('auto',false);await new Promise(r=>setTimeout(r,330));assert.equal(calls,0);
});
test('paragraph repeats exact count and reuses generated audio',async()=>{
 const {p,played}=setup();p.set('mode','paragraph');p.set('repeat',3);let count=0;
 p.requestSpeech=async text=>{count++;return {audio:text}};
 await p.speak('First sentence. Second sentence.',{});
 assert.deepEqual(played,['First sentence.','Second sentence.','First sentence.','Second sentence.','First sentence.','Second sentence.']);assert.equal(count,2);
});
test('single sentence repetition and next sentence navigation',async()=>{
 const {p,played}=setup();p.set('mode','sentence');p.set('repeat',2);p.requestSpeech=async text=>({audio:text});
 await p.speak('First sentence. Second sentence.',{});assert.deepEqual(played,['First sentence.','First sentence.']);
 p.sentenceIndex=1;await p.speak(p.lastText,{},false,true);assert.deepEqual(played.slice(2),['Second sentence.','Second sentence.']);
});
test('infinite loop can always stop',async()=>{
 const {p,played}=setup();p.set('mode','paragraph');p.set('repeat',0);p.requestSpeech=async text=>({audio:text});
 p.playAudio=async text=>{played.push(text);if(played.length===4)p.stop();};await p.speak('One sentence.',{});assert.equal(played.length,4);assert.equal(p.state,'idle');
});
test('whole document reads pages in order and skips blank scans',async()=>{
 const {p,played}=setup();p.requestSpeech=async text=>({audio:text});const pages=[];
 const r={navigate:({pageIndex})=>pages.push(pageIndex),_internalReader:{_primaryView:{_iframeWindow:{PDFViewerApplication:{pdfDocument:{numPages:3,getPage:async n=>({getTextContent:async()=>({items:n===2?[]:[{str:`Page ${n}.`,hasEOL:true}]})})}}}}}};
 await p.startDocument(r);assert.deepEqual(played,['Page 1.','Page 3.']);assert.deepEqual(pages,[0,2]);assert.equal(p.documentEmptyPages,1);
});
test('current-page start ignores stale initial view state; resume retains sentence position',async()=>{
 const {p,played}=setup();p.requestSpeech=async text=>({audio:text});
 const r={itemID:42,navigate(){},_internalReader:{_primaryView:{_viewState:{pageIndex:0},_iframeWindow:{PDFViewerApplication:{pdfViewer:{currentPageNumber:2},pdfDocument:{numPages:3,getPage:async n=>({getTextContent:async()=>({items:[{str:`Page ${n}. Final sentence ${n}.`}]})})}}}}}};
 await p.startDocument(r,'current');assert.deepEqual(played,['Page 2.','Final sentence 2.','Page 3.','Final sentence 3.']);played.length=0;
 p.set('progress.42',JSON.stringify({pageIndex:1,unitInPage:1}));await p.startDocument(r,'resume');assert.deepEqual(played,['Final sentence 2.','Page 3.','Final sentence 3.']);
 p.set('progress.42','corrupt');played.length=0;await p.startDocument(r,'resume');assert.equal(played[0],'Page 1.');
});
test('speech drops citations while keeping original sentence for highlighting',async()=>{
 const {p,played}=setup();let highlighted=[];p.requestSpeech=async text=>({audio:text});p.highlightSentence=async(r,unit)=>highlighted.push(unit.sentenceText||unit.text);
 await p.speak('Retinal cells [1–3] detect light (Smith et al., 2020).',{});
 assert.deepEqual(played,['Retinal cells detect light.']);assert.match(highlighted[0],/\[1–3\]/);
 played.length=0;await p.speak('[12]',{});assert.equal(played.length,0);assert.equal(p.state,'idle');
});
function progressReader(id=42){return {itemID:id,navigate(){},_internalReader:{_primaryView:{_iframeWindow:{PDFViewerApplication:{pdfViewer:{currentPageNumber:1},pdfDocument:{numPages:2,getPage:async n=>({getTextContent:async()=>({items:[{str:n===1?'First sentence. Second sentence.':'Neural signals travel to the brain. The final sentence.'}]})})}}}}}};}
test('selected letter starts at its containing sentence and continues to the end',async()=>{
 const {p,played}=setup(),r=progressReader();p.requestSpeech=async text=>({audio:text});
 p.selectionContexts.set(r,{text:'e',pageIndex:0,anchorOffset:core.anchorText('First sentence. S').length});
 await p.startDocument(r,'selection');assert.deepEqual(played,['Second sentence.','Neural signals travel to the brain.','The final sentence.']);
});
test('selected start never substitutes the first occurrence when a letter is ambiguous',async()=>{
 const {p,played}=setup(),r=progressReader();p.requestSpeech=async text=>({audio:text});
 p.selectionContexts.set(r,{text:'e',pageIndex:0});await p.startDocument(r,'selection');assert.equal(played.length,0);assert.match(p.status,/重新划选/);
 await p.startDocument(progressReader(43),'selection');assert.equal(played.length,0);assert.match(p.status,/请先/);
});
test('resume follows the latest actual reading in every mode, including partial sentences',async()=>{
 const {p,played}=setup(),r=progressReader();p.requestSpeech=async text=>({audio:text});
 p.playAudio=async text=>{p.rememberPlayback(p.pendingProgress);played.push(text);};
 for(const mode of ['selection','paragraph','sentence']){
  p.set('mode',mode);p.set('repeat',1);p.selectionContexts.set(r,{text:'travel to the brain.',pageIndex:1});
  await p.speak('travel to the brain.',r);
  const saved=JSON.parse(p.get('progress.42'));assert.equal(saved.pageIndex,1);assert.equal(saved.mode,mode);assert.ok(mode==='selection'?saved.anchorOffset>0:saved.anchorOffset>=0);
  p.set('mode','document');played.length=0;await p.startDocument(r,'resume');
  assert.deepEqual(played,mode==='paragraph'?['The final sentence.']:['Neural signals travel to the brain.','The final sentence.']);
 }
});
test('progress is isolated by PDF; loading, stopped and sample speech cannot overwrite it',async()=>{
 const {p,generated}=setup(),r=progressReader(),other=progressReader(43);p.set('mode','selection');p.set('progress.42','original');
 p.selectionContexts.set(r,{text:'First sentence.',pageIndex:0});
 const speech=p.speak('First sentence.',r);await tick();assert.equal(p.get('progress.42'),'original');p.stop();generated[0].resolve();await speech;
 p.rememberPlayback({reader:r,unit:{pageIndex:0,text:'Old'},generation:p.generation-1,mode:'selection'});assert.equal(p.get('progress.42'),'original');
 p.requestSpeech=async text=>({audio:text});p.playAudio=async()=>p.rememberPlayback(p.pendingProgress);
 await p.speak('A sample voice.',r,true);assert.equal(p.get('progress.42'),'original');
 await p.speak('First sentence.',other);assert.equal(p.get('progress.42'),'original');assert.equal(JSON.parse(p.get('progress.43')).text,'First sentence.');
});
test('ordinary PDF pointer gestures do not cancel full document playback',()=>{
 const {p}=setup();let down;
 const inner={defaultView:{addEventListener(){}},addEventListener:(event,handler)=>{if(event==='pointerdown')down=handler;}};
 const outer={defaultView:{addEventListener(){}},body:{},addEventListener(){},querySelectorAll:()=>[{contentDocument:inner}],querySelector:()=>({})};
 const r={_iframeWindow:{document:outer}};p.attachReader(r);p.currentReader=r;p.playbackMode='document';p.state='playing';const generation=p.generation;
 down({target:{closest:()=>null}});assert.equal(p.generation,generation);assert.equal(p.state,'playing');
 p.playbackMode='selection';down({target:{closest:()=>null}});assert.equal(p.state,'playing');
});

test('pausing before media play resolves remains paused and does not save unheard progress',async()=>{
 const {p,host,nativePlay}=setup();let rejectPlay;
 host.atob=()=>'';host.Blob=class {};host.URL={createObjectURL:()=> 'blob:test',revokeObjectURL(){}};
 host.Audio=class {play(){return new Promise((resolve,reject)=>{rejectPlay=reject;});}pause(){}removeAttribute(){}load(){}};
 p.pendingProgress={reader:{itemID:42},unit:{pageIndex:0,text:'Sentence.'},generation:p.generation};
 const audio=nativePlay.call(p,'',{},p.generation,'Playing');p.togglePause();rejectPlay(new Error('AbortError'));await tick();
 assert.equal(p.state,'paused');assert.equal(p.get('progress.42'),undefined);p.stop();await audio;
});

const navigationUnits=[
 {text:'First fragment',pageIndex:0,anchorOffset:0,sentenceId:0,paragraphId:0},
 {text:'continues here.',pageIndex:1,anchorOffset:0,sentenceId:0,paragraphId:0},
 {text:'Second sentence.',pageIndex:1,anchorOffset:14,sentenceId:1,paragraphId:0},
 {text:'New paragraph.',pageIndex:1,anchorOffset:29,sentenceId:2,paragraphId:1}
];
for(const target of ['sentence','paragraph','document'])test('hot switch to '+target+' preserves audio then respects boundary',async()=>{
 const {p,played}=setup();const reader={navigate:async()=>{}};p.set('mode','sentence');p.currentReader=reader;
 p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 let finish;p.playAudio=async text=>{played.push(text);p.state='playing';if(played.length===1)await new Promise(r=>{finish=r});};
 const task=p.runUnits(target==='document'?navigationUnits.slice(0,2):navigationUnits,reader,p.generation,{mode:'document',loops:1});await tick();
 p.set('mode',target==='document'?'sentence':'document');const generation=p.generation;p.setMode(target);
 assert.equal(p.generation,generation);assert.equal(played.length,1);assert.equal(p.state,'playing');finish();await task;
 assert.equal(played.length,target==='sentence'?2:target==='paragraph'?3:4);
});
test('last mode switch wins; stop cancels pending continuation',async()=>{
 const {p,played}=setup();p.currentReader={};p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});let finish;
 p.playAudio=async text=>{played.push(text);p.state='playing';await new Promise(r=>{finish=r;p.audioDone=r});};
 const task=p.runUnits(navigationUnits,{navigate:async()=>{}},p.generation,{mode:'document',loops:1});await tick();p.setMode('sentence');p.setMode('paragraph');assert.equal(p.session.pendingMode,'paragraph');p.stop();await task;assert.equal(played.length,1);
});
test('selection repeat is independent and caches speech',async()=>{
 const {p,played}=setup();p.set('mode','selection');p.set('selectionRepeat',3);let count=0;p.requestSpeech=async text=>{count++;return {audio:text}};await p.speak('Selected sentence.',{});assert.equal(played.length,3);assert.equal(count,1);
});
test('navigation groups sentence fragments across pages and moves by paragraph',()=>{
 assert.equal(core.scopeUnits(navigationUnits,navigationUnits[1],'sentence').length,2);
 assert.equal(core.scopeUnits(navigationUnits,navigationUnits[1],'paragraph',1)[0].text,'New paragraph.');
 assert.equal(core.scopeUnits(navigationUnits,navigationUnits[3],'document',-1).length,4);
 assert.equal(core.scopeUnits(navigationUnits,navigationUnits[0],'paragraph',-1).length,0);
});

test('mode selection while document is loading is applied when queue becomes ready',async()=>{
 const {p,played}=setup();p.state='loading';p.currentReader={navigate:async()=>{}};p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 p.setMode('sentence');const generation=p.generation;assert.equal(p.state,'loading');
 await p.runUnits(navigationUnits,p.currentReader,generation,{mode:'document',loops:1});assert.equal(played.length,2);
});

test('switch to document during preparation keeps the selected starting location',async()=>{
 const {p,played}=setup();p.state='loading';p.currentReader={navigate:async()=>{}};p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 p.setMode('document');await p.runUnits(navigationUnits.slice(2,3),p.currentReader,p.generation,{mode:'sentence',loops:1});assert.deepEqual(played,['Second sentence.','New paragraph.']);
});
for(const mode of ['sentence','paragraph'])test('a selected word expands to its containing '+mode,async()=>{
 const {p,played}=setup();p.set('mode',mode);p.set('repeat',1);p.requestSpeech=async text=>({audio:text});p.documentUnits=async()=>navigationUnits;
 const r={_internalReader:{_primaryView:{_iframeWindow:{PDFViewerApplication:{pdfDocument:{numPages:2,getPage:async n=>({getTextContent:async()=>({items:[{str:n===1?'First fragment':'continues here. Second sentence.'}]})})}}}}}};
 p.selectionContexts.set(r,{text:'here',pageIndex:1,anchorOffset:9});
 await p.speak('here',r);assert.deepEqual(played,navigationUnits.slice(0,mode==='sentence'?2:3).map(u=>u.text));
});
test('selection mode keeps the selected word',async()=>{
 const {p,played}=setup();p.requestSpeech=async text=>({audio:text});await p.speak('retina',{});assert.deepEqual(played,['retina']);
});
test('ambiguous selected word without coordinates does not jump to first occurrence',async()=>{
 const {p,played}=setup();p.set('mode','sentence');p.documentUnits=async()=>navigationUnits;
 const r={_internalReader:{_primaryView:{_iframeWindow:{PDFViewerApplication:{pdfDocument:{getPage:async()=>({getTextContent:async()=>({items:[{str:'Repeated word. Repeated word.'}]})})}}}}}};
 p.selectionContexts.set(r,{text:'word',pageIndex:0});await p.speak('word',r);assert.equal(p.state,'error');assert.equal(played.length,0);
});
test('speech language switching restores a voice per language without stopping playback',()=>{const {p}=setup();p.syncSettings=()=>{};p.setStatus=()=>{};p.set('voice','bm_george');p.state='playing';const generation=p.generation;p.setSpeechLanguage('zh');assert.equal(p.get('voice'), 'zm_yunxi');p.set('voice','zm_yunxi');p.setSpeechLanguage('ja');assert.equal(p.get('voice'),'jf_tebukuro');p.setSpeechLanguage('zh');assert.equal(p.get('voice'),'zm_yunxi');p.setSpeechLanguage('en');assert.equal(p.get('voice'),'bm_george');assert.equal(p.generation,generation);assert.equal(p.state,'playing');});
test('Unicode selections are accepted by playback',async()=>{for(const text of ['视网膜感受光线。','網膜は光を感知します。','La rétine détecte la lumière.']){const {p,played}=setup();p.requestSpeech=async text=>({audio:text});await p.speak(text,{});assert.equal(played.join(''),text);}});
test('automatic reading switches voices and translation source between language paragraphs',async()=>{
 const {p}=setup(),spoken=[],translated=[];p.set('speechLanguage','auto');p.set('translation',true);p.requestSpeech=async(text,voice)=>{spoken.push({text,voice});return{audio:text};};p.translate=async(text,language)=>{translated.push({text,language});return {text:'Translation'};};p.showTranslation=()=>{};p.syncSettings=()=>{};p.documentUnits=async()=>[];
 await p.runUnits([{text:'视网膜将光线转化为神经信号。',paragraphId:1},{text:'網膜は光を神経信号に変換します。',paragraphId:2},{text:'La rétine transforme la lumière en signaux nerveux.',paragraphId:3}],{},p.generation,{mode:'selection',loops:1});
 assert.deepEqual(spoken.map(x=>x.voice),['zm_yunxi','jf_tebukuro','ff_siwis']);assert.deepEqual(translated.map(x=>x.language),['zh','ja','fr']);
});
test('automatic reading prompts for uncertain or unsupported language without generating wrong audio',async()=>{
 for(const text of ['RNA','Hola, este documento está escrito en español.']){const {p}=setup();p.set('speechLanguage','auto');p.documentUnits=async()=>[];let count=0;p.requestSpeech=async()=>{count++;return{audio:'x'}};await p.speak(text,{});assert.equal(count,0);assert.equal(p.state,'error');assert.match(p.status,/手动选择/);}
});
test('single click toggles translated audio without changing target; double click toggles captions only',()=>{
 const {p,host}=setup();let job,cleared=0;host.setTimeout=fn=>{job=fn;return 1};host.clearTimeout=()=>{job=null;cleared++};p.syncSettings=()=>{};p.hideTranslation=()=>{};p.refreshTranslation=()=>{};p.setStatus=()=>{};p.translationVoiceLanguage=target=>!target||['zh-Hans','ja','fr','en'].includes(target)?'en':null;p.toggleTranslation=enabled=>p.set('translation',enabled);
 p.quickTranslationClick({detail:1});assert.equal(p.get('readTranslation',false),false);job();assert.equal(p.get('readTranslation'),true);assert.equal(p.get('translationTarget','zh-Hans'),'zh-Hans');
 p.quickTranslationClick({detail:1});job();assert.equal(p.get('readTranslation'),false);
 p.quickTranslationClick({detail:1});p.quickTranslationClick({detail:2});p.quickTranslationDoubleClick();assert.equal(job,null);assert.equal(p.get('translation'),true);assert.equal(p.get('readTranslation'),false);assert.ok(cleared>0);
 p.quickTranslationDoubleClick();assert.equal(p.get('translation'),false);
 p.set('readTranslation',true);p.setTranslationTarget('de');assert.equal(p.get('translationTarget'),'de');assert.equal(p.get('readTranslation'),true);p.setReadTranslation(false);p.setTranslationTarget('de');assert.equal(p.get('translationTarget'),'de');
 p.quickTranslationClick({detail:1});p.stop();assert.equal(job,null);
});
test('new installation defaults to translation while an explicit off preference remains off',()=>{const {p,context}=setup();context.Zotero.Prefs.set(p.prefix+'translation',undefined);assert.equal(p.get('translation',false),true);p.set('translation',false);assert.equal(p.get('translation',true),false);});
for(const mode of ['document','paragraph'])test(mode+' sentence replay and navigation preserve reading mode and continuation',async()=>{
 const {p,played}=setup(),reader={navigate:async()=>{}};p.set('mode',mode);p.set('repeat',1);p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 for(const [delta,current,expected] of [[0,1,mode==='document'?[0,1,2,3]:[0,1,2]],[-1,2,mode==='document'?[0,1,2,3]:[0,1,2]],[1,1,mode==='document'?[2,3]:[2]],[1,2,[3]]]){
  p.currentUnit=navigationUnits[current];played.length=0;await p.navigateScope(delta,reader,'sentence');
  assert.equal(p.get('mode'),mode);assert.deepEqual(played,expected.map(i=>navigationUnits[i].text));
 }
});
test('paragraph sentence jump repeats the whole paragraph on subsequent cycles',async()=>{
 const {p,played}=setup();p.set('mode','paragraph');p.set('repeat',2);p.currentUnit=navigationUnits[2];p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 await p.navigateScope(0,{navigate:async()=>{}},'sentence');assert.deepEqual(played,[2,0,1,2].map(i=>navigationUnits[i].text));
});
test('sentence boundary navigation leaves active playback uninterrupted',async()=>{
 const {p,played}=setup();p.set('mode','document');p.state='playing';p.documentUnits=async()=>navigationUnits;const generation=p.generation;
 p.currentUnit=navigationUnits[0];await p.navigateScope(-1,{},'sentence');p.currentUnit=navigationUnits[3];await p.navigateScope(1,{},'sentence');
 assert.equal(p.generation,generation);assert.equal(p.state,'playing');assert.equal(played.length,0);
});

function keyboardReader(p){
 const handlers=[];const doc={body:{},defaultView:{addEventListener:(name,fn)=>{if(name==='keydown')handlers.push(fn);}},addEventListener(){},querySelectorAll:()=>[],querySelector:()=>({})};
 const reader={_iframeWindow:{document:doc}};p.attachReader(reader);p.currentReader=reader;p.currentUnit=navigationUnits[2];p.state='playing';p.set('mode','document');
 const send=(key,options={})=>{
  const event={key,code:key,altKey:false,shiftKey:false,ctrlKey:false,metaKey:false,isComposing:false,repeat:false,target:{closest:()=>null},preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...options};handlers[0](event);return event;
 };return {reader,send};
}
test('six reading keys route to sentence and paragraph navigation while playing or paused',()=>{
 const {p}=setup(),{reader,send}=keyboardReader(p),calls=[];p.navigateScope=(delta,r,scope)=>calls.push({delta,r,scope});
 const cases=[['ArrowUp',false,'sentence',-1],['ArrowDown',false,'sentence',1],['ArrowUp',true,'paragraph',-1],['ArrowDown',true,'paragraph',1],['ArrowLeft',false,'sentence',0],['ArrowRight',false,'paragraph',0]];
 for(const state of ['playing','paused','loading'])for(const [key,altKey,scope,delta] of cases){p.state=state;const e=send(key,{altKey});assert.equal(e.prevented,true);assert.equal(e.stopped,true);assert.deepEqual(calls.at(-1),{delta,r:reader,scope});}
});
test('navigation keys preserve editor controls modified arrows and inactive readers',()=>{
 const {p}=setup(),{send}=keyboardReader(p);let calls=0;p.navigateScope=()=>calls++;
 for(const selector of ['input','textarea','select','[contenteditable]','[role="textbox"]','button','[data-field="playbackTools"]','[role="slider"]']){
  const target={closest:s=>s.includes(selector==='[contenteditable]'?'[contenteditable]':selector)?{}:null};
  const e=send('ArrowUp',{target});assert.equal(e.prevented,undefined,selector);
 }
 for(const opt of [{shiftKey:true},{ctrlKey:true},{metaKey:true},{isComposing:true}])assert.equal(send('ArrowDown',opt).prevented,undefined);
 assert.equal(send('ArrowLeft',{altKey:true}).prevented,undefined);
 p.currentReader={};assert.equal(send('ArrowDown').prevented,undefined);
 p.state='idle';assert.equal(send('ArrowDown').prevented,undefined);
 assert.equal(calls,0);
});
test('held navigation keys do not skip repeatedly or scroll the PDF',()=>{
 const {p}=setup(),{send}=keyboardReader(p);let calls=0;p.navigateScope=()=>calls++;
 send('ArrowDown');for(let i=0;i<5;i++){const e=send('ArrowDown',{repeat:true});assert.equal(e.prevented,true);assert.equal(e.stopped,true);}assert.equal(calls,1);
});
test('Space and Escape remain available after navigation shortcuts are added',()=>{
 const {p}=setup(),{send}=keyboardReader(p);let pauses=0,stops=0;p.togglePause=()=>pauses++;p.stop=()=>stops++;
 assert.equal(send(' ',{code:'Space'}).prevented,true);assert.equal(send('Escape').prevented,true);assert.equal(pauses,1);assert.equal(stops,1);
});
for(const mode of ['sentence','selection'])test('paragraph shortcut reads a whole paragraph in '+mode+' mode without changing mode',async()=>{
 const {p,played}=setup(),reader={navigate:async()=>{}};p.set('mode',mode);p.set('repeat',1);p.set('selectionRepeat',1);p.currentReader=reader;p.currentUnit=navigationUnits[2];p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 await p.navigateScope(0,reader,'paragraph');assert.deepEqual(played,navigationUnits.slice(0,3).map(u=>u.text));assert.equal(p.get('mode'),mode);
});
test('selection navigation expands selected fragments to full sentences',async()=>{
 const {p,played}=setup(),reader={navigate:async()=>{}};p.set('mode','selection');p.currentReader=reader;p.currentUnit=navigationUnits[1];p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 await p.navigateScope(0,reader,'sentence');assert.deepEqual(played,['First fragment','continues here.']);assert.equal(p.get('mode'),'selection');
});

function restoredFrom(p,reader){
 const {p:next,played}=setup();next.set('readingSession',p.get('readingSession'));
 next.loadReadingSession();next.restoreReadingSession(reader);next.documentUnits=async()=>navigationUnits;
 next.synthesize=async text=>({audio:text});return {p:next,played};
}
for(const mode of ['selection','sentence','paragraph','document'])test('upgrade restores '+mode+' paused and replays a cross-page sentence from its start',async()=>{
 const {p}=setup(),r={itemID:84,navigate:async()=>{}};
 p.currentReader=r;p.playbackMode=mode;p.currentUnit=navigationUnits[1];p.state='playing';
 p.session={units:mode==='document'?navigationUnits:navigationUnits.slice(0,3),remainingLoops:2};
 p.lastText='This stale selection must not replace the actual queue.';
 p.saveReadingSession();const fresh=restoredFrom(p,r);
 assert.equal(fresh.p.state,'paused');assert.equal(fresh.p.playbackMode,mode);assert.equal(fresh.played.length,0);assert.equal(fresh.p.audio,null);
 await fresh.p.togglePause();
 assert.deepEqual(fresh.played,mode==='document'?navigationUnits.map(u=>u.text):[...navigationUnits.slice(0,3),...navigationUnits.slice(0,3)].map(u=>u.text));
 assert.equal(fresh.p.get('readingSession'),'null');
});
test('saved session cannot attach to another PDF; explicit stop discards restoration',()=>{
 const {p}=setup(),r={itemID:84};p.set('readingSession',JSON.stringify({version:1,itemID:84,mode:'sentence',anchor:navigationUnits[1],units:navigationUnits.slice(0,2)}));
 p.loadReadingSession();p.restoreReadingSession({itemID:85});assert.equal(p.state,'idle');
 p.restoreReadingSession(r);assert.equal(p.state,'paused');p.stop();
 const fresh=restoredFrom(p,r);assert.equal(fresh.p.state,'idle');assert.ok(!fresh.p.currentUnit);
});
test('stop while reconstructing a restored document cancels delayed playback',async()=>{
 const {p}=setup(),r={itemID:84};p.set('readingSession',JSON.stringify({version:1,itemID:84,mode:'document',anchor:navigationUnits[1]}));
 p.loadReadingSession();p.restoreReadingSession(r);let resolve;p.documentUnits=()=>new Promise(r=>{resolve=r;});
 const task=p.togglePause();p.stop();resolve(navigationUnits);await task;assert.equal(p.state,'idle');assert.equal(p.session,null);
});
test('restored mode can change before resume without losing its anchor',async()=>{
 const {p,played}=setup(),r={itemID:84,navigate:async()=>{}};
 p.set('readingSession',JSON.stringify({version:1,itemID:84,mode:'sentence',anchor:navigationUnits[1],units:navigationUnits.slice(0,2),loops:2}));
 p.loadReadingSession();p.restoreReadingSession(r);p.setMode('document');p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 await p.togglePause();assert.deepEqual(played,navigationUnits.map(u=>u.text));
});
test('sample playback and stale onplaying callbacks cannot save a recoverable session',()=>{
 const {p}=setup();p.currentReader={itemID:84};p.currentUnit=navigationUnits[0];p.state='playing';p.session={sample:true,units:navigationUnits};p.saveReadingSession();assert.equal(p.get('readingSession'),undefined);
 p.session.sample=false;p.rememberPlayback({generation:p.generation-1,reader:p.currentReader,unit:p.currentUnit});assert.equal(p.get('readingSession'),undefined);
});
test('malformed checkpoints do not restore or throw',()=>{
 const {p}=setup();for(const raw of ['{','null','{}',JSON.stringify({version:1,itemID:84,mode:'invalid',anchor:navigationUnits[0]})]){p.set('readingSession',raw);p.loadReadingSession();p.restoreReadingSession({itemID:84});assert.equal(p.state,'idle');}
});
test('rapid pause and resume during restore creates only one playback queue',async()=>{
 const {p,played}=setup(),r={itemID:84,navigate:async()=>{}};p.set('readingSession',JSON.stringify({version:1,itemID:84,mode:'document',anchor:navigationUnits[1]}));p.loadReadingSession();p.restoreReadingSession(r);
 let resolve,requests=0;p.documentUnits=()=>{requests++;return new Promise(r=>{resolve=r;});};p.requestSpeech=async text=>({audio:text});
 const task=p.togglePause();p.togglePause();await p.togglePause();resolve(navigationUnits);await task;
 assert.equal(requests,1);assert.deepEqual(played,navigationUnits.map(u=>u.text));
});
test('mode change during document reconstruction takes effect at the saved sentence',async()=>{
 const {p,played}=setup(),r={itemID:84,navigate:async()=>{}};p.set('readingSession',JSON.stringify({version:1,itemID:84,mode:'document',anchor:navigationUnits[1]}));p.loadReadingSession();p.restoreReadingSession(r);
 let resolve;p.documentUnits=()=>new Promise(r=>{resolve=r;});p.requestSpeech=async text=>({audio:text});
 const task=p.togglePause();p.setMode('sentence');resolve(navigationUnits);await task;assert.deepEqual(played,navigationUnits.slice(0,2).map(u=>u.text));
});
test('old-version progress migrates once and uses the latest PDF position',async()=>{
 const {p,played,context}=setup(),r={itemID:84,navigate:async()=>{}},other={itemID:85};context.Zotero.Reader={_readers:[other,r]};
 p.set('progress.85',JSON.stringify({...navigationUnits[0],mode:'document',updatedAt:1}));p.set('progress.84',JSON.stringify({...navigationUnits[1],mode:'sentence',updatedAt:2}));
 p.loadReadingSession();p.restoreReadingSession(other);assert.equal(p.state,'idle');p.restoreReadingSession(r);assert.equal(p.state,'paused');
 p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});await p.togglePause();assert.deepEqual(played,navigationUnits.slice(0,2).map(u=>u.text));
 p.loadReadingSession();p.restoreReadingSession(r);assert.equal(p.state,'idle');
});
test('shutdown-related stop preserves checkpoint while explicit Stop clears it',()=>{
 const {p}=setup();p.set('readingSession','saved');p.quitting=true;p.stop(false);assert.equal(p.get('readingSession'),'saved');p.quitting=false;p.stop();assert.equal(p.get('readingSession'),'null');
});

function translatedSetup(target='zh-Hans'){
 const result=setup(),p=result.p;p.set('readTranslation',true);p.set('translationTarget',target);p.syncSettings=()=>{};
 const translations=[],voices=[];p.translate=async(text,source,options)=>{translations.push({text,source,...options});return {text:({ja:'網膜は光を検出します。',fr:'La rétine détecte la lumière.',en:'The retina detects light.'}[options.target]||'视网膜能够感知光线。'),source:'test'};};
 p.requestSpeech=async(text,voice)=>{voices.push(voice);return {audio:text,duration:10};};
 return {...result,translations,voices};
}
test('translated narration uses target voices without changing original voice or source language',async()=>{
 for(const [target,voice] of [['zh-Hans','zm_yunxi'],['zh-Hant','zm_yunxi'],['ja','jf_tebukuro'],['fr','ff_siwis'],['en','af_heart']]){
  const {p,translations,voices,played}=translatedSetup(target);p.set('voice','af_heart');p.set('speechLanguage','auto');
  await p.speak('The retina detects light and sends signals to the brain.',{});
  assert.equal(voices[0],voice);assert.equal(translations[0].source,'en');assert.equal(p.get('voice'),'af_heart');assert.equal(p.activeSpeechLanguage,'en');
  assert.equal(played.length,1);if(target!=='en')assert.notEqual(played[0],'The retina detects light.');
 }
});
test('cross-page source fragments translate once and keep source progress/highlights',async()=>{
 const {p,translations,played}=translatedSetup(),r={itemID:42,navigate(){}},highlights=[];
 p.currentReader=r;p.highlightSentence=async(r,u)=>highlights.push(u.pageIndex);
 p.playAudio=async(audio,r,g,message,progress)=>{played.push(audio);p.state='playing';p.rememberPlayback(p.pendingProgress);progress(8);await tick();};
 const units=[{text:'The retina detects',sentenceId:0,pageIndex:0},{text:'light.',sentenceId:0,pageIndex:1}];
 await p.runUnits(units,r,p.generation,{mode:'document',loops:1});
 assert.equal(translations.length,1);assert.equal(translations[0].text,'The retina detects light.');assert.equal(played.length,1);assert.deepEqual(highlights,[0,1]);assert.equal(JSON.parse(p.get('progress.42')).pageIndex,1);
});
test('translated repetitions reuse audio and selection translates only scoped content',async()=>{
 const {p,played,translations,voices}=translatedSetup();p.set('mode','selection');p.set('selectionRepeat',2);
 await p.speak('selected words',{});assert.equal(played.length,2);assert.equal(voices.length,1);assert.ok(translations.every(x=>x.text==='selected words'));
});
test('changing target discards prefetched speech at next sentence',async()=>{
 const {p,played,voices}=translatedSetup();
 p.playAudio=async audio=>{played.push(audio);if(played.length===1)p.set('translationTarget','ja');};
 await p.speak('The retina detects light. Signals reach the brain.',{});
 assert.deepEqual(played,['视网膜能够感知光线。','網膜は光を検出します。']);assert.equal(voices.at(-1),'jf_tebukuro');
});
test('translation failure never falls back to reading the original',async()=>{
 const {p,played,voices}=translatedSetup();p.translate=async()=>{throw Error('Translation offline');};await p.speak('The retina detects light.',{});
 assert.equal(p.state,'error');assert.equal(played.length,0);assert.equal(voices.length,0);
});
test('stop while waiting for translation prevents later synthesis and playback',async()=>{
 const {p,played,voices}=translatedSetup();let resolve;p.translate=()=>new Promise(r=>resolve=r);
 const running=p.speak('The retina detects light.',{});await tick();p.stop();resolve({text:'视网膜。'});await running;
 assert.equal(played.length,0);assert.equal(voices.length,0);
});
test('unsupported target cannot silently choose an unrelated voice',async()=>{
 const {p,played,voices}=translatedSetup('de');await p.speak('The retina detects light.',{});
 assert.equal(p.state,'error');assert.equal(played.length,0);assert.equal(voices.length,0);
});
test('translation voice sample uses target voice without translating the sample',async()=>{
 const {p,voices,translations}=translatedSetup('ja');await p.speak('網膜は光を検出します。',{},true);
 assert.deepEqual(voices,['jf_tebukuro']);assert.equal(translations.length,0);
});
test('audio-language switch waits until the whole source sentence ends across fragments',async()=>{
 const {p,played,translations}=translatedSetup();p.set('readTranslation',false);
 const units=[{text:'The retina detects',sentenceId:0,pageIndex:0},{text:'light.',sentenceId:0,pageIndex:1},{text:'Signals reach the brain.',sentenceId:1,pageIndex:1}];
 p.playAudio=async audio=>{played.push(audio);if(played.length===1)p.set('readTranslation',true);};
 await p.runUnits(units,{navigate(){}},p.generation,{mode:'document',loops:1});
 assert.deepEqual(played,['The retina detects','light.','视网膜能够感知光线。']);assert.equal(translations.at(-1).text,'Signals reach the brain.');
});
test('long translated sentences are bounded for offline engine input',async()=>{
 const {p,played}=translatedSetup();p.translate=async()=>({text:'这是关于视网膜神经细胞的完整论述。'.repeat(160)});
 await p.speak('The retina detects light.',{});assert.ok(played.length>1);assert.ok(played.every(x=>x.length<=1000));assert.equal(played.join(''),'这是关于视网膜神经细胞的完整论述。'.repeat(160));
});
test('transparency is clamped, persisted, and updates caption surface only',()=>{
 const {p}=setup();p.syncSettings=()=>{};let css;p.caption={box:{style:{setProperty:(key,value)=>css={key,value}}}};
 p.setSurfaceTransparency(5);assert.equal(p.surfaceOpacity(),.95);assert.equal(css.value,'0.95');
 p.setSurfaceTransparency(120);assert.equal(p.get('surfaceTransparency'),10);p.setSurfaceTransparency(-1);assert.equal(p.surfaceOpacity(),1);
});
test('translated voice choice remains independent when target matches the saved source voice language',async()=>{
 for(const [target,sourceVoice,savedVoice] of [['en','af_heart','am_michael'],['zh-Hans','zm_yunxi','zf_xiaoxiao']]){
  const {p,voices}=translatedSetup(target);p.set('voice',sourceVoice);p.set('voiceFor_'+(target==='en'?'en':'zh'),savedVoice);
  await p.speak('The retina detects light.',{});assert.equal(voices[0],savedVoice);assert.equal(p.get('voice'),sourceVoice);
  voices.length=0;await p.speak('A preview sentence.',{},true);assert.equal(voices[0],savedVoice);
 }
});

test('selection popup shows preparation immediately and keeps its captured location',async()=>{
 const {p}=setup(),r=progressReader();p.set('auto',false);p.set('mode','document');p.set('documentStart','selection');
 let click,resolve,started,shown=false;const attrs={};
 const button={dataset:{},style:{},isConnected:true,addEventListener:(event,fn)=>{if(event==='click')click=fn},setAttribute:(k,v)=>attrs[k]=v};
 p.t=s=>s;p.showPanel=()=>shown=true;p.startDocument=reader=>{started=p.selectionContexts.get(reader);p.currentReader=reader;p.generation++;p.setStatus('正在读取 PDF 正文…','loading');return new Promise(r=>resolve=r);};
 p.translateSelection=()=>{};p.onSelection({reader:r,doc:{createElement:()=>button},params:{annotation:{text:'Second',position:{pageIndex:0,rects:[[1,2,3,4]]}}},append(){}});
 p.selectionContexts.set(r,{text:'wrong',pageIndex:1});
 const task=click({preventDefault(){},stopPropagation(){}});
 assert.equal(shown,false);assert.equal(started.text,'Second');assert.deepEqual(Array.from(started.position.rects[0]),[1,2,3,4]);assert.equal(button.disabled,false);assert.equal(button.textContent,'读取正文… · 点击取消');assert.equal(attrs['aria-busy'],'true');
 p.setStatus('未能准确定位选区，请在 PDF 中重新划选后再开始','error');resolve();await task;
 assert.equal(button.disabled,false);assert.equal(button.textContent,'重试朗读');assert.match(button.title,/定位/);
});

test('popup closes on actual audio playback, including after a scroll repositions it',async()=>{
 const {p,host,nativePlay}=setup();const annotation={text:'Original sentence.',position:{pageIndex:0,rects:[[1,2,3,4]]}},popup={annotation},state={primaryViewSelectionPopup:popup};let closed=0,cleared=0;
 const reader={_internalReader:{_state:state,_primaryView:{clearSelection:()=>cleared++,_onSetSelectionPopup:value=>{closed++;state.primaryViewSelectionPopup=value;}}}};
 host.atob=()=>'';host.Blob=class {};host.URL={createObjectURL:()=> 'blob:test',revokeObjectURL(){}};
 host.Audio=class {paused=false;play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}load(){}};
 p.currentReader=reader;p.t=s=>s;p.selectionAction={reader,generation:p.generation,popupKey:'primaryViewSelectionPopup',popup,button:{isConnected:true,dataset:{},setAttribute(){}}};
 const task=nativePlay.call(p,'',reader,p.generation,'Playing');assert.equal(closed,0);assert.equal(cleared,0);
 state.primaryViewSelectionPopup={annotation:JSON.parse(JSON.stringify(annotation)),rect:[1,2,3,4]};p.selectionAction.button.isConnected=false;p.updateSelectionAction();p.audio.onplaying();assert.equal(closed,1);assert.equal(cleared,1);p.stop();await task;
});
test('popup dismissal never closes a newer selection, other reader or cancelled request',()=>{
 const {p}=setup();const annotation={},popup={annotation};let closed=0,cleared=0;const reader={_internalReader:{_state:{primaryViewSelectionPopup:{annotation:{}}},_primaryView:{clearSelection:()=>cleared++,_onSetSelectionPopup:()=>closed++}}};
 p.selectionAction={reader,generation:p.generation,popupKey:'primaryViewSelectionPopup',popup,button:{isConnected:true}};
 p.dismissReadingSelectionPopup(reader,p.generation);p.dismissReadingSelectionPopup({},p.generation);p.dismissReadingSelectionPopup(reader,p.generation-1);assert.equal(closed,0);assert.equal(cleared,0);
});
test('selection translation uses the configured service and ignores stale selection results',async()=>{
 const {p}=setup(),reader={};p.set('mode','selection');p.t=s=>s;p.set('translationTarget','ja');p.set('translationProvider','google');p.translationLanguage=()=>({label:'日本語'});const pending=[];p.translate=(text,source,options)=>new Promise(resolve=>pending.push({text,source,options,resolve}));
 const ui=()=>({card:{isConnected:true,dataset:{}},heading:{},translation:{},retry:{setAttribute(){}},language:{setAttribute(){}},flag:{},languageGroup:{},languages:{children:[]},scopes:[]}),first={text:'The human retina transforms light.'},second={text:'Neural cells detect signals.'},a=ui(),b=ui();
 p.selectionContexts.set(reader,first);p.translateSelection(reader,first,a);await new Promise(r=>setTimeout(r,250));assert.equal(a.translation.textContent,'正在翻译…');assert.equal(pending[0].options.target,'ja');assert.equal(pending[0].options.provider,'google');
 p.selectionContexts.set(reader,second);p.translateSelection(reader,second,b);pending[0].resolve({text:'stale'});await tick();assert.notEqual(a.translation.textContent,'stale');await new Promise(r=>setTimeout(r,250));pending[1].resolve({text:'神経細胞'});await tick();assert.equal(b.translation.textContent,'神経細胞');assert.equal(b.card.dataset.translationState,'ready');
});
test('selection translation may be disabled and failures keep reading controls independent',async()=>{
 const {p}=setup(),r={},s={text:'Cells detect light.'},ui={card:{isConnected:true,dataset:{}},heading:{},translation:{},retry:{setAttribute(){}},language:{setAttribute(){}},flag:{},languageGroup:{},languages:{children:[]},scopes:[]};p.t=s=>s;p.translationLanguage=()=>({label:'简体中文'});p.set('selectionTranslation',false);let calls=0;p.translate=async()=>{calls++;throw Error('offline');};
 p.selectionContexts.set(r,s);p.translateSelection(r,s,ui);assert.equal(ui.translation.hidden,true);assert.equal(calls,0);p.set('selectionTranslation',true);p.translateSelection(r,s,ui);await new Promise(r=>setTimeout(r,250));assert.equal(ui.card.dataset.translationState,'error');assert.equal(ui.translation.textContent,'offline');assert.equal(ui.translation.title,'');assert.equal(ui.retry.hidden,false);assert.notEqual(p.state,'error');
});

test('primary captures the selected popup without opening the main panel',async()=>{
 const {p}=setup(),r=progressReader(),annotation={text:'Second',position:{pageIndex:0,rects:[[1,2,3,4]]}};let dismissed=0,shown=0;
 r._internalReader._state={primaryViewSelectionPopup:{annotation}};r._internalReader._primaryView.clearSelection=()=>dismissed++;
 r._internalReader._primaryView._onSetSelectionPopup=value=>r._internalReader._state.primaryViewSelectionPopup=value;
 p.selectionContexts.set(r,{text:'Second',position:annotation.position});p.showPanel=()=>shown++;p.speak=async(text,reader)=>{p.generation++;p.currentReader=reader;p.state='loading';};
 await p.primary(r);assert.equal(shown,0);assert.equal(dismissed,0);assert.equal(p.selectionAction.popup.annotation,annotation);
 p.dismissReadingSelectionPopup(r,p.generation);assert.equal(dismissed,1);assert.equal(r._internalReader._state.primaryViewSelectionPopup,null);
});
test('all paused mode transitions keep current audio and make the requested scope visible',()=>{
 for(const from of core.modes.map(x=>x.id))for(const to of core.modes.map(x=>x.id)){
  if(from===to)continue;const {p}=setup();p.t=x=>x;p.set('mode',from);p.state='paused';p.currentReader={};p.currentUnit=navigationUnits[1];p.session={units:navigationUnits};p.documentUnits=async()=>navigationUnits;
  const audio=p.audio={},generation=p.generation;p.setMode(to);assert.equal(p.get('mode'),to);assert.equal(p.session.pendingMode,to);assert.equal(p.audio,audio);assert.equal(p.generation,generation);assert.equal(p.state,'paused');assert.match(p.status,/已切换/);
 }
});
test('custom Ctrl and Cmd bindings dispatch while editor and recording controls retain input',()=>{
 const {p}=setup(),{send}=keyboardReader(p);p.t=x=>x;p.syncSettings=()=>{};p.setShortcut('nextSentence','Ctrl+KeyJ');p.setShortcut('replaySentence','Meta+KeyR');const calls=[];p.navigateScope=(delta,r,scope)=>calls.push([delta,scope]);
 assert.equal(send('j',{code:'KeyJ',ctrlKey:true}).prevented,true);assert.equal(send('r',{code:'KeyR',metaKey:true}).prevented,true);assert.deepEqual(calls,[[1,'sentence'],[0,'sentence']]);
 assert.equal(send('ArrowDown').prevented,undefined);assert.equal(send('j',{code:'KeyJ',ctrlKey:true,target:{closest:s=>s.includes('input,textarea')?{}:null}}).prevented,undefined);
});

test('switching from a loading document to selection cannot inherit the full document queue',async()=>{
 const {p,played}=setup();p.state='loading';p.set('mode','document');p.currentReader={navigate:async()=>{}};p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});p.setMode('selection');
 await p.runUnits(navigationUnits,p.currentReader,p.generation,{mode:'document',loops:1});assert.deepEqual(played,navigationUnits.slice(0,2).map(u=>u.text));
});
test('Mac Option paragraph shortcuts consume real Gecko AltGraph events before PDF scrolling',()=>{
 const {p,context}=setup();context.Zotero.isMac=true;const {send}=keyboardReader(p),calls=[];p.navigateScope=(delta,r,scope)=>calls.push([delta,scope]);
 for(const state of ['playing','paused','loading'])for(const [key,delta] of [['ArrowUp',-1],['ArrowDown',1]]){
  p.state=state;const e=send(key,{altKey:true,getModifierState:k=>k==='AltGraph'});assert.equal(e.prevented,true);assert.equal(e.stopped,true);assert.deepEqual(calls.at(-1),[delta,'paragraph']);
 }
});
test('playback buttons keep shortcuts available while settings and navigation controls retain their keys',()=>{
 const {p}=setup(),{send}=keyboardReader(p);let calls=0;p.navigateScope=()=>calls++;
 const transport={closest:s=>s.includes('[data-action="quickPause"]')?{}:s.includes('button')?{}:null};
 assert.equal(send('ArrowDown',{target:transport}).prevented,true);assert.equal(calls,1);
 const settings={closest:s=>s.includes('.pv-panel')?{}:null};assert.equal(send('ArrowDown',{target:settings}).prevented,undefined);
 const nav={closest:s=>s.includes('[data-field="playbackTools"]')?{}:null};assert.equal(send('ArrowUp',{target:nav}).prevented,undefined);
});
test('long terminal author citation never synthesizes a punctuation-only pause',async()=>{
 const {p,played}=setup(),text='The main ganglion cell types of the primate retina are small (ON and OFF) midget (parvocellular) cells (about 80% of foveal ganglion cells), large (ON and OFF) parasol (magnocellular) cells (about 10% of foveal ganglion cells), and koniocellular ganglion cells (Boycott and Dowling, 1969; Perry et al., 1984; Wässle and Boycott, 1991; Percival et al., 2013). More cells respond.';
 const units=core.layoutUnits([{pageIndex:0,text,height:800}]);const sent=[];p.requestSpeech=async speech=>{sent.push(speech);return {audio:speech};};
 await p.runUnits(units,{navigate:async()=>{}},p.generation,{mode:'document',loops:1});
 assert.match(played.slice(0,-1).join(' '),/koniocellular ganglion cells\.$/);assert.equal(played.at(-1),'More cells respond.');assert.deepEqual([...played].sort(),[...sent].sort());assert.ok(sent.every(core.hasSpeech));
});

test('one-shot selection launch overrides looping without changing saved preferences',async()=>{
 const {p}=setup(),r={};p.set('mode','selection');p.set('selectionRepeat',0);p.locateSelectionUnits=async()=>{};
 let playback;p.runUnits=async(units,reader,generation,options)=>{playback=options;};
 await p.beginSelectionReading(r,{text:'A single reading.'},null,null,{loops:1});
 assert.equal(playback.loops,1);assert.equal(p.get('selectionRepeat'),0);
});
test('one-shot sentence and paragraph launches override loops after resolving PDF selection',async()=>{
 for(const mode of ['sentence','paragraph']){const {p}=setup(),r=progressReader();p.set('mode',mode);p.set('repeat',0);const unit={text:'A single reading.',pageIndex:0,sentenceIndex:0,paragraphIndex:0};p.resolveSelection=async()=>unit;p.localUnits=async()=>[unit];let playback;p.runUnits=async(units,reader,generation,options)=>{playback=options;};await p.beginSelectionReading(r,{text:unit.text,pageIndex:0},null,null,{loops:1});assert.equal(playback.loops,1);assert.equal(p.get('repeat'),0);}
});

test('caption hover waits for every cross-page fragment before pausing and resumes at next sentence',async()=>{
 const {p,played}=setup(),reader={navigate:async()=>{}};p.currentReader=reader;p.requestSpeech=async text=>({audio:text});
 const units=[{text:'First fragment',sentenceId:1,pageIndex:0},{text:'finishes here.',sentenceId:1,pageIndex:1},{text:'Next sentence.',sentenceId:2,pageIndex:1}];
 p.playAudio=async text=>{played.push(text);p.state='playing';if(played.length===1)p.requestCaptionPause(reader);};
 const task=p.runUnits(units,reader,p.generation,{mode:'document',loops:1});await tick();await tick();
 assert.deepEqual(played,['First fragment','finishes here.']);assert.equal(p.state,'paused');assert.equal(p.currentUnit.text,units[1].text);assert.equal(typeof p.captionBoundaryResume,'function');
 p.releaseCaptionPause(reader);await task;assert.deepEqual(played,units.map(u=>u.text));assert.equal(p.state,'idle');
});
test('stop cancels a pending caption boundary pause and cannot resume obsolete audio',async()=>{
 const {p,played}=setup(),r={};p.currentReader=r;p.requestSpeech=async text=>({audio:text});p.playAudio=async text=>{played.push(text);p.state='playing';p.requestCaptionPause(r);};
 const task=p.runUnits([{text:'First.'},{text:'Next.'}],r,p.generation,{mode:'selection',loops:1});await tick();await tick();assert.equal(p.state,'paused');p.stop();await task;assert.deepEqual(played,['First.']);assert.equal(p.captionBoundaryResume,null);assert.equal(p.state,'idle');
});
test('caption hover ignores other readers, preview audio and paused sessions',()=>{
 const {p}=setup(),r={};p.currentReader=r;p.state='playing';p.requestCaptionPause({});assert.equal(p.captionPauseGeneration,undefined);p.session={sample:true};p.requestCaptionPause(r);assert.equal(p.captionPauseGeneration,undefined);p.session=null;p.state='paused';p.requestCaptionPause(r);assert.equal(p.captionPauseGeneration,undefined);
});
for(const scope of ['sentence','paragraph'])for(const count of [1,3,5])test(`caption ${scope} replay scopes exactly and repeats ${count} times in document mode`,async()=>{
 const {p,played}=setup();p.set('mode','document');p.set('repeat',10);p.currentUnit=navigationUnits[0];p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});
 const expected=core.scopeUnits(navigationUnits,navigationUnits[0],scope).map(u=>u.text);await p.replayScope(scope,count,{});assert.deepEqual(played,Array.from({length:count},()=>expected).flat());assert.equal(p.get('mode'),'document');
});
test('caption infinite replay remains stoppable',async()=>{
 const {p,played}=setup();p.currentUnit=navigationUnits[0];p.documentUnits=async()=>navigationUnits;p.requestSpeech=async text=>({audio:text});p.playAudio=async text=>{played.push(text);if(played.length===6)p.stop();};await p.replayScope('sentence',0,{});assert.equal(played.length,6);assert.equal(p.state,'idle');
});
test('changing translation voice discards prefetched voice at next sentence',async()=>{
 const {p,voices}=translatedSetup(),played=[];p.playSpeechStream=async result=>{played.push(result);if(played.length===1)p.set('voiceFor_zh','zf_xiaobei');};
 await p.speak('First sentence. Second sentence.',{});assert.equal(played.length,2);assert.ok(voices.includes('zf_xiaobei'));assert.equal(p.get('voiceFor_zh'),'zf_xiaobei');
});

test('leaving caption before sentence end cancels automatic pause; manual pause stays paused',()=>{
 const {p}=setup(),r={};p.currentReader=r;p.state='playing';p.requestCaptionPause(r);assert.equal(p.captionPauseGeneration,p.generation);p.releaseCaptionPause(r);assert.equal(p.captionPauseGeneration,null);p.togglePause();assert.equal(p.state,'paused');p.releaseCaptionPause(r);assert.equal(p.state,'paused');
});

test('fresh reading defaults to manual paragraph once',()=>{const {p}=setup();assert.equal(p.get('mode','selection'),'paragraph');assert.equal(p.get('auto',true),false);assert.equal(p.get('repeat',0),1);});
test('voice matrix selection updates language and shared translated target together',()=>{const {p}=setup();p.syncSettings=()=>{};p.refreshTranslation=()=>{};p.set('readTranslation',true);p.setVoice('jf_alpha');assert.equal(p.settingsVoice(),'jf_alpha');assert.equal(p.get('voiceFor_ja'),'jf_alpha');assert.equal(p.get('translationTarget'),'ja');assert.equal(p.settingsVoiceLanguage(),'ja');p.setVoice('bf_emma');assert.equal(p.get('voiceFor_en-GB'),'bf_emma');assert.equal(p.get('translationTarget'),'en');});
test('sample task voice and language override global translated-audio settings',async()=>{const {p}=setup(),calls=[];p.set('readTranslation',true);p.set('translationTarget','zh-Hans');p.requestSpeech=async(text,voice)=>{calls.push(voice);return {audio:text}};await p.speak('Read this original abstract.',{},true,false,{voice:'bf_emma',language:'en'});assert.deepEqual(calls,['bf_emma']);});

test('translated language and voice stay synchronized through unsupported targets',()=>{
 const {p}=setup();p.syncSettings=()=>{};p.refreshTranslation=()=>{};
 p.set('translationTarget','ja');p.set('voiceFor_ja','jf_alpha');p.setReadTranslation(true);
 assert.equal(p.settingsVoice(),'jf_alpha');assert.equal(p.settingsVoiceLanguage(),'ja');
 p.setTranslationTarget('de');assert.equal(p.get('readTranslation'),true);assert.equal(p.settingsVoiceLanguage(),null);assert.equal(p.settingsVoice(),'');
 p.setVoice('bf_emma');assert.equal(p.get('translationTarget'),'de');
 p.setTranslationTarget('fr');assert.equal(p.settingsVoice(),'ff_siwis');assert.equal(p.settingsVoiceLanguage(),'fr');
 p.setSpeechLanguage('en');assert.equal(p.get('translationTarget'),'en');assert.equal(p.settingsVoiceLanguage(),'en');
 p.selectTranslationVoice('en-GB','bf_emma');assert.equal(p.settingsVoice(),'bf_emma');assert.equal(p.get('voice','af_heart'),'af_heart');
});
test('translated reading detects source independently of synchronized output language',async()=>{
 const {p,translations,voices}=translatedSetup('ja');p.syncTranslationVoice();
 await p.speak('The retina detects light.',{});assert.equal(translations[0].source,'en');assert.equal(voices[0],'jf_tebukuro');
});

test('bilingual abstract units alternate source and target voices once without changing preferences',async()=>{
 const {p,played}=setup(),calls=[];p.set('readTranslation',true);p.set('translation',true);p.set('voice','af_heart');p.set('repeat',5);
 p.requestSpeech=async(text,voice)=>{calls.push({text,voice});return {audio:voice+':'+text};};
 const units=[{text:'First sentence.',language:'en',voice:'am_michael'},{text:'第一句。',language:'zh',voice:'zf_xiaoxiao'},{text:'Second sentence.',language:'en',voice:'am_michael'},{text:'第二句。',language:'zh',voice:'zf_xiaoxiao'}];
 await p.speak(units.map(x=>x.text).join('\n'),{},true,false,{units});
 assert.deepEqual(played,units.map(x=>x.voice+':'+x.text));assert.equal(calls.length,4);assert.equal(p.get('voice'),'af_heart');assert.equal(p.get('readTranslation'),true);assert.equal(p.get('repeat'),5);
});
test('same source text at a different PDF position is a new selection',()=>{
 const {p}=setup(),a={text:'Repeated sentence.',position:{pageIndex:0,rects:[[1,2,3,4]]}};
 assert.equal(p.sameReadingSelection(a,structuredClone(a)),true);
 assert.equal(p.sameReadingSelection(a,{...a,position:{...a.position,pageIndex:1}}),false);
 assert.equal(p.sameReadingSelection(a,{...a,position:{...a.position,rects:[[2,3,4,5]]}}),false);
});

test('speed changes apply at the next sentence despite prefetched audio',async()=>{
 const {p}=setup(),played=[];
 p.synthesize=async(text,voice,rate)=>({audio:rate+':'+text,duration:1});
 p.playAudio=async audio=>{played.push(audio);if(played.length===1)p.set('rate',2);};
 p.set('rate',.5);p.set('repeat',1);
 await p.speak('First complete sentence. Second complete sentence.',{},true);
 assert.equal(played.length,2);assert.ok(played[0].startsWith('0.5:'));assert.ok(played[1].startsWith('2:'));
});
