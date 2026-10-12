if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const Q=L.referencesScope,U=Q.CiteLensUI,C=L.references,N=Q.CiteLensNetwork,wait=ms=>Zotero.Promise.delay(ms),checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);},until=async(fn,label)=>{for(let i=0;i<300;i++){if(fn())return;await wait(50);}throw Error('Timed out: '+label);};
try{
 const item=(await Zotero.Items.getAll(Zotero.Libraries.userLibraryID)).find(i=>i.isAttachment()&&i.getField('title')==='Senescence citation QA');if(!item)throw Error('Import Senescence citation fixture first');
 const r=await Zotero.Reader.open(item.id);await r._initPromise;await wait(400);C.attach(r);const refs=await C.references(r),d=r._iframeWindow.document,w=d.defaultView,ui=L.voice.ensurePanel(r);check('all 98 numbered references present',Array.from({length:98},(_,i)=>i+1).every(n=>refs.some(x=>x.number===n)),{count:refs.length});
 for(const v of U.livePages(d))v.snap(false);
 const state=C.readers.get(r),page=state.citationPages.get(1),view=r._internalReader._primaryView,pw=view._iframeWindow;await r.navigate({pageIndex:1});await wait(400);
 for(const text of ['2–7','2–6,8–10','3,5,6,11–15']){
  const run=page.numericRuns.find(x=>x.text===text),rect=run.rects[0],pt=[(rect[0]+rect[2])/2,(rect[1]+rect[3])/2],pv=pw.PDFViewerApplication.pdfViewer.getPageView(1),xy=pv.viewport.convertToViewportPoint(...pt);pw.PDFViewerApplication.pdfViewer.container.scrollTop+=pv.div.getBoundingClientRect().top+xy[1]-300;await wait(100);const b=pv.div.getBoundingClientRect();
  pv.div.dispatchEvent(new pw.PointerEvent('pointermove',Components.utils.cloneInto({bubbles:true,clientX:b.left+xy[0],clientY:b.top+xy[1],buttons:0},pw)));await wait(650);
  const popup=d.querySelector('.cl-floating');check(text+' actual hover opens correct first reference',!!popup&&popup.textContent.includes(refs.find(x=>x.number===Number(text[0])).author),{text:popup?.textContent.slice(0,150)});C.dismissFloating(r);
 }
 const event=(node,type,relatedTarget=null)=>node.dispatchEvent(new w.PointerEvent(type,{bubbles:true,pointerType:'mouse',relatedTarget}));
 event(ui.action('orb'),'pointerover');await until(()=>d.querySelector('.cl-settings')&&!d.querySelector('.cl-settings').hidden&&!d.querySelector('.cl-settings').dataset.dockMotion,'hover settings');check('hover opens settings',!d.querySelector('.cl-settings').hidden);
 event(ui.action('orb'),'pointerout',d.body);await wait(70);event(d.querySelector('.cl-settings'),'pointerover');await wait(250);check('crossing the gap retains panel',!d.querySelector('.cl-settings').hidden);
 const child=d.querySelector('.cl-settings iframe')?.contentDocument;if(child){child.body.dispatchEvent(new child.defaultView.PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));await wait(230);check('embedded settings retains panel',!d.querySelector('.cl-settings').hidden);}
 const list=C.showPanel(r);await U.pageScopes.get(d)?.queue;await until(()=>list.querySelectorAll('.cl-list-row').length===60,'atomic list');
 const first=list.querySelector('.cl-list-row'),body=list.querySelector('.cl-body');body.scrollTop=120;const scroll=body.scrollTop,network=C.showNetwork(r,{doc:d});await U.pageScopes.get(d)?.queue;await until(()=>network._pnModel&&!network.querySelector('.pn-map-stage').getAttribute('aria-busy').includes('true'),'graph');
 const job=network._pnJob,camera=network._pnCamera,stage=network.querySelector('.pn-map-stage'),scene=Q.CiteLensNetworkView.scene(network._pnModel,Q.CiteLensNetworkView.index(network._pnModel));
 check('eye icon used',network.querySelector('[data-network-labels]').dataset.icon==='eye');
 check('all nodes fit stage', [...scene.nodes,...(scene.contextNodes||[])].every(n=>n.x*camera.k+camera.x>=20&&n.x*camera.k+camera.x<=stage.clientWidth-20&&n.y*camera.k+camera.y>=30&&n.y*camera.k+camera.y<=stage.clientHeight-25),{camera,w:stage.clientWidth,h:stage.clientHeight});
 let removed=0;const observer=new w.MutationObserver(changes=>{for(const m of changes)removed+=m.removedNodes.length;});observer.observe(body,{childList:true});
 let frames=[];const start=w.performance.now();let handle;const sample=()=>{frames.push(w.performance.now()-start);handle=w.requestAnimationFrame(sample);};handle=w.requestAnimationFrame(sample);C.showPanel(r);await U.pageScopes.get(d)?.queue;await wait(300);w.cancelAnimationFrame(handle);observer.disconnect();
 check('returning list retains DOM and scroll without reload',list.querySelector('.cl-list-row')===first&&body.scrollTop===scroll&&removed===0,{removed,scroll:body.scrollTop});check('no width animation on switch',!list.dataset.workspaceMotion&&list.getAnimations().length===0);
 C.showNetwork(r,{doc:d});await U.pageScopes.get(d)?.queue;await wait(300);check('returning network reuses layout',network._pnJob===job);
 event(network,'pointerout',d.body);await wait(80);event(network,'pointerover');await wait(220);check('reentry cancels hover close',!network.hidden);event(network,'pointerout',d.body);await until(()=>network.hidden,'hover closes');check('leaving hover region closes panel',network.hidden);
 event(ui.action('orb'),'pointerover');await until(()=>!network.hidden&&!network.dataset.dockMotion,'hover restores');check('hover restores last workspace without rebuilding',network._pnJob===job);
 return {passed:true,checks,switchFrames:frames.length,maxFrameGap:Math.max(0,...frames.slice(1).map((x,i)=>x-frames[i]))};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}
