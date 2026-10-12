// Cold profile: no prior UI, theme cache, voice installation or saved dimensions.
const w=Zotero.getMainWindow(),d=w.document,V=L.voice,Q=L.referencesScope,U=Q.CiteLensUI,wait=ms=>Zotero.Promise.delay(ms),checks=[];
const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;
if(!profile.includes('qa-profile-firstboot'))throw Error('Fresh QA profile only');
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const assets=new Set();
const inspect=async(frame,label)=>{
 const win=frame.ownerDocument.defaultView,rect=()=>frame.getBoundingClientRect(),first=rect().toJSON();
 check(label+' fits viewport',first.width>200&&first.height>100&&first.left>=0&&first.top>=0&&first.right<=win.innerWidth+1&&first.bottom<=win.innerHeight+1,first);
 const background=win.getComputedStyle(frame,'::before');check(label+' has initial theme surface',background.backgroundImage!=='none');
 for(const match of background.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g))assets.add(match[1]);
 for(const img of frame.querySelectorAll('img[src]'))assets.add(img.src);
 await wait(450);const settled=rect();check(label+' keeps dimensions after first paint',Math.abs(first.width-settled.width)<1&&Math.abs(first.height-settled.height)<1,{first,settled:settled.toJSON()});
 for(const row of frame.querySelectorAll('.cl-setting-row')){const labelEl=row.querySelector('label');if(!labelEl||!labelEl.getBoundingClientRect().height)continue;const b=labelEl.getBoundingClientRect();check(label+' label stays inside '+labelEl.textContent,b.left>=settled.left&&b.right<=settled.right&&(!labelEl.clientWidth||labelEl.scrollWidth<=labelEl.clientWidth+1),{label:b.toJSON(),frame:settled.toJSON(),client:labelEl.clientWidth,scroll:labelEl.scrollWidth});}
};
try{
 check('no voice installation carried over',!Runtime.installed);check('default language is English',V.language()==='en'&&Q.CiteLensI18n.language()==='en');
 w.resizeTo(1100,820);w.Zotero_Tabs.select('zotero-pane');
 await L.showSettings(null,d);await U.pageScopes.get(d)?.queue;await inspect(d.querySelector('.cl-settings'),'cold settings');
 const embedded=d.querySelector('.cl-settings iframe'),inside=embedded.contentDocument;
 check('embedded settings settle to actual content height',Math.abs(embedded.getBoundingClientRect().height-inside.querySelector('.pv-panel').getBoundingClientRect().height)<1);
 const missing=[...inside.querySelectorAll('img[src]')];for(const img of missing)assets.add(img.src);
 const parent=new Zotero.Item('journalArticle');parent.setField('title','Fresh installation layout fixture');await parent.saveTx();
 const attachment=await Zotero.Attachments.importFromFile({file:PathUtils.join(PathUtils.parent(profile),'docs','demo','reading-demo.pdf'),parentItemID:parent.id});
 const r=await Zotero.Reader.open(attachment.id);await r._initPromise;for(let i=0;i<80&&!V.panels.get(r);i++)await wait(100);
 check('new PDF attaches floating launcher automatically',!!V.panels.get(r));const doc=r._iframeWindow.document;
 for(const page of ['settings','references','network']){
  for(const live of [...U.livePages(doc)])live.destroy();
  if(page==='settings')await L.showSettings(r,doc);else if(page==='references')L.references.showPanel(r);else L.references.showNetwork(r,{doc});
  await U.pageScopes.get(doc)?.queue;await inspect(doc.querySelector({settings:'.cl-settings',references:'.cl-root',network:'.pn-map-window'}[page]),'first PDF '+page);
 }
 for(const src of assets){const image=new w.Image();image.src=src;await Promise.race([image.decode(),wait(5000).then(()=>{throw Error('Image decode timeout');})]);check('bundled image decodes '+src.split('/').pop(),image.naturalWidth>0&&image.naturalHeight>0);}
 return {passed:true,checks,assets:assets.size};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}
