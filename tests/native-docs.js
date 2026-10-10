// Capture the real product UI in a dedicated profile using clearly labelled demo content.
const w=Zotero.getMainWindow(),d=w.document,Q=L.referencesScope,{CiteLensUI:U,CiteLensServices:S,CiteLensThemes:H,CiteLensI18n:I}=Q,base=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),out=PathUtils.join(base,'docs','images'),wait=ms=>Zotero.Promise.delay(ms);
if(!Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path.includes('qa-profile'))throw Error('Demo requires QA profile');
await IOUtils.makeDirectory(out,{ignoreExisting:true});w.resizeTo(1280,960);await wait(500);
const capture=async(el,name)=>{await wait(700);const doc=el.ownerDocument,win=doc.defaultView,r=el===doc.documentElement?{x:0,y:0,width:win.innerWidth,height:win.innerHeight}:el.getBoundingClientRect(),x=Math.max(0,r.x-8),y=Math.max(0,r.y-8),width=Math.min(win.innerWidth-x,r.width+16),height=Math.min(win.innerHeight-y,r.height+16),c=doc.createElementNS('http://www.w3.org/1999/xhtml','canvas');c.width=Math.ceil(width)*2;c.height=Math.ceil(height)*2;const ctx=c.getContext('2d');ctx.scale(2,2);ctx.drawWindow(win,x,y,width,height,'#f6f8f7');await IOUtils.write(PathUtils.join(out,name+'.png'),Uint8Array.from(win.atob(c.toDataURL().split(',')[1]),v=>v.charCodeAt(0)));return {name,width,height};};
const until=async(fn,label)=>{for(let n=0;n<400;n++){if(await fn())return;await wait(150);}throw Error(label);};
let collection=(await Zotero.Collections.getByLibrary(Zotero.Libraries.userLibraryID)).find(c=>c.name==='Paper Loom · Demo');if(!collection){collection=new Zotero.Collection();collection.name='Paper Loom · Demo';await collection.saveTx();}
const titles=['Reading the developing retina','A guide to retinal cell diversity','From cells to visual circuits','Following evidence across scales','Mapping the retinal landscape','Listening to scientific arguments','Exploring developmental transitions','Organizing a literature collection'];
const people=[['Maya','Chen'],['Oliver','Reed'],['Sofia','Martin'],['Leo','Park'],['Nora','Lin'],['Evan','Taylor'],['Aria','Wang'],['Liam','Stone']];
const combos=[[0,1,2],[0,2,3],[1,3,4],[0,4,5],[2,5,6],[1,6,7],[3,4,7],[0,5,7]];
let items=await collection.getChildItems();
if(!items.length){for(let n=0;n<titles.length;n++){const item=new Zotero.Item('journalArticle');item.setField('title',titles[n]);item.setField('date',String(2026-(n%3)));item.setField('publicationTitle','Paper Loom demonstration library');item.setField('abstractNote','The retina transforms light into signals that allow us to see the world. This illustrative reading example introduces a workflow for listening to a passage, comparing a translation, and following a reference. It is a demonstration document, not a scientific publication.');item.setCreators(combos[n].map(i=>({creatorType:'author',firstName:people[i][0],lastName:people[i][1]})));item.addToCollection(collection.id);await item.saveTx();items.push(item);}}
const parent=items.find(i=>i.getField('title')===titles[0]);parent.setField('abstractNote','The retina transforms light into signals that allow us to see the world. Photoreceptors detect incoming light, interneurons shape visual signals, and retinal ganglion cells carry the output to the brain. Understanding retinal development connects the formation of individual cell types with the organization of complete visual circuits.');await parent.saveTx();let attachment=parent.getAttachments().map(id=>Zotero.Items.get(id))[0];if(!attachment)attachment=await Zotero.Attachments.importFromFile({file:PathUtils.join(base,'docs','demo','reading-demo.pdf'),parentItemID:parent.id});
// No manual attachReader or ensurePanel here: opening the PDF must create the companion automatically.
const reader=(await Zotero.Reader.open(attachment.id))||Zotero.Reader._readers.find(r=>r.itemID===attachment.id);await reader._initPromise;await until(()=>L.voice.panels.get(reader)?.root.isConnected,'automatic companion');await wait(1800);
const rd=reader._iframeWindow.document,ui=L.voice.panels.get(reader),checks=[];
const orb=ui.action('orb'),rect=orb.getBoundingClientRect();checks.push({name:'new PDF automatically shows floating book',ok:rect.width>30&&rect.height>30&&rect.right<=rd.defaultView.innerWidth&&rect.bottom<=rd.defaultView.innerHeight});
const host=d.getElementById('zotero-items-toolbar'),entry=host.querySelector('.pl-library-entry'),spacer=[...host.children].find(e=>e.localName==='spacer');checks.push({name:'launcher precedes flexible spacer',ok:!!(entry.compareDocumentPosition(spacer)&4)});
L.demoReader=reader;L.demoParent=parent;L.captureDocs=capture;
const previousInteractions=L.voice.get('companionInteractions',true);
S.state.settings.theme='porcelain';S.state.settings.transparency=0;L.voice.set('companionInteractions',false);L.voice.set('translationProvider','tencenttransmart');L.voice.set('translationTarget','zh-Hans');
const images=[];
for(const lang of ['zh','en']){
 S.state.settings.interfaceLanguage=lang;await S.persist();H.refresh();I.refresh?.();L.voice.setLanguage(lang);await wait(500);
 // Compact and expanded listening both use the actual panel.
 L.voice.dismissPanel(reader);images.push(await capture(rd.documentElement,'floating-'+lang));
 L.voice.showPanel(reader);images.push(await capture(rd.documentElement,'listening-'+lang));L.voice.dismissPanel(reader);
 const home=L.showHome(null,d);await U.pageQueue;images.push(await capture(home.frame,'home-'+lang));home.close();await wait(400);
 await L.showSettings(null,d);let f=d.querySelector('.cl-settings');f._plSelect('voice');await wait(700);images.push(await capture(f,'voices-'+lang));f._clClose();await wait(350);
 const dialog=U.dialog(rd,lang==='zh'?'引文与稍后读':'References & reading list');await U.pageQueue;
 const record={title:titles[0],year:'2026',author:'Maya Chen; Oliver Reed; Sofia Martin',authors:combos[0].map(i=>({given:people[i][0],family:people[i][1]})),journal:'Paper Loom demonstration library',abstract:parent.getField('abstractNote'),verified:false};
 const card=U.card(rd,record,reader,{context:{parentID:parent.id},detailed:true});dialog.root.append(card);await wait(250);U.abstractPopover(rd,card,card.querySelector('.cl-title'),()=>record);await wait(800);images.push(await capture(rd.documentElement,'references-'+lang));rd._clAbstract?.close(true);dialog.close();await wait(400);
 const network=L.references.showNetwork(null,{doc:d});await U.pageQueue;await until(()=>network._pnModel&&network.querySelector('.pn-map-stage')?.getAttribute('aria-busy')==='false','network');
 const select=network.querySelector('.pn-map-controls').querySelectorAll('select')[1];select.value=String(collection.id);select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(1500);await until(()=>network._pnModel?.nodes.some(n=>n.title==='Maya Chen'),'demo network');
 const node=network._pnModel.nodes.find(n=>n.title==='Maya Chen');await network._pnSelect(node.id);await wait(700);images.push(await capture(network,'network-'+lang));
 const career=Q.CiteLensCareerUI.open(d,{orcid:'0000-0002-9053-5249',name:'Dawang Zhou',host:network});await until(()=>career.querySelector('.pn-career-event'),'career');images.push(await capture(career,'career-'+lang));career._clClose();network._pnClose();await wait(350);
}
L.voice.set('companionInteractions',previousInteractions);
return {passed:checks.every(c=>c.ok),checks,images};
