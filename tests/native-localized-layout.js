const V=L.voice,Q=L.referencesScope,U=Q.CiteLensUI,S=Q.CiteLensServices,H=Q.CiteLensThemes,wait=ms=>Zotero.Promise.delay(ms),checks=[],issues=[];
const reader=Zotero.Reader._readers.find(r=>r._tabID||r.tabID);Zotero.getMainWindow().Zotero_Tabs.select(reader._tabID||reader.tabID);const doc=reader._iframeWindow.document,w=doc.defaultView,ui=V.ensurePanel(reader),saved=S.state.settings.interfaceLanguage;
const base=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),out=PathUtils.join(base,PathUtils.filename(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path).replace('qa-profile','test-results'),'layout');await IOUtils.makeDirectory(out,{ignoreExisting:true});
const settle=async()=>{await U.pageScopes.get(doc)?.queue;await ui.waitMotion();for(let i=0;i<100&&doc.querySelector('[data-dock-motion]');i++)await wait(25);await wait(180);};
const visible=el=>{const b=el.getBoundingClientRect();return b.width>0&&b.height>0&&el.ownerDocument.defaultView.getComputedStyle(el).visibility!=='hidden';};
const check=(name,ok,detail)=>checks.push({name,ok,detail});
const inspect=(root,label)=>{
 const win=root.ownerDocument.defaultView;
 for(const el of [root,...root.querySelectorAll('*')]){
  if(!visible(el))continue;const css=win.getComputedStyle(el);
  if(/auto|scroll/.test(css.overflowY+' '+css.overflowX)&&(el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2))check(label+' hides scrollbar '+el.className,css.scrollbarWidth==='none');
  if(el.matches('.pv-setting-row,.cl-setting-row,.pv-shortcut-row')){
   const children=[...el.children].filter(visible).filter(c=>!c.matches('select[hidden],input[type=hidden]'));for(let i=1;i<children.length;i++){const a=children[i-1].getBoundingClientRect(),b=children[i].getBoundingClientRect();if(a.right>b.left+2&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+2)issues.push({label,type:'overlap',row:el.textContent.trim().slice(0,100),a:a.toJSON(),b:b.toJSON()});}
  }
  if(el.matches('.pv-mode-options>button>span,.cl-settings-tabs>button,.pv-settings-tabs>button,.pl-engine-actions>button')){const range=root.ownerDocument.createRange();range.selectNodeContents(el);const b=el.getBoundingClientRect();for(const t of range.getClientRects())if(t.right>b.right+2||t.left<b.left-2||t.bottom>b.bottom+2)issues.push({label,type:'text-overflow',text:el.textContent,b:b.toJSON(),t:t.toJSON()});}
 }
};
const snap=async(el,name)=>{const b=el.getBoundingClientRect(),c=doc.createElement('canvas');c.width=Math.ceil(b.width*2);c.height=Math.ceil(b.height*2);const ctx=c.getContext('2d');ctx.scale(2,2);ctx.drawWindow(w,b.x,b.y,b.width,b.height,'#fff');await IOUtils.write(PathUtils.join(out,name+'.png'),Uint8Array.from(w.atob(c.toDataURL().split(',')[1]),x=>x.charCodeAt(0)));};
try{for(const lang of ['zh','en','ja','fr','de']){
 S.state.settings.interfaceLanguage=lang;H.refresh();V.setLanguage(lang);L.showHome(reader,doc);await settle();inspect(ui.panel,lang+' listening');await snap(ui.panel,lang+'-listening');
 await L.showSettings(reader,doc);await settle();const f=doc.querySelector('.cl-settings');for(const tab of ['general','appearance','voice','shortcuts']){f._plSelect(tab);await wait(300);inspect(f,lang+' '+tab);const inside=f.querySelector('iframe').contentDocument;inspect(inside.querySelector('.pv-panel'),lang+' embedded '+tab);await snap(f,lang+'-'+tab);}
 ui.panel._clPage.activate();await settle();ui.panel.querySelector('[data-loom-page=references]').click();await settle();inspect(doc.querySelector('.cl-root'),lang+' references');
 }
 check('translated rows and tabs have no collisions or overflow',issues.length===0,issues);return {passed:checks.every(x=>x.ok),checks};
}finally{S.state.settings.interfaceLanguage=saved;H.refresh();V.setLanguage(saved||'auto');}
