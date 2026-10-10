process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../../addon/voice/core.js');
const sentence='In the example of the human fovea shown in Fig. 7A, the centralmost rod nuclei are located 270 and 370 μm, respectively, from the foveal center.';
test('running prose preserves meaningful figure identifiers in direct and document speech',()=>{
 assert.match(core.speechText(sentence),/shown in Figure 7A,/);assert.equal(core.sentences(sentence).length,1);
 for(const pages of [[{text:sentence,pageIndex:0}],[{text:sentence.slice(0,42),pageIndex:0},{text:sentence.slice(42),pageIndex:1}]]){
  const result=core.layoutUnits(pages).map(u=>u.spokenText).join(' ');assert.match(result,/Figure 7A/);assert.doesNotMatch(result,/shown in ,/);
 }
 assert.equal(core.speechText('The retina (Fig. 7A) is shown in Fig. 3C.'),'The retina is shown in Figure 3C.');
 assert.equal(core.speechText('The pit (black arrowhead in Fig. 7A) is deep.'),'The pit (black arrowhead in Figure 7A) is deep.');
});
test('two and three term ratios are spoken in every supported speech language',()=>{
 for(const [lang,sep] of [['en',' to '],['zh','比'],['ja','対'],['fr',' pour ']]){
  for(const ratio of ['1:1','10:1','1:1:1','2.5 : 1','1：2：3'])assert.equal(core.measurementSpeech(ratio,lang),ratio.split(/\s*[:：]\s*/).join(sep).replace('2.5',{en:'2 point five',zh:'二点五',ja:'2点五',fr:'2 virgule cinq'}[lang]).replace(/\d+/g,n=>lang==='zh'?({1:'一',2:'二',3:'三',10:'十'}[n]||n):n));
 }
 assert.equal(core.measurementSpeech('A 10:1 ratio measures 370 μm.'),'A 10 to 1 ratio measures 370 micrometers.');
 assert.equal(core.ratioSpeech('At 10:30 am, visit https://host:443/page; IDx1:1.'),'At 10:30 am, visit https://host:443/page; IDx1:1.');
});
