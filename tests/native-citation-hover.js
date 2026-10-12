const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;if(!profile.includes('qa-profile'))throw Error('QA only');
const C=L.references,Q=L.referencesScope,wait=ms=>Zotero.Promise.delay(ms),checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const item=(await Zotero.Items.getAll(Zotero.Libraries.userLibraryID)).find(i=>i.isAttachment()&&i.getField('title')==='Bringmann citation QA');if(!item)throw Error('Import Bringmann fixture first');const reader=await Zotero.Reader.open(item.id);await reader._initPromise;await wait(1000);C.attach(reader);await C.references(reader);const s=C.readers.get(reader),v=reader._internalReader._primaryView,p=s.citationPages.get(31),pw=v._iframeWindow;
await reader.navigate({pageIndex:31});await wait(800);
try{
 // A retained settings overlay must not disable citation hover after dismissal.
 await L.showSettings(reader,s.doc);await Q.CiteLensUI.pageScopes.get(s.doc)?.queue;const f=s.doc.querySelector('.cl-settings');f._clPage.snap(false);await wait(60);check('settings remains retained and hidden',f._clPage.container.hidden,{container:f._clPage.container.outerHTML.slice(0,240),sameDoc:f.ownerDocument===s.doc});
 for(const [a,y] of [['Wilk','2014'],['Springer','2014'],['Fulton','1978'],['Mohammad','2011']]){
  const m=p.mentions.find(m=>m.keys.some(k=>k.author===a&&k.year===y)),c=p.chars.find(c=>p.offsets.get(c.offset)>=m.start+1&&p.offsets.get(c.offset)<m.end),pt=[(c.rect[0]+c.rect[2])/2,(c.rect[1]+c.rect[3])/2];
  const pv=pw.PDFViewerApplication.pdfViewer.getPageView(31),xy=pv.viewport.convertToViewportPoint(...pt),b=pv.div.getBoundingClientRect(),init=Components.utils.cloneInto({bubbles:true,clientX:b.left+xy[0],clientY:b.top+xy[1],buttons:0},pw),event=new pw.PointerEvent('pointermove',init);
  const position=null; // position relies on coordinates, not a synthetic overlay.
  pv.div.dispatchEvent(event);await wait(650);const popup=s.doc.querySelector('.cl-floating');check(a+' shows correct citation card',popup?.textContent.includes(a)&&popup?.textContent.includes(y),{point:pt,position,popup:popup?.textContent.slice(0,200)});popup?.remove();
 }
 const first=p.mentions.find(m=>m.keys.some(k=>k.author==='Wilk'&&k.year==='2014'));check('four source mentions resolve independently',p.mentions.filter(m=>/^(Wilk|Springer|Fulton|Mohammad)/.test(m.text)).every(m=>Q.CiteLensCitationLinks.result([m],s.referenceList).records.length===1));
 return {passed:true,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}
