// Independently transcribed PDF titles: check repaired locations, not parser-generated expectations.
const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;if(!/qa-profile-random5/.test(profile))throw Error('QA only');
const root=PathUtils.parent(profile),out=PathUtils.join(root,PathUtils.filename(profile).replace('qa-profile','test-results')),C=L.references,Q=L.referencesScope,K=Q.CiteLensCore,wait=ms=>Zotero.Promise.delay(ms),checks=[];
Q.CiteLensServices.state.settings.autoLookup=false;Q.CiteLensServices.state.settings.autoAuthors=false;
const cases={
 Z284B2SA:[['The C. elegans Sequencing Consortium','Genome sequence of the nematode C. elegans: a platform for investigating biology'],['Mapping and Sequencing Consortium','The DNA sequence of human chromosome 21'],['French FMF Consortium','A candidate gene for familial Mediterranean fever'],['International FMF Consortium','Ancient missense mutations in a new member of the RoRet gene family are likely to cause familial Mediterranean fever'],['Finley and Brent','Interaction mating reveals binary and ternary connections between Drosophila cell cycle regulators']],
 KU2YLAKH:[['Haubensak','Neurons arise in the basal neuroepithelium of the early mammalian telencephalon: A major site of neurogenesis']],
 MGNM92JF:[['R Development Core Team','R: A Language and Environment for Statistical Computing'],['Niemitz, 2010','Progreditur ordinara saltando et retrorsum... Normally proceeds in a leaping fashion, and backwards...']],
 XAVA3C57:[['13–16','Genetic Identification of Cell Types Underlying Brain Complex Traits Yields Novel Insights Into the Etiology of Parkinson’s Disease','range']],
 LMT6GZPN:[['[10]','Anti-VEGF crunch syndrome in proliferative diabetic retinopathy: a review'],['1','Late recurrence of acute retinal necrosis within retinal scars','number'],['2','Targeting RGD-binding integrins as an integrative therapy for diabetic retinopathy and neovascular age-related macular degeneration','number']]
};
const capture=await IOUtils.readUTF8(PathUtils.join(root,'tests','docs-capture.js')),grab=new Function('IOUtils','PathUtils',capture+';return captureDocs;')(IOUtils,PathUtils);
for(const [key,probes] of Object.entries(cases)){
 const item=(await Zotero.Items.getAll(Zotero.Libraries.userLibraryID)).find(x=>x.isAttachment()&&x.getField('title')==='Random citation QA '+key);if(!item)throw Error('Missing QA sample '+key);
 const r=await Zotero.Reader.open(item.id);await r._initPromise;for(let i=0;i<600&&!C.readerReady(r);i++)await wait(100);C.attach(r);const refs=await C.references(r),state=C.readers.get(r),pages=state.citationPages,d=state.doc,pw=r._internalReader._primaryView._iframeWindow;
 for(const [needle,expected,kind] of probes){let target;
  for(const [pageIndex,p] of pages){if(target)break;if(kind){const run=p.numericRuns.find(x=>kind==='range'?x.text===needle:new RegExp('(?:^|,)'+needle+'(?:,|$)').test(x.text));if(run){const at=kind==='range'?run.text.indexOf('–'):run.text.indexOf(needle);target={pageIndex,glyph:p.chars.find(c=>c.offset===run.offsets[at]),text:run.text};}}
   else {const m=p.mentions.find(x=>x.text.includes(needle));if(m)target={pageIndex,glyph:p.chars.find(c=>!c.ignorable&&p.offsets.get(c.offset)>=m.start&&p.offsets.get(c.offset)<m.end),text:m.text};}}
  if(!target){checks.push({key,needle,ok:false,error:'Missing citation coordinates'});continue;}
  C.closeFloating(r);await r.navigate({pageIndex:target.pageIndex});await wait(600);const pv=pw.PDFViewerApplication.pdfViewer.getPageView(target.pageIndex),rect=target.glyph.rect,xy=pv.viewport.convertToViewportPoint((rect[0]+rect[2])/2,(rect[1]+rect[3])/2);pw.PDFViewerApplication.pdfViewer.container.scrollTop+=pv.div.getBoundingClientRect().top+xy[1]-280;await wait(800);const b=pv.div.getBoundingClientRect();pv.div.dispatchEvent(new pw.PointerEvent('pointermove',Components.utils.cloneInto({bubbles:true,clientX:b.left+xy[0],clientY:b.top+xy[1],buttons:0},pw)));await wait(650);
  const popup=d.querySelector('.cl-floating:not([data-citation-closing]),.cl-native-host'),shown=[...(popup?.querySelectorAll('.cl-title')||[])].map(x=>x.textContent).join(' | '),ok=K.norm(shown).includes(K.norm(expected));checks.push({key,page:target.pageIndex+1,needle,expected,shown,ok});
  if(popup&&kind==='range')await grab(popup,'repaired-preprint-reference',out);
 }
 C.closeFloating(r);await r.close();await wait(200);
}
await IOUtils.writeUTF8(PathUtils.join(out,'targeted-regressions.json'),JSON.stringify({host:Zotero.version,passed:checks.every(x=>x.ok),checks},null,2));return {passed:checks.every(x=>x.ok),checks};
