process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
function setup(){const prefs=new Map(),requests=[],host={setTimeout,clearTimeout};const c={PaperVoiceCore:require('../../addon/voice/core.js'),Zotero:{HTTP:{request:async(method,url,options)=>{requests.push({method,url,options});return{response:url.includes('transmart')?{auto_translation:['译文']}:url.includes('google')?[[['translation']]]:[{translations:[{text:'translated'}]}]};}}}};vm.createContext(c);vm.runInContext(fs.readFileSync('addon/voice/translation.js','utf8'),c);const p=c.PaperVoiceTranslation;p.get=(k,v)=>prefs.get(k)??v;p.host=host;p.initTranslation();return{p,prefs,requests,c};}
test('default uses free Tencent and target changes cannot reuse another language',async()=>{const {p,prefs,requests}=setup();await p.translate('Retinal cells.');assert.match(requests[0].url,/transmart.qq.com/);assert.equal(JSON.parse(requests[0].options.body).target.lang,'zh');prefs.set('translationTarget','ja');await p.translate('Retinal cells.');assert.equal(requests.length,2);assert.equal(JSON.parse(requests[1].options.body).target.lang,'ja');await p.translate('Retinal cells.');assert.equal(requests.length,2);});
test('traditional Chinese never silently returns simplified Tencent text',async()=>{const {p,prefs,requests}=setup();prefs.set('translationTarget','zh-Hant');await assert.rejects(p.translate('Retinal cells.'),/繁体/);assert.equal(requests.length,0);});
test('Google supports explicit traditional target and parses segmented response',async()=>{const {p,prefs,requests}=setup();prefs.set('translationTarget','zh-Hant');prefs.set('translationProvider','google');const r=await p.translate('Retinal cells.');assert.equal(r.text,'translation');assert.match(requests[0].url,/tl=zh-TW/);assert.equal(requests[0].method,'POST');assert.ok(!requests[0].url.includes('Retinal'));assert.equal(requests[0].options.logBody,false);});
test('optional translator bridge explicitly receives free service and target',async()=>{const {p,prefs,c,requests}=setup();let args;c.Zotero.PDFTranslate={api:{translate:async(text,opts)=>{args=opts;return{result:'神經細胞',status:'success'};}}};prefs.set('translationProvider','bing');prefs.set('translationTarget','zh-Hant');const r=await p.translate('Neural cells.');assert.equal(args.service,'bing');assert.equal(args.langto,'zh-Hant');assert.equal(requests.length,0);assert.match(r.source,/Translate for Zotero/);});
test('Google retries a transient timeout once and shares the in-flight result',async()=>{
 const {p,prefs,c}=setup();prefs.set('translationProvider','google');let attempts=0;
 c.Zotero.HTTP.request=async()=>{if(++attempts===1)throw Error('Request timed out after 12000 ms');return {response:[[['神经细胞']]]};};
 const values=await Promise.all([p.translate('Neural cells.'),p.translate('Neural cells.')]);assert.equal(attempts,2);assert.equal(values[0].text,'神经细胞');assert.equal(values[1].text,values[0].text);
});
test('Google repeated timeout reports unavailability without a paid fallback',async()=>{
 const {p,prefs,c}=setup();prefs.set('translationProvider','google');let attempts=0;
 c.Zotero.HTTP.request=async()=>{attempts++;throw Error('Request timed out');};
 await assert.rejects(p.translate('Cells.'),/Google 暂时连接失败/);assert.equal(attempts,2);assert.equal(p.translationCache.size,0);
});
test('translation source follows active speech language and isolates cache',async()=>{const {p,prefs,requests}=setup();for(const provider of ['tencenttransmart','google','bing']){prefs.set('translationProvider',provider);for(const lang of ['zh','ja','fr']){p.activeSpeechLanguage=lang;await p.translate('Shared token');const req=requests.at(-1);if(provider==='tencenttransmart')assert.equal(JSON.parse(req.options.body).source.lang,lang);else assert.match(req.url,new RegExp((provider==='google'?'sl':'from')+'='+lang));}}assert.equal(requests.length,9);});
test('scientific glossary preserves names, diacritics, plural forms and quantitative ranges',()=>{
 const {p}=setup();const g=p.translationTerms('Müller cells and Mu\u0308ller glia guide signals in the fovea. Density is 78,000‒89,000 per mm².','zh-Hans');
 assert.ok(!g.text.includes('Müller'));const result=g.restore(g.text);assert.equal(result,'米勒细胞 and 米勒细胞 guide signals in the 中央凹. Density is 78,000～89,000 per mm².');
 const h=p.translationTerms('Schwann cells and Müller cells.','zh-Hant');assert.equal(h.restore(h.text),'施旺細胞 and 米勒細胞.');
 assert.equal(p.translationTerms('Müller cells.','ja').text,'Müller cells.');
});
test('the protected glossary is applied to free services and returned cache contents',async()=>{
 const {p,c,requests}=setup();c.Zotero.HTTP.request=async(method,url,options)=>{requests.push({method,url,options});return {response:{auto_translation:[JSON.parse(options.body).source.text_list[0]]}};};
 const r=await p.translate('Muller cells are present at 19,000–25,000.');assert.equal(r.text,'米勒细胞 are present at 19,000～25,000.');assert.ok(JSON.parse(requests[0].options.body).source.text_list[0].includes('[PVG'));
 assert.equal((await p.translate('Muller cells are present at 19,000–25,000.')).text,r.text);assert.equal(requests.length,1);
});
test('LLM streaming and complete results never expose glossary placeholders',async()=>{
 const {p,prefs}=setup();prefs.set('translationProvider','llm');let partial='';p.translateLLM=async(text,source,opts)=>{opts.onPartial(text);return {text,source:'Test'};};
 const r=await p.translate('MÜLLER CELLS.',null,{onPartial:text=>partial=text});assert.equal(r.text,'米勒细胞.');assert.equal(partial,'米勒细胞.');
});

test('bridge diagnostics cannot masquerade as translated prose or poison cache',async()=>{
 const {p,c,requests}=setup();c.Zotero.PDFTranslate={api:{translate:async()=>({result:'[Request Error]\nError: HTTP GET failed with status code 429',status:'success'})}};
 const r=await p.translate('Cells.');assert.equal(r.text,'译文');assert.equal(requests.length,1);assert.equal(requests[0].options.errorDelayMax,0);assert.equal(p.translationCache.values().next().value.text,'译文');
});
