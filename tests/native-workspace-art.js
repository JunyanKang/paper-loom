// Real rendered geometry: different-width pages must reveal one stationary artwork canvas.
const Q=L.referencesScope,U=Q.CiteLensUI,H=Q.CiteLensThemes,S=Q.CiteLensServices,V=L.voice,wait=ms=>Zotero.Promise.delay(ms),checks=[];
const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;if(!profile.includes('qa-profile'))throw Error('QA only');
const r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID),doc=r._iframeWindow.document,w=doc.defaultView;
Zotero.getMainWindow().Zotero_Tabs.select(r._tabID||r.tabID);
const saved={theme:S.state.settings.theme,global:S.state.settings.globalBackground,custom:S.state.settings.customThemeImage,image:H.customImage};
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const open=async id=>{let p;if(id==='settings')p=await L.showSettings(r,doc);else if(id==='network')p=L.references.showNetwork(r,{doc});else p=L.references.showPanel(r);await U.pageScopes.get(doc)?.queue;await wait(270);return doc.querySelector(id==='settings'?'.cl-settings':id==='network'?'.pn-map-window':'.cl-root');};
try{
 const cases=[...H.themes.map(t=>({name:t.id,theme:t.id})),...(H.globalBackgrounds||[]).map(g=>({name:'global-'+g.id,theme:'midnight',global:g.id})),{name:'custom',theme:'midnight',custom:true}];
 for(const fixture of cases){S.state.settings.theme=fixture.theme;S.state.settings.globalBackground=fixture.global||'';S.state.settings.customThemeImage=!!fixture.custom;if(fixture.custom)H.customImage=Q.CiteLens.assetURI+'themes/inkstone.jpg';H.refresh();const arts=[];
  for(const id of ['settings','references','network']){const p=await open(id),css=w.getComputedStyle(p,'::before'),b=p.getBoundingClientRect();arts.push({id,position:css.backgroundPosition.split(',').pop().trim(),width:css.width,height:css.height,size:css.backgroundSize.split(',').pop().trim(),image:css.backgroundImage.match(/url\([^)]*\)/)?.[0],right:b.right,bottom:b.bottom,pinRight:css.right,pinBottom:css.bottom});
   if(id==='settings'){const inner=p.querySelector('iframe').contentDocument;check(fixture.name+' embedded settings have no extra surface',inner.defaultView.getComputedStyle(inner.querySelector('.pv-panel')).backgroundColor==='rgba(0, 0, 0, 0)');}
  }
  check(fixture.name+' fixed bottom-right artwork across three pages',arts.every(a=>a.position==='100% 100%'&&a.pinRight==='0px'&&a.pinBottom==='0px'&&a.width===arts[0].width&&a.height===arts[0].height&&a.size==='cover'&&a.image===arts[0].image&&Math.abs(a.right-arts[0].right)<1&&Math.abs(a.bottom-arts[0].bottom)<1),arts);
 }
 return {passed:true,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}finally{S.state.settings.theme=saved.theme;S.state.settings.globalBackground=saved.global;S.state.settings.customThemeImage=saved.custom;H.customImage=saved.image;H.refresh();}
