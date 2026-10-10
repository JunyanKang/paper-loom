PaperLoom.extendSettings=async function(ctx) {
  const {doc,reader,root,frame,tabs,panes,activate,cleanups,translation}=ctx;
  frame.classList.add('pl-settings');this.style(doc);
  const embedded=this.el(doc,'iframe');embedded.className='pl-settings-frame';embedded.setAttribute('title','听读设置');embedded.style.cssText='width:100%;border:0;display:block;height:320px;background:transparent';
  await new Promise((resolve,reject)=>{
    const win=doc.defaultView;let finished=false,timer;
    const finish=error=>{if(finished)return;finished=true;win.clearTimeout(timer);embedded.removeEventListener('load',loaded);error?reject(error):resolve();};
    const loaded=()=>{if(embedded.contentDocument?.body)finish();};
    cleanups.push(()=>finish());embedded.addEventListener('load',loaded);
    embedded.src='resource://'+this.resource+'/shared/settings-frame.html';root.append(embedded);
    timer=win.setTimeout(()=>finish(!root.isConnected||embedded.contentDocument?.body?null:Error('听读设置页面未能加载')),8000);
  });
  if(!root.isConnected)return;
  const inside=embedded.contentDocument;inside.body.style.cssText='margin:0;background:transparent;overflow:hidden';this.style(inside);this.referencesScope.CiteLensUI.appearance(inside);this.referencesScope.CiteLensI18n.install(inside);
  const fake={_iframeWindow:embedded.contentWindow,_window:embedded.contentWindow,itemID:reader?.itemID},V=this.voice;
  const ui=this.voiceScope.PaperVoiceUI.create(V,fake);ui.root.classList.add('pl-embedded');ui.root.dataset.loomSettings='true';ui.panel.hidden=false;ui.panel.dataset.pvVisible='true';
  V.panels.set(fake,ui);ui.settings(true);V.syncSettings();
  // The shared font and size controls apply to captions and citation abstracts.
  frame.querySelector('[data-translation-setting=translationSize]')?.closest('.cl-setting-row')?.remove();
  // Keep the complete original event wiring; display each control only once.
  for(const field of ['provider','target'])ui.find(field)?.closest('.pv-setting-row')?.setAttribute('hidden','');
  ui.action('sample').onclick=()=>this.listen(this.voiceScope.PaperVoiceCore.speechLanguages.find(l=>l.id===V.settingsVoiceLanguage()).sample,reader);
  ui.action('settings').onclick=()=>{};ui.action('voiceSettings').onclick=()=>select('voice');
  const engine=this.enginePanel(inside);ui.root.querySelector('[data-settings-pane=voice]').append(engine.node);cleanups.push(engine.dispose);
  const resize=()=>{if(embedded.isConnected&&!embedded.hidden)embedded.style.height=Math.ceil(ui.panel.getBoundingClientRect().height+12)+'px';};
  const observer=new embedded.contentWindow.ResizeObserver(resize);observer.observe(ui.panel);
  cleanups.push(()=>{observer.disconnect();this.referencesScope.CiteLensThemes.release(inside);V.panels.delete(fake);ui.dispose();embedded.remove();});
  const labels={general:'阅读与翻译',appearance:'外观',voice:'声音与引擎',shortcuts:'快捷键'};
  for(const key of ['voice','shortcuts']){const b=this.button(doc,labels[key],()=>select(key));b.dataset.pane=key;b.setAttribute('role','tab');b.setAttribute('aria-controls','pl-settings-'+key);tabs.append(b);}
  const select=key=>{
    if(!labels[key])key='general';activate(key);
    for(const b of tabs.children){const active=b.dataset.pane===key;b.textContent=labels[b.dataset.pane]||b.textContent;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
    ui.settings(true);ui.selectSettingsTab(key==='general'?'translation':key);
    embedded.id='pl-settings-'+key;embedded.hidden=false;ui.root.hidden=false;embedded.style.height=({general:290,appearance:90,voice:480,shortcuts:390})[key]+'px';V.syncSettings();
    for(const field of ['provider','target'])ui.find(field)?.closest('.pv-setting-row')?.setAttribute('hidden','');
    embedded.contentWindow.requestAnimationFrame(resize);root.scrollTop=0;
  };
  for(const b of tabs.children)b.onclick=()=>select(b.dataset.pane);
  frame._plSelect=select;
  // Hide the supplementary speech controls while the shared LLM editor is open.
  for(const page of Object.values(ctx.modelPages)){const open=page.open;page.open=()=>{embedded.hidden=true;return open();};}
  const migration=this.el(doc,'details',null,'pl-migration');migration.append(this.el(doc,'summary','导入旧翻译配置'));
  migration.append(this.el(doc,'p','可导入之前使用的翻译服务与模型配置。原有配置不会被删除。'));
  for(const [source,label] of [['voice','使用原 Paper Voice 配置'],['references','使用原 Paper Nexus 配置']])migration.append(this.button(doc,label,async()=>{await LoomSettings.restoreTranslation(source);ctx.close();this.showSettings(reader,doc);}));
  if(Object.keys(JSON.parse(this.referencesScope.CiteLensTranslation.get('previousTranslationProfiles','{}'))).length)translation.append(migration);
  const schedule=this.el(doc,'div',null,'pl-update-schedule'),automatic=this.el(doc,'input'),interval=this.el(doc,'select');
  automatic.type='checkbox';automatic.checked=V.updateAuto;automatic.setAttribute('aria-label','定期检查更新');
  for(const [value,label] of [[1,'每天'],[7,'每周'],[30,'每月']]){const option=this.el(doc,'option',label);option.value=value;interval.append(option);}interval.value=String(V.updateInterval());interval.disabled=!automatic.checked;interval.setAttribute('aria-label','检查周期');
  automatic.onchange=async()=>{await V.setAutoUpdate(automatic.checked);interval.disabled=!automatic.checked;};interval.onchange=()=>V.setUpdateInterval(interval.value);
  const label=this.el(doc,'label');label.append(automatic,this.el(doc,'span','定期检查更新'));schedule.append(label,interval);ctx.footer.prepend(schedule);
  const links=ctx.footer.querySelector('.cl-update-links');links.replaceChildren();
  for(const [key,label] of [['about','v'+this.version],['guide','指南'],['feedback','反馈'],['privacy','隐私']])links.append(this.button(doc,label,()=>this.showInfo(key,doc)));
  select('general');return ctx;
};
PaperLoom.enginePanel=function(doc) {
  const node=this.el(doc,'section',null,'pl-engine'),runtime=LoomRuntime;
  node.append(this.el(doc,'h3','离线声音'),this.el(doc,'p',runtime.platform.label+' · '+(runtime.catalog?Math.round(runtime.catalog.packages.reduce((n,p)=>n+p.bytes,0)/1024**2)+' MB':'暂无匹配下载')));
  const status=this.el(doc,'p'),progress=this.el(doc,'progress'),path=this.el(doc,'p'),actions=this.el(doc,'div',null,'pl-engine-actions');status.setAttribute('role','status');status.setAttribute('aria-live','polite');progress.max=1;progress.setAttribute('aria-label','声音安装进度');path.textContent='当前声音：'+this.voice.engineRoot();
  const download=this.button(doc,'下载引擎与声音',()=>runtime.install()),cancel=this.button(doc,'取消',()=>runtime.cancel()),check=this.button(doc,'检查当前声音',()=>runtime.diagnose());
  download.dataset.loomAction='install-runtime';cancel.dataset.loomAction='cancel-runtime';check.dataset.loomAction='test-runtime';actions.append(download,cancel,check);const location=this.el(doc,'details');location.append(this.el(doc,'summary','声音文件位置'),path);node.append(status,progress,actions,location,this.el(doc,'p','首次下载后可离线使用。下载中断可继续；所有语言和音色包含在同一声音包中。已有声音可用上方文件夹按钮导入。'));
  const dispose=runtime.subscribe(state=>{const busy=['downloading','verifying','extracting','testing','cancelling'].includes(state.phase);status.textContent=state.message;progress.value=state.progress;progress.hidden=!busy;download.disabled=busy||!runtime.catalog;cancel.hidden=!runtime.job;check.disabled=busy;download.textContent=['cancelled','error'].includes(state.phase)?'继续下载 / 重试':['ready','installed'].includes(state.phase)?'重新下载 / 修复':'下载引擎与声音';path.textContent='当前声音：'+this.voice.engineRoot();});
  return {node,dispose};
};
