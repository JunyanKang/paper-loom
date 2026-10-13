/* One quiet, opt-in invitation for a new installation; no synthesis or downloads on startup. */
var LoomVoiceWelcome = {
  key:'extensions.paperLoom.voiceWelcome',timer:null,notice:null,owner:null,
  prepare(owner){
    this.owner=owner;owner.voiceWelcome=this;
    if(Services.prefs.prefHasUserValue(this.key))return;
    const existing=Services.prefs.getIntPref('extensions.paperLoom.migrationVersion',0)>0||Services.prefs.getChildList('extensions.paperVoice.').length>0;
    this.save(existing?'existing':'pending');
  },
  save(value){Services.prefs.setStringPref(this.key,value);Services.prefs.savePrefFile(null);},
  async start(){
    if(Services.prefs.getStringPref(this.key,'')!=='pending')return;
    if(LoomRuntime.installed){this.save('installed');return;}
    if(!LoomRuntime.catalog)return;
    const win=Zotero.getMainWindow();this.host=win;
    this.timer=win.setTimeout(()=>{this.timer=null;if(!this.owner?.dead&&!LoomRuntime.installed&&!LoomRuntime.job)this.show(win.document);},1600);
  },
  words(){
    const language=this.owner.voice.language(),index=Math.max(0,['en','zh','ja','fr','de'].indexOf(language));
    const select=values=>values[index];
    return {
      title:select(['Give your papers a voice','让论文读给你听','論文を音声で読む','Écoutez vos articles','Artikel vorlesen lassen']),
      body:select(['Add the voice pack to listen offline. Reading and translation already work without it.','安装声音包后即可离线听读。不安装也能正常阅读和翻译。','音声パックを追加するとオフラインで読み上げられます。閲覧と翻訳はそのまま使えます。','Ajoutez les voix pour écouter hors ligne. La lecture et la traduction restent disponibles sans elles.','Mit dem Sprachpaket können Sie offline zuhören. Lesen und Übersetzen funktionieren auch ohne.']),
      install:select(['Install voices','安装声音包','音声をインストール','Installer les voix','Stimmen installieren']),
      ignore:select(['Not now','忽略','あとで','Plus tard','Später']),
      later:select(['Whenever you are ready','想听的时候，再来安装','いつでも追加できます','Quand vous le souhaitez','Jederzeit nachholen']),
      guide:select(['Open Settings → Speech environment, then select the wrench.','打开「设置」→「发音环境」，点击扳手按钮即可安装。','「設定」→「音声環境」のレンチからインストールできます。','Ouvrez Réglages → Environnement vocal, puis cliquez sur la clé.','Öffnen Sie Einstellungen → Sprachumgebung und wählen Sie den Schraubenschlüssel.']),
      settings:select(['Settings','设置','設定','Réglages','Einstellungen']),
      environment:select(['Speech environment','发音环境','音声環境','Environnement vocal','Sprachumgebung']),
      show:select(['Show me where','查看入口','場所を見る','Voir où','Installation finden']),
      done:select(['Got it','知道了','わかりました','Compris','Verstanden']),
      close:select(['Close','关闭','閉じる','Fermer','Schließen']),
      size:select(['Download once · {size} MB','一次下载 · {size} MB','一度だけダウンロード · {size} MB','Téléchargement unique · {size} Mo','Einmaliger Download · {size} MB'])
    };
  },
  show(doc){
    if(this.notice||this.owner.dead||LoomRuntime.installed||!LoomRuntime.catalog)return;
    const O=this.owner,W=this.words();O.style(doc);O.referencesScope.CiteLensUI.appearance(doc);
    const card=O.el(doc,'section',null,'pl-voice-welcome');card.setAttribute('role','dialog');card.setAttribute('aria-modal','false');card.setAttribute('aria-labelledby','pl-voice-welcome-title');
    const icon=name=>{const n=O.el(doc,'span',null,'pl-welcome-icon');n.setAttribute('aria-hidden','true');n.style.setProperty('--welcome-icon','url("'+O.voice.assetURI+'icons/'+name+'.svg")');return n;};
    const dismiss=O.button(doc,'',()=>ignore());dismiss.className='pl-welcome-dismiss';dismiss.setAttribute('aria-label',W.close);dismiss.append(icon('x'));
    const heading=O.el(doc,'h2',W.title);heading.id='pl-voice-welcome-title';const badge=O.el(doc,'div',null,'pl-welcome-badge');badge.append(icon('headphones'));
    const body=O.el(doc,'p',W.body),meta=O.el(doc,'small',W.size.replace('{size}',Math.round(LoomRuntime.catalog.packages.reduce((n,p)=>n+p.bytes,0)/1024**2))),actions=O.el(doc,'div',null,'pl-welcome-actions');
    const leave=e=>{if(e.target===doc||e.target===doc.defaultView)close();},key=e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();guide?close():ignore();}};
    let guide=false,busy=false;
    const close=()=>{if(this.notice?.card!==card)return;doc.defaultView.removeEventListener('pagehide',leave);card.removeEventListener('keydown',key);card.remove();this.notice=null;};
    const enter=async install=>{if(busy)return;busy=true;for(const b of card.querySelectorAll('button'))b.disabled=true;
      try{await this.openSettings(doc);if(O.dead||!card.isConnected)return;if(install){this.save('accepted');close();LoomRuntime.install().catch(()=>{});}else close();}
      catch(error){body.textContent=String(error.message||error);busy=false;for(const b of card.querySelectorAll('button'))b.disabled=false;}
    };
    const ignore=()=>{if(busy)return;if(guide){close();return;}guide=true;this.save('ignored');heading.textContent=W.later;body.textContent=W.guide;meta.remove();badge.remove();dismiss.onclick=close;
      // This miniature uses the same icons as the live settings. The entry is also
      // highlighted in the actual panel, avoiding stale screenshots after UI changes.
      const preview=O.el(doc,'div',null,'pl-welcome-guide');preview.setAttribute('aria-hidden','true');const path=O.el(doc,'span',W.settings+'  ›  '+W.environment),target=O.el(doc,'span',null,'pl-welcome-target');target.append(icon('wrench'));preview.append(path,target);body.after(preview);
      const show=O.button(doc,W.show,()=>enter(false)),done=O.button(doc,W.done,close);show.dataset.welcomeAction='show';done.dataset.welcomeAction='done';actions.replaceChildren(show,done);done.focus();
    };
    const skip=O.button(doc,W.ignore,ignore),install=O.button(doc,W.install,()=>enter(true));skip.dataset.welcomeAction='ignore';install.dataset.welcomeAction='install';actions.append(skip,install);card.append(dismiss,badge,heading,body,meta,actions);card.addEventListener('keydown',key);doc.defaultView.addEventListener('pagehide',leave);(doc.body||doc.documentElement).append(card);this.notice={card,close};
  },
  async openSettings(doc){
    const O=this.owner;await O.showSettings(O.currentReader(doc),doc);
    if(O.dead)throw Error('Paper Loom is closed');
    const frame=doc.querySelector('.cl-settings'),page=frame?._clPage;await page?.whenSettled?.();
    const target=frame?.querySelector('[data-loom-action=install-runtime]');if(!target)throw Error('Speech environment is not available');
    target.scrollIntoView({block:'nearest'});target.focus({preventScroll:true});this.clearHighlight?.();target.classList.add('pl-welcome-highlight');
    const win=doc.defaultView,clear=()=>{win.clearTimeout(timer);target.classList.remove('pl-welcome-highlight');target.removeEventListener('click',clear);win.removeEventListener('pagehide',leave);this.clearHighlight=null;},timer=win.setTimeout(clear,6000);
    target.addEventListener('click',clear,{once:true});const leave=e=>{if(e.target===doc||e.target===win)clear();};win.addEventListener('pagehide',leave);this.clearHighlight=clear;
  },
  stop(){this.host?.clearTimeout(this.timer);this.timer=null;this.notice?.close();this.clearHighlight?.();this.host=null;this.owner=null;}
};
