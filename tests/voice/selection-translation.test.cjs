const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),core=require('../../addon/voice/core.js');
function setup(items){
 const pdf={numPages:1,getPage:async()=>({view:[0,0,600,800],getTextContent:async()=>({items})})};
 const ctx={PaperVoiceCore:core,PaperVoiceTranslation:{},PaperVoicePipeline:{cancelled:()=>Object.assign(Error('cancelled'),{name:'AbortError'})},Components:{utils:{waiveXrays:x=>x}},Zotero:{getMainWindow:()=>({setTimeout}),Promise:{delay:async()=>{}}}};
 vm.createContext(ctx);for(const file of ['main.js','performance.js'])vm.runInContext(fs.readFileSync(path.join(root,'addon/voice',file),'utf8'),ctx);
 const p=ctx.PaperVoice;p.publicationMargins=async()=>new Set();return {p,reader:{_internalReader:{_primaryView:{_iframeWindow:{PDFViewerApplication:{pdfDocument:pdf}}}}}};
}
const item=(str,y=200)=>({str,width:str.length*5,height:10,transform:[10,0,0,10,10,y],hasEOL:true});
test('explicit caption translation keeps narration filtering and its cache intact',async()=>{
 const items=[item('Fig. 2. Neural activity was measured in retinal cells.'),item('Cells responded to light.',186)],{p,reader}=setup(items),selection={text:'Neural activity',pageIndex:0};
 assert.ok(!(await p.pageLayout(reader,0)).text.includes('Neural activity'));
 assert.equal(await p.selectionTranslationText(reader,selection,'sentence'),'Neural activity was measured in retinal cells.');
 assert.match(await p.selectionTranslationText(reader,selection,'paragraph'),/Neural activity/);
 assert.ok(!(await p.pageLayout(reader,0)).text.includes('Neural activity'));
});
test('readable selection survives an unavailable PDF layout',async()=>{const {p,reader}=setup([]);p.resolveSelection=async()=>{throw Error('page not ready')};assert.equal(await p.selectionTranslationText(reader,{text:'Selected readable text.',pageIndex:0},'sentence'),'Selected readable text.');});
test('ambiguous selection does not jump to an unrelated sentence',async()=>{const {p,reader}=setup([item('Repeated word.'),item('Repeated word.',100)]);assert.equal(await p.selectionTranslationText(reader,{text:'Repeated',pageIndex:0},'sentence'),'Repeated');});
test('empty and cancelled selections do not start translation',async()=>{const {p,reader}=setup([]);await assert.rejects(p.selectionTranslationText(reader,{text:' '},'sentence'),/无法定位/);p.resolveSelection=async()=>{throw Object.assign(Error('cancelled'),{name:'AbortError'})};await assert.rejects(p.selectionTranslationText(reader,{text:'Cells.'},'sentence'),{name:'AbortError'});});
test('ordinary body selections still expand to complete sentences',async()=>{const {p,reader}=setup([item('Retinal cells respond to light. Other cells rest.')]);assert.equal(await p.selectionTranslationText(reader,{text:'respond',pageIndex:0},'sentence'),'Retinal cells respond to light.');});
