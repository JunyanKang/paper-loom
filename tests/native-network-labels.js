if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const Q=L.referencesScope,S=Q.CiteLensServices,U=Q.CiteLensUI,d=Zotero.getMainWindow().document,w=d.defaultView,checks=[],wait=ms=>Zotero.Promise.delay(ms);
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const until=async fn=>{for(let i=0;i<200;i++){if(fn())return;await wait(100);}throw Error('Network timed out');};
let frame;
try{
 for(let i=0;i<4;i++){const item=new Zotero.Item('journalArticle');item.setField('title','Label toggle fixture '+i);item.setCreators([{firstName:'Ada',lastName:'Example',creatorType:'author'},{firstName:'Ravi',lastName:'Example'+i,creatorType:'author'}]);await item.saveTx();}
 d.querySelector('.pn-map-window')?._clPage?.destroy();delete S.state.settings.networkLabels;
 frame=L.references.showNetwork(null,{doc:d});await U.pageScopes.get(d)?.queue;await until(()=>frame._pnScene?.labels>0&&!frame._pnScene.moving);await wait(400);
 const button=frame.querySelector('[data-network-labels]'),job=frame._pnJob,camera=JSON.stringify(frame._pnCamera),nodes=frame._pnScene.nodes;
 check('four compact toolbar icons and labels shown by default',frame.querySelector('.pn-map-tools').children.length===4&&button.getAttribute('aria-pressed')==='true'&&frame._pnLabels.length>0);
 button.click();await wait(200);check('hiding labels clears text and invisible label hit areas',frame._pnScene.labels===0&&frame._pnLabels.length===0&&frame._pnCareerHits.length===0&&button.getAttribute('aria-pressed')==='false');
 check('toggle preserves graph and camera',frame._pnJob===job&&JSON.stringify(frame._pnCamera)===camera&&frame._pnScene.nodes===nodes);
 await S.persist();check('choice is saved',JSON.parse(await IOUtils.readUTF8(S.path)).settings.networkLabels===false);
 frame._clPage.destroy();frame=L.references.showNetwork(null,{doc:d});await U.pageScopes.get(d)?.queue;await until(()=>frame._pnScene?.nodes>0);await wait(300);
 check('reopening retains hidden labels',frame.querySelector('[data-network-labels]').getAttribute('aria-pressed')==='false'&&frame._pnLabels.length===0);
 frame.querySelector('[data-network-labels]').click();await until(()=>frame._pnLabels.length>0);check('labels restore without rebuilding',frame._pnScene.labels>0&&S.state.settings.networkLabels===true);
 const bounds=frame.getBoundingClientRect(),canvas=d.createElementNS('http://www.w3.org/1999/xhtml','canvas');canvas.width=Math.ceil(bounds.width);canvas.height=Math.ceil(bounds.height);canvas.getContext('2d').drawWindow(w,bounds.x,bounds.y,bounds.width,bounds.height,'#fff');const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;await IOUtils.write(PathUtils.join(PathUtils.parent(profile),PathUtils.filename(profile).replace('qa-profile','test-results'),'network-labels.png'),Uint8Array.from(w.atob(canvas.toDataURL().split(',')[1]),x=>x.charCodeAt(0)));
 return {passed:true,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}
