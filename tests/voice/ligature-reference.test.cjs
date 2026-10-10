process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),c=require('../../addon/voice/core.js');
const pages=require('../fixtures/bringmann-pdfjs.json'),page=pages[9];
const layout=c.pdfLayout(page.items,9,page.view[3]),sentence=c.sentences(layout.text).find(x=>x.startsWith('The involvement of tractional forces'));
const expected='The involvement of tractional forces by the centralmost Müller cells is suggested by the colocalization of the deepest point of the foveal pit (black arrowhead in Figure 7A) which lies in front of the tip of the fovea externa; the deepest point of the foveal pit can be identified at the central light reflex in OCT images of many human subjects.';
test('real PDF joins geometrically contiguous ligature items while retaining an explanatory figure reference',()=>{
 assert.ok(page.items.some(x=>x.str==='fl'));
 assert.match(sentence,/identified at the central light reflex/);assert.equal(c.speechText(sentence),expected);
 const units=c.layoutUnits([layout]).filter(u=>u.sentenceText===sentence);
 assert.equal(c.cleanText(units.map(u=>u.spokenText).join(' ')),expected);
 const raw=c.anchorText(c.pdfText(page.items));for(const u of units)assert.equal(raw.slice(u.anchorOffset,u.anchorOffset+c.anchorText(u.text).length),c.anchorText(u.text));
});
test('selected text uses PDF-backed spacing without changing selected letters or punctuation',()=>{
 const selected=sentence.replace('identified','identi fi ed').replace('reflex','re fl ex');
 const units=c.layoutUnits([layout],selected);
 assert.equal(c.cleanText(units.map(u=>u.spokenText).join(' ')),expected);
 assert.equal(c.anchorText(units.map(u=>u.text).join(' ')),c.anchorText(selected));
 assert.equal(c.layoutUnits([{text:'We re fl ex here.',pageIndex:0}],'re fl ex')[0].text,'re fl ex');
});
test('word gaps, line breaks, columns and missing geometry do not trigger ligature merging',()=>{
 const item=(str,x,y=100)=>({str,width:10,height:10,transform:[10,0,0,10,x,y]});
 assert.equal(c.pdfText([item('re',0),item('fl',10),item('ex',20)]),'reflex');
 assert.equal(c.pdfText([item('of',0),item('fl',14),item('ow',24)]),'of flow');
 assert.equal(c.pdfText([item('of ',0),item('fl',10),item('ow',20)]),'of flow');
 assert.equal(c.pdfText([{...item('re',0),hasEOL:true},item('fl',10),item('ex',20)]),'re flex');
 assert.equal(c.pdfText([item('re',0),item('fl',10,80),item('ex',20,80)]),'re flex');
 assert.equal(c.pdfText([item('re',0),item('fl',100),item('ex',110)]),'re flex');
 assert.equal(c.pdfText([{str:'re'},{str:'fl'},{str:'ex'}]),'re fl ex');
});
test('figure explanations survive chunking and actual page splits while pure references stay silent',()=>{
 for(const aside of ['black arrowhead in Fig. 7A','red arrows in Figs. 2A and 3B','values listed in Table 1']){
  const value='Cells ('+aside+') guide light (Fig. 2A) (Tick et al., 2011).';
  const expected=c.speechText(value);assert.match(expected,/Figure|Table/);assert.doesNotMatch(expected,/Tick|2011|2A\)/);
  const label=/(?:Figs?\.|Table)\s+/.exec(value);
  for(const at of [label.index,label.index+label[0].length]){
   if(at<=0)continue;const units=c.layoutUnits([{text:value.slice(0,at),pageIndex:0},{text:value.slice(at),pageIndex:1}]);
   assert.equal(c.anchorText(units.map(u=>u.spokenText).join(' ')),c.anchorText(expected));
  }
 }
 const value='Cells (black arrowhead in Fig. 7A; Tick et al., 2011) respond (Fig. 3A).';
 assert.equal(c.speechText(value),'Cells (black arrowhead in Figure 7A) respond.');
 assert.equal(c.speechText(c.chunks(sentence,100).map(c.speechText).join(' ')),expected);
});
test('retaining a figure explanation does not expose nested author citations across pages',()=>{
 const sentence='Cells (black arrowhead in Fig. 7A [Tick et al., 2011]) guide light.';
 const at=sentence.indexOf('2011'),units=c.layoutUnits([{text:sentence.slice(0,at),pageIndex:0},{text:sentence.slice(at),pageIndex:1}]);
 const spoken=units.map(u=>u.spokenText).join(' ');assert.match(spoken,/Figure 7A/);assert.doesNotMatch(spoken,/Tick|2011/);
});
test('spoken figure panel letters are not expanded as physical units',()=>{
 for(const language of ['en','zh','ja','fr']){
  assert.equal(c.measurementSpeech('black arrowhead in Figure 7A',language),'black arrowhead in Figure 7A');
  assert.equal(c.measurementSpeech('arrows in Figures 2E and 10A',language),'arrows in Figures 2E and 10A');
 }
 assert.equal(c.measurementSpeech('Figure 7A compares currents of 7 A.'),'Figure 7A compares currents of 7 amperes.');
});
