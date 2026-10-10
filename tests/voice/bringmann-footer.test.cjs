process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),c=require('../../addon/voice/core.js'),pages=require('../fixtures/bringmann-pdfjs.json');
const bad=/doi\.org|10\.1016|Corresponding author|reia@|Received 17 November|Available online|All rights reserved|Abbreviations:|Median Klinik|Paediatric and Adolescent/;
test('actual Bringmann 2018 PDF first page excludes the full publication footer despite interleaved painting order',()=>{
 const p=pages[0],l=c.pdfLayout(p.items,0,p.view[3]);assert.match(c.pdfText(p.items),bad);assert.doesNotMatch(l.text,bad);assert.doesNotMatch(l.text,/Research 66 \(2018\) 49/);
 const expected=c.anchorText(c.pdfText(p.items.filter(x=>x.transform[5]>170&&x.transform[5]<740&&x.str!=='T')));
 assert.equal(c.anchorText(l.text),expected); // Includes the untouched title, authors, abstract and both introduction columns.
});
test('all 36 real pages preserve original text-layer offsets for every retained span',()=>{
 for(const page of pages){const l=c.pdfLayout(page.items,page.pageIndex,page.view[3]),raw=c.anchorText(c.pdfText(page.items)),filtered=c.anchorText(l.text);
  for(const span of l.sourceSpans)assert.equal(filtered.slice(span.start,span.end),raw.slice(span.sourceStart,span.sourceStart+span.end-span.start),'page '+(page.pageIndex+1));
  for(const u of c.layoutUnits([l])){assert.equal(raw.slice(u.anchorOffset,u.anchorOffset+c.anchorText(u.text).length),c.anchorText(u.text),'unit page '+(page.pageIndex+1));}
 }
});
test('footer painted between body fragments leaves selection and highlight anchors on the retained body',()=>{
 const row=(str,y,h=12)=>({str,transform:[h,0,0,h,54,y],height:h,width:250,hasEOL:true});
 const items=[row('First body sentence.',700),row('https://doi.org/10.1234/example',90,9),row('Second body sentence.',650),row('Received 17 November 2017',75,9),row('Final body sentence.',610)];
 const l=c.pdfLayout(items,0,842),units=c.layoutUnits([l]),raw=c.anchorText(c.pdfText(items));
 assert.equal(l.text,'First body sentence. Second body sentence. Final body sentence.');
 for(const u of units)assert.equal(u.anchorOffset,raw.indexOf(c.anchorText(u.text)));
 const selectedOffset=raw.indexOf('second')+2;assert.equal(c.selectedSentenceIndex(units,0,selectedOffset),1);
 assert.equal(c.sourceOffset(l,c.anchorText('First body sentence.').length),raw.indexOf('second'));
});
test('an ordinary dated sentence at body size near the page bottom is retained',()=>{
 const row=(str,y)=>({str,transform:[12,0,0,12,54,y],height:12,width:250,hasEOL:true});
 const items=[row('The experiment compares two timelines.',700),row('Another complete scientific sentence.',680),row('Received 17 November 2017 was the date compared in our analysis.',90)];
 assert.equal(c.pdfLayout(items,0,842).text,c.pdfText(items));
});
test('margin-only layout preserves scientific body when caption filtering is disabled',()=>{
 for(const page of pages.slice(1)){
  const expected=page.items.filter(x=>x.transform[5]<740&&!(x.transform[5]<40&&/^\d{1,4}$/.test(x.str.trim())));
  assert.equal(c.anchorText(c.pdfLayout(page.items,page.pageIndex,page.view[3],{skipCaptions:false}).text),c.anchorText(c.pdfText(expected)),'page '+(page.pageIndex+1));
 }
});
for(const [name,forbidden] of [['ou-2013',/Citation:|Editor:|Funding:|Competing Interests|ouj@|Current address|plosone\.org|Volume 8|Notch Signaling and RPE Respecification/],['alexander-2023',/doi\.org|Received:|Accepted:|Check for updates|paula\.cohen@|dankoc@|Baker Institute|Nature Communications|1234567890/]]){
 const pp=require('../fixtures/'+name+'-pdfjs.json'),margins=c.marginSignatures(pp.slice(0,5));
 test(name+' actual PDF removes publication panels and repeated margins, preserving source anchors',()=>{
  for(const p of pp){const layout=c.pdfLayout(p.items,p.pageIndex,p.view[3],{margins}),raw=c.anchorText(c.pdfText(p.items)),filtered=c.anchorText(layout.text);
   if(p.pageIndex===0)assert.doesNotMatch(layout.text,forbidden);
   for(const span of layout.sourceSpans)assert.equal(filtered.slice(span.start,span.end),raw.slice(span.sourceStart,span.sourceStart+span.end-span.start));
   for(const u of c.layoutUnits([layout]))assert.equal(c.anchorText(u.text),raw.slice(u.anchorOffset,u.anchorOffset+c.anchorText(u.text).length));
   if(p.pageIndex>0)assert.doesNotMatch(layout.text,name==='ou-2013'?/plosone\.org|Volume 8|Notch Signaling and RPE Respecification/:/Nature Communications \|/);
  }
  const first=c.pdfLayout(pp[0].items,0,pp[0].view[3],{margins}).text;
  assert.match(first,name==='ou-2013'?/During vertebrate eye development/:/During meiotic prophase I/);
  assert.match(first,name==='ou-2013'?/An ideal model to study/:/Spermatogenesis is a multistep process/);
 });
}
test('real Bringmann PDF split surname ligature stays silent in full sentence and layout chunks',()=>{
 const page=pages[1],layout=c.pdfLayout(page.items,1,page.view[3]);
 const sentence=c.sentences(layout.text).find(s=>s.startsWith('In many species with deep foveas'));
 assert.ok(sentence);assert.match(sentence,/Rosenfield-Wessels/);
 const expected=sentence.replace(' (Fig. 3C)','').replace(' (Fig. 3A) (Fite and Rosenfield-Wessels, 1975)','');
 assert.equal(c.speechText(sentence),expected);
 for(const limit of [80,180,340])assert.equal(c.speechText(c.chunks(sentence,limit).map(c.speechText).join(' ')),expected);
 const units=c.layoutUnits([layout]).filter(u=>u.sentenceText===sentence);
 assert.equal(c.cleanText(units.map(u=>u.spokenText).join(' ')),expected);
 const raw=c.anchorText(c.pdfText(page.items));
 for(const u of units)assert.equal(raw.slice(u.anchorOffset,u.anchorOffset+c.anchorText(u.text).length),c.anchorText(u.text));
 for(const at of [sentence.indexOf('Rosenfield'),sentence.indexOf('Wessels'),sentence.indexOf('1975')]){
  const split=c.layoutUnits([{text:sentence.slice(0,at),pageIndex:0},{text:sentence.slice(at),pageIndex:1}]);
  assert.equal(c.anchorText(split.map(u=>u.spokenText).join(' ')),c.anchorText(expected));
 }
 assert.match(expected,/\(INL\)/);assert.match(expected,/\(partial\)/);
});
