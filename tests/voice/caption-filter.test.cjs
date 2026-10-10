process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),c=require('../../addon/voice/core.js');
const papers=['bringmann','ou-2013','alexander-2023'].map(n=>({n,pages:require('../fixtures/'+n+'-pdfjs.json')}));
const pp=papers[0].pages;
test('real Bringmann cross-page body bypasses figure captions on both page transitions',()=>{
 const layouts=pp.slice(0,3).map(p=>c.pdfLayout(p.items,p.pageIndex,p.view[3])),units=c.layoutUnits(layouts);
 assert.ok(layouts[1].text.startsWith('sensitivity and acuity'));
 assert.ok(layouts[2].text.startsWith('acuity of foveal vision'));
 assert.doesNotMatch(layouts[1].text,/Müller cells of the primate retina|cells form the cores|These cells do not form a functional column/);
 assert.doesNotMatch(layouts[2].text,/Fig\. 2\./);
 const a=units.find(u=>u.text.includes('reduce visual')),b=units[units.indexOf(a)+1];
 assert.equal(a.pageIndex,0);assert.equal(b.pageIndex,1);assert.ok(b.text.startsWith('sensitivity and acuity'));assert.equal(a.sentenceId,b.sentenceId);
 const next=units.find(u=>u.pageIndex===2);assert.ok(next.text.startsWith('acuity of foveal vision'));
 const previous=units[units.indexOf(next)-1];assert.equal(previous.pageIndex,1);assert.match(previous.text,/high$/);assert.equal(next.sentenceId,previous.sentenceId);
});
test('all three real PDFs exclude caption labels while preserving body-sized text and source anchors',()=>{
 for(const {n,pages} of papers){const body={bringmann:7.9702,'ou-2013':8.9663,'alexander-2023':8.2191}[n];
  for(const p of pages){
   const a=c.pdfLayout(p.items,p.pageIndex,p.view[3]),b=c.pdfLayout(p.items,p.pageIndex,p.view[3],{skipCaptions:false});
   const covered=(l,start,end)=>l.sourceSpans.some(s=>start>=s.sourceStart&&end<=s.sourceStart+s.end-s.start);
   let offset=0;for(const item of p.items){const end=offset+c.anchorText(item.str).length;
    if(/^(?:Figure|Fig\.)\s+\d+\s*[.|](?:\s|$)/.test(item.str)&&item.height<body*.96)assert.ok(!covered(a,offset,end),'caption retained: '+n+' '+p.pageIndex);
    if(end>offset&&Math.abs(item.height-body)<.01&&covered(b,offset,end))assert.ok(covered(a,offset,end),'body lost: '+n+' '+p.pageIndex+' '+item.str);
    offset=end;
   }
   const raw=c.anchorText(c.pdfText(p.items));for(const u of c.layoutUnits([a]))assert.equal(c.anchorText(u.text),raw.slice(u.anchorOffset,u.anchorOffset+c.anchorText(u.text).length));
  }
 }
});
test('caption detection preserves ordinary figure references and stops before body text',()=>{
 const row=(str,x,y,h=12)=>({str,width:220,height:h,transform:[h,0,0,h,x,y],hasEOL:true});
 const items=[row('Fig. 1 shows the retinal layers.',30,700),row('Fig. 2A illustrates the cones.',30,680),row('Fig. 3. A labelled drawing.',30,400,10),row('Caption continued under the drawing.',30,386,10),row('Scientific body resumes here.',30,350)];
 assert.equal(c.pdfLayout(items,1,842).text,'Fig. 1 shows the retinal layers. Fig. 2A illustrates the cones. Scientific body resumes here.');
});
