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
      RS.CiteLensUI.onPageActivate=doc=>{for(const [reader,ui] of V.panels)try{if(ui.root.ownerDocument===doc){V.dismissPanel(reader);ui.finishMotion();}}catch(_){V.panels.delete(reader);}};
      const showVoice=V.showPanel.bind(V);
      V.showPanel=(reader,toggle=false)=>{
        const ui=V.ensurePanel(reader),doc=ui.root.ownerDocument,expanded=ui.panel.dataset.pvVisible==='true'||(!ui.panel.hidden&&ui.panel.dataset.pvVisible!=='false');
        if(!toggle||!expanded){
          const scope=RS.CiteLensUI.pageScopes.get(doc);if(scope)scope.serial++;
          for(const view of RS.CiteLensUI.livePages(doc)){view.finish();view.snap(false);}
          doc._clAbstract?.close(true);
        }
        return showVoice(reader,toggle);
      };

      const page=RS.CiteLensUI.page.bind(RS.CiteLensUI);
      RS.CiteLensUI.page=(frame,options={})=>{
        const reader=options.reader,doc=frame.ownerDocument;
        if(reader&&!frame.classList.contains('pl-home')&&!frame.querySelector(':scope>.pl-navigation')){
          const active=frame.classList.contains('cl-settings')?'settings':frame.classList.contains('pn-network')?'network':'references';
          const nav=this.navigation(doc,reader,active),head=frame.querySelector(':scope>header');if(head)head.after(nav);else frame.prepend(nav);
        }
        return page(frame,options);
      };
      const create=VS.PaperVoiceUI.create.bind(VS.PaperVoiceUI);
      VS.PaperVoiceUI.create=(controller,reader)=>{
        const ui=create(controller,reader);
        this.style(ui.root.ownerDocument);if(!ui.root.ownerDocument.location.href.endsWith('shared/settings-frame.html'))ui.root.ownerDocument.documentElement.classList.add('pl-reader-workspace');
        ui.root.querySelector('.pv-brand-icon').src=this.assetURI+'loom.png';
        ui.root.querySelector('.pv-orb>.pv-mascot:not(.pv-mascot-reading)').src=this.assetURI+'loom.png';
        if(!ui.root.ownerDocument.location.href.endsWith('shared/settings-frame.html')){ui.panel.querySelector('.pv-header').after(this.navigation(ui.root.ownerDocument,reader,'listening'));RS.CiteLensI18n.install(ui.root.ownerDocument);}
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
