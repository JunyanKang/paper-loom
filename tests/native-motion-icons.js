const loomQAPath=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path);if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
if(!Zotero.Reader._readers.some(r=>r._tabID||r.tabID)){const a=await Zotero.Attachments.importFromFile({file:PathUtils.join(loomQAPath,'docs','demo','reading-demo.pdf')});const reader=await Zotero.Reader.open(a.id);await reader._initPromise;for(let i=0;i<100&&!L.voice.panels.has(reader);i++)await Zotero.Promise.delay(100);await Zotero.Promise.delay(800);}
const wait=ms=>Zotero.Promise.delay(ms),checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);},V=L.voice,U=L.referencesScope.CiteLensUI;
const r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID),doc=r._iframeWindow.document,win=doc.defaultView,ui=V.ensurePanel(r),C=L.voiceScope.PaperVoiceCompanion,base=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),out=PathUtils.join(base,PathUtils.filename(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path).replace('qa-profile','test-results'));
const before=V.get('companionInteractions',true);V.set('companionInteractions',true);
const settle=async()=>{await U.pageScopes.get(doc)?.queue;await ui.waitMotion();for(let i=0;i<80&&doc.querySelector('[data-dock-motion]');i++)await wait(50);await wait(160);};
try{
 for(const v of [...U.livePages(doc)])v.snap(false);V.dismissPanel(r);await settle();
 const start=ui.action('orb').getBoundingClientRect(),surface=ui.find('mascotInteraction'),canvas=surface.querySelector('canvas'),hash=()=>canvas.toDataURL();await wait(250);check('new mascot loaded',surface.dataset.ready==='true');
 const hashes=[],board=doc.createElement('canvas');board.width=560;board.height=120;const ctx=board.getContext('2d');ctx.fillStyle='#f5f5ee';ctx.fillRect(0,0,560,120);
 for(const [i,context] of ['listening','references','network','settings'].entries()){
  ui.setContext(context);ui.performContext();await wait(580);hashes.push(hash());const b=ui.action('orb').getBoundingClientRect();check(context+' keeps fixed hit target',b.x===start.x&&b.y===start.y&&b.width===start.width);ctx.drawImage(canvas,0,0,256,256,14+i*136,8,64,64);ctx.fillStyle='#243d38';ctx.font='13px sans-serif';ctx.fillText(context,14+i*136,100);await wait(650);
 }
 check('four functions have different visible performances',new Set(hashes).size===4);
 await IOUtils.write(PathUtils.join(out,'motion-actual-size.png'),Uint8Array.from(win.atob(board.toDataURL().split(',')[1]),v=>v.charCodeAt(0)));
 const bus=r._internalReader._primaryView._iframeWindow.PDFViewerApplication.eventBus;
 bus.dispatch('pagechanging',Components.utils.cloneInto({pageNumber:2},r._internalReader._primaryView._iframeWindow));await wait(330);check('forward page has dedicated motion',surface.dataset.gesture==='page-forward');bus.dispatch('pagechanging',Components.utils.cloneInto({pageNumber:1},r._internalReader._primaryView._iframeWindow));await wait(330);check('backward page has different motion',surface.dataset.gesture==='page-backward');await wait(1200);
 const boxes=[];V.showPanel(r);await settle();boxes.push(ui.panel.getBoundingClientRect().toJSON());
 const refs=L.references.showPanel(r);await settle();boxes.push(refs.getBoundingClientRect().toJSON());
 await L.showSettings(r,doc);await settle();boxes.push(doc.querySelector('.cl-settings').getBoundingClientRect().toJSON());
 const network=L.references.showNetwork(r,{doc});await settle();boxes.push(network.getBoundingClientRect().toJSON());
 check('all right side windows share bottom right edge',boxes.every(b=>Math.abs(b.right-boxes[0].right)<1&&Math.abs(b.bottom-boxes[0].bottom)<1),boxes);
 for(const v of [...U.livePages(doc)])v.snap(false);
 const dialog=U.dialog(doc,'Icon check'),record={title:'Reading',abstract:'The retina transforms light into signals that allow us to see the world.',verified:false};const card=U.card(doc,record,r,{detailed:true});dialog.root.append(card);U.abstractPopover(doc,card,card.querySelector('.cl-title'),()=>record);await wait(600);const button=doc.querySelector('[data-loom-action=listen-abstract]');check('abstract has headphones icon and accessible name',button?.querySelector('svg path')?.getAttribute('d').includes('M3 14')&&!!button.getAttribute('aria-label'));const b=button.getBoundingClientRect();check('abstract icon has usable compact hit area',b.width>=28&&b.width<=40&&b.height>=28,{width:b.width,height:b.height});doc._clAbstract.close(true);dialog.close();
 V.showPanel(r);await wait(120);V.dismissPanel(r);await wait(120);V.showPanel(r);await settle();check('rapid reverse ends with usable open panel',!ui.panel.hidden&&!ui.panel.inert&&!ui.panel.dataset.dockMotion);V.dismissPanel(r);await settle();
 return {passed:true,version:Zotero.version,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}finally{V.set('companionInteractions',before);}
