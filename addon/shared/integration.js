Object.assign(PaperLoom,{
  async start({rootURI,version}) {
    this.rootURI=rootURI;this.version=version;this.dead=false;Zotero.PaperLoom=this;
    this.resource='paper-loom-'+Services.uuid.generateUUID().toString().replace(/[{}]/g,'');
    const resources=Services.io.getProtocolHandler('resource').QueryInterface(Components.interfaces.nsIResProtocolHandler);
    resources.setSubstitutionWithFlags(this.resource,Services.io.newURI(rootURI),resources.ALLOW_CONTENT_ACCESS);
    this.assetURI='resource://'+this.resource+'/assets/';
    const {AddonManager}=ChromeUtils.importESModule('resource://gre/modules/AddonManager.sys.mjs');
    this.conflicts=(await Promise.all(['paper-voice@local.research','cite-lens@local.research'].map(id=>AddonManager.getAddonByID(id)))).filter(a=>a?.isActive);
    for(const win of Zotero.getMainWindows())this.addWindow(win);
    if(this.conflicts.length){this.showConflicts();return;}
    await this.startModules();
  },
  async startModules() {
    if(this.started)return;if(this.starting)return this.starting;
    return this.starting=(async()=>{
      await LoomSettings.migrate();
      const loaders=await (await Zotero.getMainWindow().fetch(this.rootURI+'module-loaders.json')).json();
      for(const name of ['voice','references']) {
        const scope={Zotero,ChromeUtils,Services,IOUtils,PathUtils,Components};
        for(const file of loaders[name])Services.scriptloader.loadSubScript(this.rootURI+name+'/'+file,scope);
        this[name+'Scope']=scope;
      }
      const VS=this.voiceScope,RS=this.referencesScope,V=this.voice=VS.PaperVoice,R=this.references=RS.CiteLens;
      V.version=R.version=this.version;R.rootURI=this.rootURI+'references/';V.assetURI='resource://'+this.resource+'/voice/assets/';V.cssText=VS.PaperVoiceStyle;
      // One main-window and Reader entry; the original companion stays available.
      V.addWindow=()=>{};V.removeWindow=()=>{};V.onToolbar=({reader})=>{if(reader)V.attachReader(reader);};V.watchToolbar=()=>{};
      R.libraryToolbar=()=>{};
      R.addWindow=win=>{const nodes=this.windows.get(win);if(nodes)R.windows.set(win,nodes.item);};R.removeWindow=win=>{R.windows.delete(win);RS.CiteLensThemes.release(win.document);};
      R.readerToolbarEnabled=false;R.normalizeToolbar=doc=>{for(const node of doc.querySelectorAll('[data-cite-lens=toolbar],[data-paper-voice=toolbar]'))node.remove();};
      RS.CiteLensUI.logo=(doc,size)=>this.logo(doc,size);
      // One expanded workspace per document; each Reader keeps its own state.
      const U=RS.CiteLensUI;
      const readerUI=doc=>[...V.livePanels()].find(ui=>ui.root.ownerDocument===doc);
      const fitWorkspace=doc=>{
        if(!doc.documentElement.classList.contains('pl-reader-workspace'))return;
        const ui=readerUI(doc);if(!ui)return;const win=doc.defaultView,o=ui.action('orb').getBoundingClientRect();
        // Keep a useful reading surface even when the mascot has been dragged high.
        const bottom=Math.max(8,Math.min(win.innerHeight-220,win.innerHeight-o.top+12));
        doc.documentElement.style.setProperty('--pl-dock-right',Math.max(16,win.innerWidth-o.right)+'px');
        doc.documentElement.style.setProperty('--pl-dock-bottom',bottom+'px');
      };
      U.fitPage=fitWorkspace;U.onDockProgress=(doc,p,m)=>readerUI(doc)?.dockCompanion(p,m);
      U.onPageActivate=doc=>{const ui=readerUI(doc);if(!ui)return;for(const [reader,current] of V.panels)if(current===ui)V.dismissPanel(reader);return ui.waitMotion();};
      const showVoice=V.showPanel.bind(V);
      V.showPanel=(reader,toggle=false)=>{
        const ui=V.ensurePanel(reader),doc=ui.root.ownerDocument,expanded=ui.panel.dataset.pvVisible==='true'||(!ui.panel.hidden&&ui.panel.dataset.pvVisible!=='false');
        if(toggle&&expanded)return showVoice(reader,true);
        let scope=U.pageScopes.get(doc);if(!scope){scope={serial:0,queue:Promise.resolve()};U.pageScopes.set(doc,scope);}const ticket=++scope.serial;
        const other=[...U.livePages(doc)].filter(view=>!view.container.hidden);
        const open=()=>{if(ticket!==scope.serial||!ui.root.isConnected)return;fitWorkspace(doc);ui.setContext('listening');showVoice(reader,false);};
        doc._clAbstract?.close(true);
        if(!other.length){open();return;}
        scope.queue=scope.queue.catch(e=>Zotero.logError(e)).then(async()=>{if(ticket!==scope.serial)return;await Promise.all(other.map(view=>view.hide(true)));open();});U.pageQueue=scope.queue;return scope.queue;
      };

      const page=RS.CiteLensUI.page.bind(RS.CiteLensUI);
      RS.CiteLensUI.page=(frame,options={})=>{
        const reader=options.reader,doc=frame.ownerDocument;
        if(reader&&!frame.classList.contains('pl-home')){
          const head=frame.querySelector(':scope>header');
          if(head&&!head.querySelector('.pl-home-back')){const back=U.iconButton(doc,'返回听读','back',()=>this.showHome(reader,doc));back.classList.add('pl-home-back');(head.querySelector('.cl-row')||head).prepend(back);}
        }
        if(reader){
          const context=frame.classList.contains('cl-settings')?'settings':frame.classList.contains('pn-network')?'network':frame.classList.contains('pl-home')?'ready':'references';
          frame.addEventListener('cl-page-visible',()=>{const ui=readerUI(doc);ui?.setContext(context);ui?.performContext();});
          fitWorkspace(doc);
        }
        return page(frame,options);
      };
      const create=VS.PaperVoiceUI.create.bind(VS.PaperVoiceUI);
      VS.PaperVoiceUI.create=(controller,reader)=>{
        const ui=create(controller,reader);
        this.style(ui.root.ownerDocument);if(!ui.root.ownerDocument.location.href.endsWith('shared/settings-frame.html'))ui.root.ownerDocument.documentElement.classList.add('pl-reader-workspace');
        ui.root.querySelector('.pv-brand-icon').src=this.assetURI+'loom.png';
        ui.root.querySelector('.pv-orb>.pv-mascot:not(.pv-mascot-reading)').src=this.assetURI+'loom.png';
        if(!ui.root.ownerDocument.location.href.endsWith('shared/settings-frame.html')){
          const doc=ui.root.ownerDocument;ui.panel.querySelector('.pv-header').append(this.mainNavigation(doc,reader));ui.action('settings').hidden=true;ui.action('close').hidden=true;ui.panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented){e.preventDefault();e.stopPropagation();V.dismissPanel(reader);}});
          ui.action('orb').setAttribute('aria-label','打开或收起 Paper Loom');ui.action('orb').title='Paper Loom';
          ui.action('orb').onclick=()=>{const active=[...U.livePages(doc)].find(v=>!v.container.hidden);if(active){if(active.frame.dataset.dockMotion==='closing')active.activate();else active.dismiss();return;}if(!ui.panel.hidden&&ui.panel.dataset.pvVisible!=='false'){V.dismissPanel(reader);return;}this.showHome(reader,doc);};
          RS.CiteLensI18n.install(doc);
        }
        const uiDoc=ui.root.ownerDocument,uiWin=uiDoc.defaultView,refit=()=>{try{if(ui.root.isConnected)fitWorkspace(uiDoc);}catch(_){}};if(!uiDoc.location.href.endsWith('shared/settings-frame.html')){uiWin.addEventListener('resize',refit);ui.action('orb').addEventListener('pointermove',refit);const dispose=ui.dispose;ui.dispose=()=>{try{uiWin.removeEventListener('resize',refit);}catch(_){}dispose();};refit();}
        ui.action('settings').onclick=()=>this.showSettings(reader,ui.root.ownerDocument);
        ui.action('voiceSettings').onclick=()=>this.showSettings(reader,ui.root.ownerDocument,'voice');
        for(const [action,key] of [['help','guide'],['feedback','feedback'],['privacy','privacy']])ui.action(action).onclick=()=>this.showInfo(key,ui.root.ownerDocument);
        return ui;
      };
      const oldEngineRoot=V.engineRoot.bind(V);
      V.engineRoot=()=>V.get('enginePath','')||V.get('engineAutoPath','')||oldEngineRoot();
      const ensureWorker=V.ensureWorker.bind(V);
      V.ensureWorker=async()=>{
        const command=PathUtils.join(V.engineRoot(),'python',...(Zotero.isWin?['python.exe']:['bin','python3']));
        if(!await IOUtils.exists(command)){this.showSettings(this.currentReader(),this.currentReader()?._iframeWindow?.document||Zotero.getMainWindow().document,'voice');throw Error('请在「声音与引擎」中下载离线声音，或导入已有声音文件夹。');}
        return ensureWorker();
      };
      LoomSettings.connect(this);
      V.initTranslation();
      try{
        await R.start();await V.start();await LoomRuntime.init(this);this.started=true;
        for(const win of Zotero.getMainWindows())R.addWindow(win);
        // One discovery schedule; Zotero manages update installation.
        V.stopUpdateSchedule();this.connectUpdates();V.startUpdateSchedule();
      }catch(e){await this.stopModules();throw e;}
    })().finally(()=>{this.starting=null;});
  },
  connectUpdates() {
    const V=this.voice,U=this.referencesScope.CiteLensUpdater,nativeCheck=U.check.bind(U);
    U.check=async()=>{
      V.set('lastUpdateAttempt',String(Date.now()));
      await nativeCheck();if(U.phase!=='error')V.set('lastUpdateCheck',String(Date.now()));
    };
    V.checkForUpdates=()=>U.check();V.installUpdate=()=>U.apply();
    this.updateUnsubscribe=U.subscribe(state=>{V.updateInstall=U.install;V.setUpdateState(state.phase,state.message);if(state.availableVersion)V.set('availableUpdateVersion',state.availableVersion);});
    U.set('idle','');
  },
  async stopModules() {
    this.updateUnsubscribe?.();this.updateUnsubscribe=null;
    await LoomRuntime.stop();
    if(this.voice)await this.voice.shutdown();
    if(this.references)await this.references.stop();
    this.started=false;
  },
  async stop() {
    this.dead=true;await this.stopModules();
    for(const win of [...this.windows.keys()])this.removeWindow(win);
    if(this.resource)Services.io.getProtocolHandler('resource').QueryInterface(Components.interfaces.nsIResProtocolHandler).setSubstitution(this.resource,null);
    if(Zotero.PaperLoom===this)delete Zotero.PaperLoom;
  }
});
