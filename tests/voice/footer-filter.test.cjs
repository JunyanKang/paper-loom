process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../../addon/voice/core.js');
const row=(str,y,height=12,x=54)=>({str,transform:[height,0,0,height,x,y],height,width:450,hasEOL:true});
const footer=[row('Abbreviations: ACL, amacrine cell layer; BCL, bipolar cell layer.',190,9),row('* Corresponding author. Paul Flechsig Institute, University of Leipzig.',175,9),row('E-mail address: author@example.org',160,9),row('1 Center for Paediatric Medicine, Heidelberg, Germany.',145,9),row('https://doi.org/10.1016/j.preteyeres.2018.03.006',105,9),row('Received 17 November 2017; Accepted 27 March 2018',90,9),row('Available online 30 March 2018',75,9),row('1350-9462/ © 2018 Elsevier Ltd. All rights reserved.',60,9)];
test('multi-letter subpanels and continuation identifiers are silent',()=>{
 for(const ref of ['Fig. 1Ba and 2A','fig. 1Ba','Figs. 1Ba–1Bc','Supplementary Fig. S2Ab','Extended Data Fig. 1AB'])assert.equal(core.speechText(`Cells (${ref}) guide light.`),'Cells guide light.',ref);
 assert.equal(core.speechText('Cells have 1Ba binding sites and 2A receptors.'),'Cells have 1Ba binding sites and 2A receptors.');
});
test('first-page footer metadata is trimmed without shifting body offsets',()=>{
 const body=[row('The retina converts light into signals.',700),row('Retinal cells respond to incoming light.',360)];
 const layout=core.pdfLayout([...body,...footer],0,842);assert.equal(layout.text,core.pdfText(body));assert.equal(core.layoutUnits([layout])[1].anchorOffset,core.anchorText(body[0].str).length);
});
test('footer trimming reconnects a body sentence over the page break',()=>{
 const a=core.pdfLayout([row('Retinal cells guide the light',700),row('toward the photoreceptors',360),...footer],0,842),b=core.pdfLayout([row('while preserving its spatial pattern.',700)],1,842);
 const u=core.layoutUnits([a,b]);assert.equal(u.map(x=>x.spokenText).join(' '),'Retinal cells guide the light toward the photoreceptors while preserving its spatial pattern.');assert.ok(u.every(x=>x.translationText===u[0].translationText));
});
test('ordinary lower-page prose, body DOI discussion and isolated abbreviation lists remain',()=>{
 for(const tail of [[row('Received light is processed by retinal neurons.',160)],[row('Abbreviations: ACL, amacrine cell layer.',150,9)],[row('The authors discuss how the DOI system identifies publications.',150,12)]]){
  const items=[row('A complete scientific paragraph.',700),row('Another body line.',680),...tail];assert.equal(core.pdfLayout(items,0,842).text,core.pdfText(items));
 }
});
test('small-print keywords higher in the body are not treated as footers',()=>{
 const items=[row('A complete scientific paragraph.',700),row('Corresponding author information can identify research networks.',600,9),row('Received 17 November 2017 was the date compared in our analysis.',550,9)];assert.equal(core.pdfLayout(items,0,842).text,core.pdfText(items));
});
const mixed='every cone may have its ‘private’ Müller cell which delivers the appropriate pixel of the image, while several rods (up to 10 in the peripheral human retina; Reichenbach and Bringmann, 2010) are illuminated by one Müller cell.';
const mixedExpected=mixed.replace('; Reichenbach and Bringmann, 2010','');
test('mixed scientific aside retains the explanation and suppresses only author-year citation',()=>{
 assert.equal(core.speechText(mixed),mixedExpected);
 for(const limit of [80,140,180,340])assert.equal(core.speechText(core.chunks(mixed,limit).map(core.speechText).join(' ')),mixedExpected);
 for(const [input,expected] of [
 ['Cells (Smith et al., 2020; up to 10 rods) respond.','Cells (up to 10 rods) respond.'],
 ['Cells (up to 10 rods; Smith et al., 2020; Jones & Brown, 2018) respond.','Cells (up to 10 rods) respond.'],
 ['Cells (up to 10 rods; Smith et al., 2020; measured at 20 °C) respond.','Cells (up to 10 rods; measured at 20 °C) respond.'],
 ['Cells (up to 10 rods; Fig. 1Ba) respond.','Cells (up to 10 rods) respond.'],
 ['Cells (Group A, 2010; n = 10; January 2020) respond.','Cells (Group A, 2010; n = 10; January 2020) respond.']
 ])assert.equal(core.speechText(input),expected);
});
test('mixed citation split at every page boundary remains silent with source offsets intact',()=>{
 for(const match of mixed.matchAll(/ /g)){
  const at=match.index,pages=[{text:mixed.slice(0,at),pageIndex:0},{text:mixed.slice(at+1),pageIndex:1}];
  const units=core.layoutUnits(pages),spoken=core.cleanText(units.map(u=>u.spokenText).join(' '));
  assert.doesNotMatch(spoken,/Reichenbach|Bringmann|2010/);
  assert.equal(core.anchorText(spoken),core.anchorText(mixedExpected));
  assert.ok(units.every(u=>u.translationText===mixed));
  assert.equal(units.find(u=>u.pageIndex===1).anchorOffset,0);
 }
});

const foveal='depending on the depth of the pit, the foveal center may lack further inner retinal layers like the IPL and inner nuclear layer (INL), and may also show a (partial) displacement of the ONL (Fig. 3A) (Fite and Rosenfield-Wessels, 1975).';
test('compound surnames with PDF hyphens are silent while scientific parentheses remain',()=>{
 const expected=foveal.replace(' (Fig. 3A) (Fite and Rosenfield-Wessels, 1975)','');
 for(const dash of ['-','‐','‑','–','−',' - ','- ',' -','\u0000']){
  const sentence=foveal.replace('Rosenfield-Wessels','Rosenfield'+dash+'Wessels');
  assert.equal(core.speechText(sentence),expected);
  for(const limit of [80,180,340])assert.equal(core.speechText(core.chunks(sentence,limit).map(core.speechText).join(' ')),expected);
  for(const at of [sentence.indexOf('Rosenfield'),sentence.indexOf('Wessels'),sentence.indexOf('1975')]){
   const units=core.layoutUnits([{text:sentence.slice(0,at),pageIndex:0},{text:sentence.slice(at),pageIndex:1}]);
   assert.doesNotMatch(units.map(u=>u.spokenText).join(' '),/Fite|Rosenfield|Wessels|1975/);
   assert.ok(units.every(u=>u.translationText.includes('(INL)')&&u.translationText.includes('(partial)')));
  }
 }
});
test('figure lists consume Oxford comma and conjunction including final panel number',()=>{
 const prefix='The concaviclivate fovea is a dish- or bowl-shaped fovea',suffix='; this fovea is a shallow pit.';
 for(const reference of ['Fig. 1Ba, 2A,B, and 3A','Fig. 1Ba, 2A, B, & 3A','Fig. 1Ba, 2A,B and 3A','Supplementary Fig. S1A, S2B, and S3C','Extended Data Fig. 1A, B, and 3A','Table 1, 2, and 3']){
  const text=prefix+' ('+reference+')'+suffix;
  assert.equal(core.speechText(text),prefix+suffix);
  for(const limit of [80,120,340])assert.equal(core.speechText(core.chunks(text,limit).map(core.speechText).join(' ')),prefix+suffix);
  const split=text.indexOf('and');if(split>0){const units=core.layoutUnits([{text:text.slice(0,split),pageIndex:0},{text:text.slice(split),pageIndex:1}]);assert.equal(core.anchorText(units.map(u=>u.spokenText).join(' ')),core.anchorText(prefix+suffix));}
 }
 assert.equal(core.speechText('Fig. 1 and 3A show the retina and 3 animals.'),'Figure 1 and 3A show the retina and 3 animals.');
});
