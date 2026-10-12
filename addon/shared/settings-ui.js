PaperLoom.extendSettings=async function(ctx) {
  const {doc,reader,root,frame,tabs,panes,activate,cleanups,translation,data}=ctx;
  frame.classList.add('pl-settings');this.style(doc);
  const embedded=this.el(doc,'iframe');embedded.className='pl-settings-frame';embedded.setAttribute('title','听读设置');embedded.style.cssText='width:calc(100% + 12px);border:0;display:block;height:320px;background:transparent';
  await new Promise((resolve,reject)=>{
    const win=doc.defaultView;let finished=false,timer;
    const finish=error=>{if(finished)return;finished=true;win.clearTimeout(timer);embedded.removeEventListener('load',loaded);error?reject(error):resolve();};
    const loaded=()=>{if(embedded.contentDocument?.body)finish();};
    cleanups.push(()=>finish());embedded.addEventListener('load',loaded);
    embedded.src='resource://'+this.resource+'/shared/settings-frame.html';root.append(embedded);
    timer=win.setTimeout(()=>finish(!root.isConnected||embedded.contentDocument?.body?null:Error('听读设置页面未能加载')),8000);
  });
  if(!root.isConnected)return;
  const inside=embedded.contentDocument;inside._pvSelectHost=frame;inside.documentElement.classList.add('pl-settings-document');inside.body.style.cssText='margin:0;padding-right:12px;box-sizing:border-box;background:transparent;overflow:hidden';this.style(inside);this.referencesScope.CiteLensUI.appearance(inside);this.referencesScope.CiteLensI18n.install(inside);
  const fake={_iframeWindow:embedded.contentWindow,_window:embedded.contentWindow,itemID:reader?.itemID},V=this.voice;
  const ui=this.voiceScope.PaperVoiceUI.create(V,fake);ui.root.classList.add('pl-embedded');ui.root.dataset.loomSettings='true';ui.panel.hidden=false;ui.panel.dataset.pvVisible='true';
  V.panels.set(fake,ui);ui.settings(true);V.syncSettings();
  ui.root.querySelector('[data-settings-pane=voice]').hidden=true;
  ui.find('speechLanguage').closest('.pv-setting-row').hidden=true;
  ui.find('voice').closest('.pv-setting-row').querySelector('label').textContent='朗读声音';
  const shortcut=e=>V.handlePlaybackShortcut(e,reader||V.currentReader);
  embedded.contentWindow.addEventListener('keydown',shortcut,true);
  cleanups.push(()=>{try{embedded.contentWindow.removeEventListener('keydown',shortcut,true);}catch(_){}});
  // Playback controls own these switches; settings only presents typography.
  for(const key of ['selectionTranslation','translation','readTranslation','provider','target'])ui.find(key)?.closest('.pv-setting-row')?.setAttribute('hidden','');
  translation.querySelector('[data-translation-setting=translationTarget]').closest('.cl-setting-row').hidden=true;
  ui.find('companion').closest('.pv-setting-row').hidden=true;
  embedded.after(data);
  // The shared font and size controls apply to captions and citation abstracts.
  frame.querySelector('[data-translation-setting=translationSize]')?.closest('.cl-setting-row')?.remove();
  // Keep the complete original event wiring; display each control only once.
  for(const field of ['provider','target'])ui.find(field)?.closest('.pv-setting-row')?.setAttribute('hidden','');
  ui.action('primary').onclick=()=>{const active=reader?.itemID?reader:this.currentReader();if(active?.itemID)V.primary(active);};ui.action('primary').disabled=!reader?.itemID;
  ui.action('sample').onclick=()=>{const language=this.voiceScope.PaperVoiceCore.speechLanguages.find(l=>l.id===V.settingsVoiceLanguage());if(language)this.listen(language.sample,reader);};
  ui.action('previewCompanion').onclick=()=>{const live=[...V.livePanels()].find(p=>p.root.ownerDocument===doc&&!p.root.classList.contains('pl-embedded'));live?.previewCompanion();};
  ui.action('settings').onclick=()=>{};
  // Typography shares the host group with the provider and citation format.
  // Recreate controls in this docgroup; retain one shared controller for values.
  const typography={},originalFind=ui.find;
  const fontRow=this.el(doc,'div',null,'cl-setting-row pl-caption-style-row');fontRow.append(this.el(doc,'label','译文字体'));
  const placementRow=this.el(doc,'div',null,'cl-setting-row');placementRow.append(this.el(doc,'label','译文位置'));
  for(const key of ['captionFont','captionSize','captionPlacement']){
    const source=originalFind(key),select=this.el(doc,'select');select.dataset.field=key;select.id='pl-setting-'+key;select.setAttribute('aria-label',source.getAttribute('aria-label'));
    for(const item of source.options){const option=this.el(doc,'option',item.textContent);option.value=item.value;select.append(option);}select.value=source.value;
    select.onchange=()=>key==='captionPlacement'?V.setCaptionPlacement(select.value):V.setCaptionStyle(key,select.value);
    typography[key]=select;(key==='captionPlacement'?placementRow:fontRow).append(select);
  }
  fontRow.querySelector('label').htmlFor=typography.captionFont.id;placementRow.querySelector('label').htmlFor=typography.captionPlacement.id;
  ui.find=key=>typography[key]||originalFind(key);
  translation.append(fontRow,placementRow);data.prepend(translation);
  ui.root.querySelector('[data-settings-pane=translation]').hidden=true;
  const engine=this.enginePanel(doc);data.after(engine.node);cleanups.push(engine.dispose);
  const resize=()=>{if(embedded.isConnected&&!embedded.hidden){const h=ui.panel.getBoundingClientRect().height;if(h>0&&embedded.style.height!==Math.ceil(h)+'px')embedded.style.height=Math.ceil(h)+'px';}};
  const observer=new embedded.contentWindow.ResizeObserver(resize);observer.observe(ui.panel);
  cleanups.push(()=>{observer.disconnect();this.referencesScope.CiteLensThemes.release(inside);V.panels.delete(fake);ui.dispose();embedded.remove();});
  // Keep original shortcut buttons and listeners inside a semantic, bordered table.
  const shortcutPane=ui.root.querySelector('[data-settings-pane=shortcuts]');
  shortcutPane.classList.add('pl-shortcuts-inline');
  const shortcutList=shortcutPane.querySelector('.pv-shortcut-list'),table=inside.createElement('table'),tbody=inside.createElement('tbody');
  table.className='pl-shortcut-table';table.setAttribute('aria-label',V.t('快捷键'));table.append(tbody);
  const order=['pause','stop','translation','readTranslation','previousSentence','previousParagraph','replaySentence','replayParagraph','nextSentence','nextParagraph'];
  for(let i=0;i<order.length;i+=2){const row=inside.createElement('tr');for(const id of order.slice(i,i+2)){const cell=inside.createElement('td');cell.append(shortcutList.querySelector('[data-shortcut-row='+id+']'));row.append(cell);}tbody.append(row);}
  shortcutList.replaceWith(table);
  for(const key of ['appearance','shortcuts']){
    const pane=ui.root.querySelector('[data-settings-pane='+key+']');pane.hidden=false;pane.removeAttribute('data-settings-pane');pane.removeAttribute('role');pane.removeAttribute('aria-labelledby');pane.classList.add('pl-settings-group');
  }
  tabs.remove();for(const pane of Object.values(panes)){pane.removeAttribute('role');pane.removeAttribute('aria-labelledby');}
  panes.appearance.remove();panes.general.hidden=false;
  const select=()=>{
    for(const page of Object.values(ctx.modelPages))page.hide();
    panes.general.hidden=false;data.hidden=false;engine.node.hidden=false;ctx.footer.hidden=false;
    frame.dataset.settingsPage='all';ui.root._pvSelects?.close();embedded.hidden=false;ui.root.hidden=false;
    resize();
  };
  frame._plSelect=select;
  for(const page of Object.values(ctx.modelPages))page.bindDocument?.(inside);
  const links=ctx.footer.querySelector('.cl-update-links');links.replaceChildren();
  const updater=this.referencesScope.CiteLensUpdater,update=this.button(doc,'',()=>updater.phase==='available'?updater.apply():updater.check()),updateIcon=this.el(doc,'span',null,'pl-about-tab-icon');
  updateIcon.style.setProperty('--pl-info-icon','url("'+this.voice.assetURI+'icons/download.svg")');updateIcon.setAttribute('aria-hidden','true');update.dataset.section='update';update.append(updateIcon,this.el(doc,'span','更新'));
  cleanups.push(updater.subscribe(state=>{update.disabled=['checking','installing'].includes(state.phase);update.setAttribute('aria-busy',String(update.disabled));}));
  links.classList.add('pl-resource-links');links.append(update,...this.infoActions(doc));
  const updateStatus=ctx.footer.querySelector('[data-update-status]');ctx.footer.querySelector('.cl-update-row').remove();ctx.footer.prepend(updateStatus);
  data.classList.add('pl-settings-group');root.after(ctx.footer);select();
  const container=frame._clPage?.container||frame,hidden=container.hidden,frameHidden=frame.hidden;
  frame.style.visibility='hidden';container.hidden=false;frame.hidden=false;resize();
  await this.referencesScope.CiteLensUI.afterPaint(doc);resize();
  container.hidden=hidden;frame.hidden=frameHidden;frame.style.removeProperty('visibility');return ctx;
};
PaperLoom.enginePanel=function(doc) {
  const node=this.el(doc,'section',null,'pl-engine'),runtime=LoomRuntime;
  const heading=this.el(doc,'h3','发音环境','pl-engine-heading');
  const status=this.el(doc,'p',null,'pl-engine-status'),progress=this.el(doc,'progress'),progressRow=this.el(doc,'div',null,'pl-engine-progress'),actions=this.el(doc,'div',null,'pl-engine-actions');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');progress.max=1;progress.setAttribute('aria-label','声音安装进度');
  const download=this.button(doc,'',()=>runtime.install().catch(()=>{})),cancel=this.button(doc,'',()=>runtime.cancel()),check=this.button(doc,'',()=>runtime.diagnose().catch(()=>{}));
  const actionIcon=(button,name,label)=>{let image=button.querySelector('.pl-engine-icon');if(!image){image=this.el(doc,'span',null,'pv-icon pl-engine-icon');image.setAttribute('aria-hidden','true');button.replaceChildren(image);}const src='url("'+this.voice.assetURI+'icons/'+name+'.svg")';if(image.style.getPropertyValue('--pl-engine-icon')!==src)image.style.setProperty('--pl-engine-icon',src);if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);if(button.title!==label)button.title=label;};
  actionIcon(check,'shield-check','检查声音');
  cancel.setAttribute('aria-label','取消');cancel.title='取消';const cancelIcon=this.el(doc,'img',null,'pv-icon');cancelIcon.src=this.voice.assetURI+'icons/x.svg';cancelIcon.alt='';cancel.append(cancelIcon);
  download.dataset.loomAction='install-runtime';cancel.dataset.loomAction='cancel-runtime';check.dataset.loomAction='test-runtime';actions.append(download,check);progressRow.append(progress,cancel);const top=this.el(doc,'div',null,'pl-engine-top'),details=this.el(doc,'div',null,'pl-engine-feedback');top.append(heading,actions);details.append(progressRow,status);node.append(top,details);
  let timer=null;const win=doc.defaultView;
  const unsubscribe=runtime.subscribe(state=>{
    win.clearTimeout(timer);timer=null;
    const busy=['downloading','verifying','extracting','testing','cancelling'].includes(state.phase),installed=!!runtime.installed;
    const healthy=installed&&!runtime.needsRepair;download.dataset.health=healthy?'ready':'error';check.dataset.health=healthy?'ready':'unknown';status.textContent=['installed','idle'].includes(state.phase)?(state.phase==='idle'&&!runtime.platform.supported?state.message:''):state.message;status.hidden=!status.textContent;
    if(state.phase==='ready'){const remaining=5000-(Date.now()-(state.updatedAt||Date.now()));if(remaining>0)timer=win.setTimeout(()=>{status.hidden=true;status.textContent='';},remaining);else{status.hidden=true;status.textContent='';}}
    if(state.phase==='testing')progress.removeAttribute('value');else progress.value=state.progress;progressRow.hidden=!busy;download.disabled=busy||!runtime.catalog;cancel.hidden=!runtime.job;cancel.disabled=state.phase==='cancelling';check.disabled=busy;
    actionIcon(download,'wrench',installed?'修复声音':['cancelled','error'].includes(state.phase)?'继续下载 / 重试':'下载声音');
  });
  return {node,dispose(){win.clearTimeout(timer);unsubscribe();}};
};
