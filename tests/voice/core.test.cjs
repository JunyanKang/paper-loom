process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../../addon/voice/core.js');
test('PDF ligatures, line-break hyphens, and whitespace',()=>{
 assert.equal(core.cleanText('The ﬁbers of photo-\nreceptors\n respond.\u00ad'),'The fibers of photoreceptors respond.');
 assert.equal(core.cleanText('cell-type 3-5 β-catenin'),'cell-type 3-5 β-catenin');
});
test('long passages preserve all words in order and bound chunks',()=>{
 const text=Array.from({length:120},(_,i)=>`Sentence ${i} explains the development of retinal cells.`).join(' ');
 const parts=core.chunks(text);
 assert.ok(parts.length>10); assert.ok(parts.every(p=>p.length<=340));assert.equal(parts.join(' '),text);
});
test('very long tokens terminate with bounded chunks',()=>{const p=core.chunks('x'.repeat(1200));assert.equal(p.join(''),'x'.repeat(1200));assert.ok(p.every(x=>x.length<=340));});
test('empty selections do not create speech chunks',()=>assert.deepEqual(core.chunks(' \n '),[]));
test('six voices include male/female US/GB',()=>{assert.equal(core.voices.filter(v=>v.language==='en').length,6);for(const a of ['US','GB'])for(const g of ['male','female'])assert.ok(core.voices.some(v=>v.accent===a&&v.gender===g));});
test('rate clamp and default',()=>{assert.equal(core.rate(-8),.6);assert.equal(core.rate(9),1.6);assert.equal(core.rate('bad'),1);});
test('sentences preserve decimal values and scientific wording',()=>{
 const s=core.sentences('The value was 3.14. This suggests an association, not causation.');assert.equal(s.length,2);assert.ok(s[0].includes('3.14'));assert.ok(s[1].includes('not causation'));
});
test('reference markers are skipped without dropping scientific values',()=>{
 assert.equal(core.speechText('Retinal development [1, 2–5] depends on glia (Smith et al., 2020; Jones & Brown, 2018).'),'Retinal development depends on glia.');
 assert.equal(core.speechText('The interval [0, 1], vector [1, 2], x[1], SOX2, Ca2+, 10³ and mm² remain.'),'The interval, vector, x[1], SOX2, Ca2+, 10³ and mm² remain.');
 assert.equal(core.speechText('Retinal development¹² improves vision [3].'),'Retinal development improves vision.');
 assert.equal(core.speechText('January (2020), (January 2020), n = 12, and p < 0.05.'),'January (2020), (January 2020), n = 12, and p < 0.05.');
 assert.equal(core.speechText('[12]'),'');
});
test('PDF geometry distinguishes citation superscripts from baseline numbers and units',()=>{
 const items=[{str:'Retinal development',height:12,width:110,transform:[0,0,0,12,40,100]},{str:'12',height:7,width:8,transform:[0,0,0,7,151,104]},{str:'requires cells.',height:12,width:80,transform:[0,0,0,12,161,100]}];
 const raw=core.pdfText(items);assert.match(raw,/¹²/);assert.equal(core.speechText(raw),'Retinal development requires cells.');
 assert.equal(core.markSelectedSuperscripts('development12 requires cells.',items),'development¹² requires cells.');
 items[1].height=12;items[1].transform[5]=100;assert.match(core.pdfText(items),/12/);
 items[0].str='mm';items[1].height=7;items[1].transform[5]=104;assert.match(core.pdfText(items),/¹²/);assert.match(core.speechText(core.pdfText(items)),/mm ¹²/);
});

test('zero-based numeric citation lists are silent',()=>{
 for(const marker of ['[0, 1]','[ 0, 1 ]','[0]','[0–3]','【0, 1】','[1,2,3]'])assert.equal(core.speechText('Cells '+marker+' detect light.'),'Cells detect light.');
 assert.equal(core.speechText('[0, 1]'),'');
});
const opticalSentence='It has been shown for the retina of nonprimate mammals (Franze et al., 2007; Agte et al., 2011; Labin et al., 2014), and proposed for the human and avian retina (Labin et al., 2014; Zueva et al., 2014), that Müller cells act as living optical fibers which guide the light with minimal intensity loss through the inner retinal layers toward the photoreceptors.';
test('complete author-year groups stay silent at every speech chunk boundary',()=>{
 assert.equal(core.sentences(opticalSentence).length,1);
 for(const limit of [80,140,180,240,340]){
  const parts=core.chunks(opticalSentence,limit);assert.equal(parts.join(' '),opticalSentence);
  const spoken=core.speechText(parts.map(core.speechText).filter(Boolean).join(' '));
  assert.equal(spoken,core.speechText(opticalSentence));assert.doesNotMatch(spoken,/Franze|Agte|Labin|Zueva|2007|2011|2014/);
 }
});
test('Latin abbreviations and and/or are spoken naturally without changing source sentence boundaries',()=>{
 const text='Cells act as guides, i.e., optical fibers, and/or light collectors, e.g. Müller cells. A second sentence.';
 const sentences=core.sentences(text);assert.equal(sentences.length,2);assert.equal(sentences.join(' '),text);
 assert.equal(core.speechText(sentences[0]),'Cells act as guides, that is, optical fibers, and or light collectors, for example Müller cells.');
 assert.equal(core.speechText('i. e., cells and / or tissue; e. g., glia.'),'that is, cells and or tissue; for example, glia.');
});
test('multilingual voices expose four speech languages, keeping Russian translation separate',()=>{assert.deepEqual(core.speechLanguages.map(x=>x.id),['en','zh','ja','fr']);assert.equal(core.voices.length,14);for(const lang of ['zh','ja','fr'])assert.ok(core.voices.some(x=>x.language===lang));});
test('Chinese, Japanese and French sentence boundaries preserve text',()=>{
 for(const list of [['视网膜感受光线。','这些信号传到大脑！','我们看见世界。'],['網膜は光を感知します。','信号は脳に伝わります。'],['La rétine détecte la lumière.','Les signaux arrivent au cerveau.']])assert.deepEqual(core.sentences(list.join(list[0].startsWith('La ')?' ':'')),list);
 const s='视网膜将光线转化为信号。'.repeat(80);assert.equal(core.chunks(s).join(''),s);assert.ok(core.chunks(s).every(x=>x.length<=340));
});
test('offline language detection distinguishes supported scripts, contextual words and unsupported prose',()=>{
 for(const {id,sample} of core.speechLanguages)assert.equal(core.detectSpeechLanguage(sample),id);
 assert.equal(core.detectSpeechLanguage('網膜','網膜は光を神経信号に変換します。'),'ja');
 assert.equal(core.detectSpeechLanguage('lumière','La rétine transforme la lumière en signaux nerveux.'),'fr');
 assert.equal(core.detectSpeechLanguage('RNA'),null);
 assert.equal(core.detectSpeechLanguage('Hola, este documento está escrito en español.'),'es');
 assert.equal(core.voices.find(x=>x.language==='zh').id,'zm_yunxi');assert.equal(core.voices.find(x=>x.language==='ja').id,'jf_tebukuro');
});

const nocturnal="Because the foveola is largely rod-free (Fig. 7A) (Ahnelt, 1998; Provis et al., 2005; Bumsted O'Brien, 2008), the primate fovea is blind at night (with the exception of the fovea of nocturnal tarsiers in which rods are present at significant densities throughout the central retina [Polyak, 1957; Hendrickson et al., 2000]). Most mammals but primates are dichromates; they";
test('square-bracket author years stay silent inside scientific parentheses and speech chunks',()=>{
 const expected='Because the foveola is largely rod-free, the primate fovea is blind at night (with the exception of the fovea of nocturnal tarsiers in which rods are present at significant densities throughout the central retina). Most mammals but primates are dichromates; they';
 assert.equal(core.speechText(nocturnal),expected);
 for(const limit of [80,140,180,240,340]){
  const pieces=core.sentences(nocturnal).flatMap(x=>core.chunks(x,limit));
  assert.equal(pieces.join(' '),nocturnal);assert.equal(core.speechText(pieces.map(core.speechText).filter(Boolean).join(' ')),expected);
 }
 for(const text of ['Cells [Polyak, 1957; Hendrickson et al., 2000] respond.','Cells 【Polyak, 1957】 respond.'])assert.equal(core.speechText(text),'Cells respond.');
 assert.equal(core.speechText('Keep [Ca2+], [n = 12], [Group 2020], and [10 μm].'),'Keep [Ca2+], [n = 12], [Group 2020], and [10 μm].');
});
test('square author references split across PDF pages remain silent with source anchors intact',()=>{
 const left='The retina has rods (with high densities [Polyak, 1957;',right='Hendrickson et al., 2000]). More cells respond.';
 const pages=[{pageIndex:0,text:left},{pageIndex:1,text:right}];
 const units=core.layoutUnits(pages);
 const spoken=core.speechText(units.map(u=>u.spokenText).join(' '));
 assert.equal(spoken,'The retina has rods (with high densities). More cells respond.');
 assert.match(units.map(u=>u.text).join(' '),/Polyak, 1957; Hendrickson/);
 assert.equal(units.find(u=>u.pageIndex===1).anchorOffset,0);
});

const birdSentence='However, in the convexiclivate fovea of many birds and chameleons, the receptor segments of the centralmost cones are thinner, but not longer than the perifoveal cone segments (Fig. 3A,C) (Ramón y Cajal, 1894).';
test('compound surname particles and accents are silent without dropping prose',()=>{
 const expected='However, in the convexiclivate fovea of many birds and chameleons, the receptor segments of the centralmost cones are thinner, but not longer than the perifoveal cone segments.';
 assert.equal(core.speechText(birdSentence),expected);
 for(const name of ['Ramón y Cajal','Ramo\u0301n y Cajal','de la Cruz','van der Waals','von Helmholtz','De Silva and van den Berg','García Márquez','D’Angelo','O’Brien'])assert.equal(core.speechText('Cells respond ('+name+', 1894).'),'Cells respond.');
 for(const size of [80,140,240,340])assert.equal(core.speechText(core.chunks(birdSentence,size).map(core.speechText).join(' ')),expected);
 const units=core.layoutUnits([{pageIndex:0,text:birdSentence.slice(0,birdSentence.indexOf(' Cajal'))},{pageIndex:1,text:birdSentence.slice(birdSentence.indexOf(' Cajal')+1)}]);
 assert.equal(core.speechText(units.map(u=>u.spokenText).join(' ')),expected);
 for(const text of ['Cells (observed in 1894) respond.','Cells (with high density in 1894) respond.','Cells (January 2020) respond.'])assert.equal(core.speechText(text),text);
});
