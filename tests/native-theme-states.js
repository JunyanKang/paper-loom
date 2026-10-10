const V=L.voice,U=L.referencesScope.CiteLensUI,H=L.referencesScope.CiteLensThemes,S=L.referencesScope.CiteLensServices;
const reader=Zotero.Reader._readers.find(r=>r._tabID||r.tabID);if(!reader)throw Error('Open a QA reader first');
Zotero.getMainWindow().Zotero_Tabs.select(reader._tabID||reader.tabID);
const doc=reader._iframeWindow.document,win=doc.defaultView,ui=V.ensurePanel(reader),previous=S.state.settings.theme,previousVoice=V.get('theme','tidal'),checks=[],check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
const base=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),out=PathUtils.join(base,PathUtils.filename(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path).replace('qa-profile','test-results'),'themes');await IOUtils.makeDirectory(out,{ignoreExisting:true});
const settle=async()=>{await U.pageScopes.get(doc)?.queue;await ui.waitMotion();for(let n=0;n<100&&doc.querySelector('[data-dock-motion]');n++)await Zotero.Promise.delay(40);await Zotero.Promise.delay(200);};
const luminance=rgb=>rgb.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
const rgb=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(Number);return s.startsWith('color(srgb')?c.map(x=>x*255):c;};
const contrast=(a,b)=>{const x=luminance(rgb(a)),y=luminance(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const capture=async(el,name)=>{const b=el.getBoundingClientRect(),c=doc.createElement('canvas');c.width=Math.ceil(b.width*2);c.height=Math.ceil(b.height*2);const ctx=c.getContext('2d');ctx.scale(2,2);ctx.drawWindow(win,b.x,b.y,b.width,b.height,'#fff');await IOUtils.write(PathUtils.join(out,name+'.png'),Uint8Array.from(win.atob(c.toDataURL().split(',')[1]),v=>v.charCodeAt(0)));};
try{
 for(const theme of H.themes){
  S.state.settings.theme=theme.id;H.refresh();V.set('theme',theme.id);V.syncSettings();L.showHome(reader,doc);await settle();
  const mode=ui.panel.querySelector('.pv-mode-options [aria-pressed=true]'),modeStyle=win.getComputedStyle(mode);check(theme.id+' listening active contrast',contrast(modeStyle.color,modeStyle.backgroundColor)>=4.5);check(theme.id+' mode labels stay inside their buttons',[...ui.panel.querySelectorAll('.pv-mode-options button')].every(b=>b.querySelector('span').getBoundingClientRect().bottom<=b.getBoundingClientRect().bottom));await capture(ui.panel,theme.id+'-listening');
  ui.panel.querySelector('[data-loom-page=references]').click();await settle();const panel=doc.querySelector('.cl-root'),tabs=[...panel.querySelectorAll('.cl-header>.cl-tabs button')];
  for(const tab of tabs){tab.click();await Zotero.Promise.delay(250);const active=win.getComputedStyle(tab),other=win.getComputedStyle(tabs.find(t=>t!==tab));check(theme.id+' '+tab.dataset.view+' selected background',tab.getAttribute('aria-selected')==='true'&&active.backgroundColor!=='rgba(0, 0, 0, 0)'&&active.backgroundColor!==other.backgroundColor);check(theme.id+' '+tab.dataset.view+' readable foreground',contrast(active.color,active.backgroundColor)>=4.5);}
  tabs[0].click();await Zotero.Promise.delay(200);await capture(panel,theme.id+'-references');
  const nav=panel.querySelector('.pl-main-actions [aria-current=page]'),style=win.getComputedStyle(nav);check(theme.id+' active header contrast',contrast(style.color,style.backgroundColor)>=4.5);
 }
 return {passed:true,version:Zotero.version,checks};
}catch(e){return {passed:false,checks,error:String(e),stack:e.stack};}
finally{S.state.settings.theme=previous;H.refresh();V.set('theme',previousVoice);V.syncSettings();}
