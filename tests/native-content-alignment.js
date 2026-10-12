// Measure rendered content across the host document and embedded settings frame.
const V=L.voice,Q=L.referencesScope,U=Q.CiteLensUI,S=Q.CiteLensServices,H=Q.CiteLensThemes,wait=ms=>Zotero.Promise.delay(ms),checks=[];
const profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;if(!profile.includes('qa-profile'))throw Error('QA only');
const r=Zotero.Reader._readers.find(r=>r._tabID||r.tabID),saved=S.state.settings.interfaceLanguage;
const visible=e=>!!e.getBoundingClientRect().width&&!!e.getBoundingClientRect().height;
const rect=e=>{const b=e.getBoundingClientRect(),x=e.ownerDocument.defaultView.mozInnerScreenX;return {left:b.left+x,right:b.right+x,width:b.width};};
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
const same=(name,actual,expected)=>check(name,Math.abs(actual-expected)<1,{actual,expected});
try{for(const reader of [r,null]){const doc=reader?reader._iframeWindow.document:Zotero.getMainWindow().document;Zotero.getMainWindow().Zotero_Tabs.select(reader?(r._tabID||r.tabID):'zotero-pane');
 for(const lang of ['en','zh']){
 S.state.settings.interfaceLanguage=lang;H.refresh();V.setLanguage(lang);const label=(reader?'PDF ':'library ')+lang,result=await L.showHome(reader,doc);
 const settle=async()=>{await U.pageScopes.get(doc)?.queue;await wait(250);};await settle();
 const f=doc.querySelector('.cl-settings'),frame=rect(f),left=frame.left+20,right=frame.right-20;
 const nav=rect(f.querySelector('.pl-main-actions>button'));
 for(const tab of ['general','shortcuts','appearance']){f._plSelect(tab);await wait(240);const inside=f.querySelector('iframe').contentDocument;
  for(const d of [doc,inside])for(const row of d.querySelectorAll('.cl-settings .cl-setting-row,.pl-embedded .pv-setting-row,.pl-embedded .pv-shortcut-row')){if(!visible(row)||row.closest('.cl-llm-popover'))continue;same(label+' '+tab+' row left',rect(row).left,left);same(label+' '+tab+' row right',rect(row).right,right);
   for(const c of row.querySelectorAll(':scope>input[type=checkbox]'))same(label+' '+tab+' switch right',rect(c).right,right);
   for(const c of row.querySelectorAll('.pl-language-select:not(.pl-voice-select) img,.pl-voice-select .pl-voice-symbol>.pl-flag'))same(label+' '+tab+' logo right',rect(c).right,right);
  }
  if(tab==='appearance'){
   for(const row of f.querySelectorAll('.pl-update-schedule,.cl-update-row,.cl-update-links')){same(label+' updates left '+row.className,rect(row).left,left);same(label+' updates right '+row.className,rect(row).right,right);}
   const links=[...f.querySelectorAll('.cl-update-links button')];check(label+' resources consolidated in About',links.length===1);same(label+' About entry centered',(rect(links[0]).left+rect(links[0]).right)/2,(left+right)/2);
   for(const c of f.querySelectorAll('.cl-update-footer input[type=checkbox]'))same(label+' update toggle left',rect(c).left,left);
  }
  if(tab==='shortcuts'){const keys=[...inside.querySelectorAll('.pv-shortcut-key')].filter(visible);check(label+' shortcut controls share both column edges',keys.every(k=>Math.abs(rect(k).left-rect(keys[0]).left)<1&&Math.abs(rect(k).right-right)<1));}
 }
 same(label+' settings navigation fixed',rect(f.querySelector('.pl-main-actions>button')).left,nav.left);
 f.querySelector('[data-loom-page=references]').click();await settle();const refs=[...doc.querySelectorAll('.cl-root')].find(el=>visible(el)&&!el.hidden&&!el.inert);
 for(const el of refs.querySelectorAll('.cl-header>.cl-tabs,.cl-search'))if(visible(el)){same(label+' references left '+el.className,rect(el).left,left);same(label+' references right '+el.className,rect(el).right,right);}
 for(const el of refs.querySelectorAll('.cl-list-row,.cl-listbar,.cl-panel-footer'))if(visible(el)){const b=rect(el),css=doc.defaultView.getComputedStyle(el);same(label+' references padded left',b.left+parseFloat(css.paddingLeft),left);same(label+' references padded right',b.right-parseFloat(css.paddingRight),right);}
 same(label+' references navigation fixed',rect(refs.querySelector('.pl-main-actions>button')).left,nav.left);
 }
}return {passed:checks.every(c=>c.ok),version:Zotero.version,checks};}finally{S.state.settings.interfaceLanguage=saved;H.refresh();V.setLanguage(saved||'en');}
