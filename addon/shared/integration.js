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
      R.toolbar=(doc,reader)=>{
        const previous=R.toolbarNodes.get(doc);if(previous)return previous;
        this.style(doc);const b=this.button(doc,'',()=>this.showHome(reader,doc));b.dataset.citeLens='toolbar';b.setAttribute('aria-label',this.name);b.className='pl-library-entry';b.style.cssText='display:inline-flex;align-items:center;justify-content:center;width:34px;height:30px';b.append(this.logo(doc,26));R.toolbarNodes.set(doc,b);return b;
      };
      RS.CiteLensUI.logo=(doc,size)=>this.logo(doc,size);
      const create=VS.PaperVoiceUI.create.bind(VS.PaperVoiceUI);
      VS.PaperVoiceUI.create=(controller,reader)=>{
        const ui=create(controller,reader);
        ui.root.querySelector('.pv-brand-icon').src=this.assetURI+'loom.png';
        ui.root.querySelector('.pv-orb>.pv-mascot:not(.pv-mascot-reading)').src=this.assetURI+'loom.png';
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
