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
      V.providerMeta=(code,options)=>this.providerMeta(code,options);RS.CiteLensControls.providerMeta=(code,options)=>this.providerMeta(code,options);V.flagURI=code=>this.flagURI(code);RS.CiteLensControls.flagURI=code=>this.flagURI(code);RS.CiteLensControls.connectedSurfacePath=(rects,radius)=>VS.PaperVoiceUI.connectedSurfacePath(rects,radius);
      // Ship the worker with the plugin so existing voice assets gain new capabilities
      // without rewriting the installed engine or downloading models again.
      V.workerArguments=async root=>{
        if(!this.workerScriptPromise)this.workerScriptPromise=(async()=>{
          const directory=PathUtils.join(Services.dirsvc.get('UAppData',Components.interfaces.nsIFile).path,'paper-loom','workers');
          await IOUtils.makeDirectory(directory,{ignoreExisting:true});
          const path=PathUtils.join(directory,'worker-'+this.version+'.py'),source=await (await Zotero.getMainWindow().fetch(this.rootURI+'shared/worker.py')).text();
          await IOUtils.writeUTF8(path,source,{tmpPath:path+'.'+Date.now()+'.tmp'});return path;
        })().catch(error=>{this.workerScriptPromise=null;throw error;});
        return [await this.workerScriptPromise,root];
      };
      V.version=R.version=this.version;R.rootURI=this.rootURI+'references/';V.assetURI='resource://'+this.resource+'/voice/assets/';V.cssText=VS.PaperVoiceStyle;
      // One main-window and Reader entry; the original companion stays available.
      V.addWindow=()=>{};V.removeWindow=()=>{};V.onToolbar=({reader})=>{if(reader)V.attachReader(reader);};V.watchToolbar=()=>{};
      R.libraryToolbar=()=>{};
      R.addWindow=win=>{const nodes=this.windows.get(win);if(nodes)R.windows.set(win,nodes.item);};R.removeWindow=win=>{R.windows.delete(win);RS.CiteLensThemes.release(win.document);};
      R.readerToolbarEnabled=false;R.normalizeToolbar=doc=>{for(const node of doc.querySelectorAll('[data-cite-lens=toolbar],[data-paper-voice=toolbar]'))node.remove();};
      RS.CiteLensUI.logo=(doc,size)=>this.logo(doc,size);
      // One expanded workspace per document; each Reader keeps its own state.
      const U=RS.CiteLensUI;
      const readerUIs=new WeakMap(),readerUI=doc=>readerUIs.get(doc);
      const fitWorkspace=doc=>{
        if(!doc.documentElement.classList.contains('pl-reader-workspace'))return;
        const ui=readerUI(doc);if(!ui)return;const win=doc.defaultView,o=ui.action('orb').getBoundingClientRect();
        // Keep a useful reading surface even when the mascot has been dragged high.
        const bottom=Math.max(8,Math.min(win.innerHeight-220,win.innerHeight-o.top+12));
        const style=doc.documentElement.style,right=Math.max(16,win.innerWidth-o.right)+'px',base=bottom+'px';
        if(style.getPropertyValue('--pl-dock-right')!==right)style.setProperty('--pl-dock-right',right);
        if(style.getPropertyValue('--pl-dock-bottom')!==base)style.setProperty('--pl-dock-bottom',base);
      };
      this.managedWorkspaces=true;
      U.fitPage=fitWorkspace;U.onDockProgress=(doc,p,m)=>readerUI(doc)?.dockCompanion(p,m,false);
      U.onPageActivate=doc=>doc._clAbstract?.close(true);
      // Workspace hover uses the live compositor surface, not a PDF screenshot mesh.
      V.showPanel=(reader,toggle=false)=>{
        V.ensurePanel(reader);const doc=reader._iframeWindow.document;
        const active=[...U.livePages(doc)].find(v=>!v.container.hidden);
        if(toggle&&active)return active.dismiss();
        return this.showSettings(reader,doc);
      };
      V.onOutsideInteraction=(reader,event)=>V.panels.get(reader)?._outside?.(event);

      const page=RS.CiteLensUI.page.bind(RS.CiteLensUI);
      RS.CiteLensUI.page=(frame,options={})=>{
        const reader=options.reader,doc=frame.ownerDocument;
        if(frame.matches('.cl-root,.cl-settings,.pn-map-window')){
          const active=frame.classList.contains('cl-settings')?'settings':frame.classList.contains('pn-map-window')?'network':'references';
          const workspaceReader=reader||this.workspaceReaders?.get(doc)||{_iframeWindow:doc.defaultView,_window:doc.defaultView,itemID:null};
          this.mountWorkspace(frame,workspaceReader,active);
        }
        if(reader){
          const context=frame.classList.contains('pv-panel')?'listening':frame.classList.contains('cl-settings')?'settings':frame.classList.contains('pn-network')?'network':frame.classList.contains('pl-home')?'ready':'references';
          frame.addEventListener('cl-page-visible',()=>readerUI(doc)?.setContext(context));frame.addEventListener('cl-page-switched',()=>readerUI(doc)?.performContext());
          fitWorkspace(doc);
        }
        return page(frame,options);
      };
      const create=VS.PaperVoiceUI.create.bind(VS.PaperVoiceUI);
      VS.PaperVoiceUI.create=(controller,reader)=>{
        const ui=create(controller,reader);readerUIs.set(ui.root.ownerDocument,ui);const releaseUI=ui.dispose;ui.dispose=()=>{if(readerUIs.get(ui.root.ownerDocument)===ui)readerUIs.delete(ui.root.ownerDocument);releaseUI();};
        this.style(ui.root.ownerDocument);if(!ui.root.ownerDocument.location.href.endsWith('shared/settings-frame.html'))ui.root.ownerDocument.documentElement.classList.add('pl-reader-workspace');
        ui.root.querySelector('.pv-brand-icon').src=this.assetURI+'loom.png';
        ui.root.querySelector('.pv-orb>.pv-mascot:not(.pv-mascot-reading)').src=this.assetURI+'loom.png';
        if(!ui.root.ownerDocument.location.href.endsWith('shared/settings-frame.html')){
          const doc=ui.root.ownerDocument;
          // The companion owns no listening page. Settings owns all preferences.
          ui.root.dataset.companionOnly='true';ui.panel.hidden=true;ui.panel.inert=true;ui.panel.style.display='none';
          ui.panel._pvDockVisibility=()=>{};
          this.installOutsideCollapse(ui,reader);
          ui.action('orb').setAttribute('aria-label','打开或收起 Paper Loom');ui.action('orb').title='Paper Loom';
          ui.action('orb').onclick=e=>{if(e.detail&&ui._hoverWorkspace){ui._openWorkspace();return;}const active=[...U.livePages(doc)].find(v=>!v.container.hidden);if(active){if(active.frame.dataset.dockMotion==='closing')active.activate();else active.dismiss();return;}if(!ui.panel.hidden&&ui.panel.dataset.pvVisible!=='false'){V.dismissPanel(reader);return;}this.showHome(reader,doc);};
          RS.CiteLensI18n.install(doc);
        }
        const uiDoc=ui.root.ownerDocument,uiWin=uiDoc.defaultView,refit=event=>{if(event?.type==='pointermove'&&!event.buttons)return;try{if(ui.root.isConnected)fitWorkspace(uiDoc);}catch(_){}};if(!uiDoc.location.href.endsWith('shared/settings-frame.html')){uiWin.addEventListener('resize',refit);ui.action('orb').addEventListener('pointermove',refit);const dispose=ui.dispose;ui.dispose=()=>{try{uiWin.removeEventListener('resize',refit);ui.action('orb').removeEventListener('pointermove',refit);}catch(_){}dispose();};refit();}
        ui.action('settings').onclick=()=>this.showSettings(reader,ui.root.ownerDocument);
        for(const [action,key] of [['help','guide'],['feedback','feedback'],['privacy','privacy']])ui.action(action).onclick=()=>this.showInfo(key,ui.root.ownerDocument);
        return ui;
      };
      const oldEngineRoot=V.engineRoot.bind(V);
      V.engineRoot=()=>V.get('enginePath','')||V.get('engineAutoPath','')||oldEngineRoot();
      const ensureWorker=V.ensureWorker.bind(V);
      V.ensureWorker=async()=>{
        const command=PathUtils.join(V.engineRoot(),'python',...(Zotero.isWin?['python.exe']:['bin','python3']));
        if(!await IOUtils.exists(command)){this.showSettings(this.currentReader(),this.currentReader()?._iframeWindow?.document||Zotero.getMainWindow().document,'voice');throw Error('请在「阅读与翻译」的「发音环境」中下载或修复声音。');}
        return ensureWorker();
      };
      LoomSettings.connect(this);
      V.initTranslation();
      try{
        await R.start();await LoomSettings.normalizeAppearance();await V.start();await LoomRuntime.init(this);this.started=true;
        for(const win of Zotero.getMainWindows())R.addWindow(win);
        // Manual updates only; keep the native verification and install path.
        V.stopUpdateSchedule();V.updateAuto=false;V.set('updateCheckEnabled',false);this.connectUpdates();await RS.CiteLensUpdater.setAutomatic(false);
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
    this.updateUnsubscribe?.();this.updateUnsubscribe=null;this.translationUnsubscribe?.();this.translationUnsubscribe=null;
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
