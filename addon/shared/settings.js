/* One configuration owner; migration only copies predecessor state. */
var LoomSettings = {
  common:new Set(['translationSize','translationFont','translationProvider','translationTarget','llmProvider','llmConfigs','llmRevision','llmDiscoveredModels','llmCatalog']),
  isShared(key){return this.common.has(key)||key.startsWith('llm');},
  async migrate() {
    const branch=Services.prefs,marker='extensions.paperLoom.migrationVersion';
    if(branch.getIntPref(marker,0)>=2)return;
    const copy=(from,to)=>{for(const key of branch.getChildList(from)){const target=to+key.slice(from.length);if(branch.prefHasUserValue(target))continue;const type=branch.getPrefType(key);if(type===branch.PREF_BOOL)branch.setBoolPref(target,branch.getBoolPref(key));else if(type===branch.PREF_INT)branch.setIntPref(target,branch.getIntPref(key));else if(type===branch.PREF_STRING)branch.setStringPref(target,branch.getStringPref(key));}};
    copy('extensions.paperVoice.','extensions.paperLoom.voice.');
    for(const [old,key] of [['captionSize','translationSize'],['captionFont','translationFont']]){const target='extensions.zotero.paperLoom.shared.'+key;if(!branch.prefHasUserValue(target)&&branch.prefHasUserValue('extensions.paperVoice.'+old))branch.setStringPref(target,String(Zotero.Prefs.get('extensions.paperVoice.'+old,true)));}
    copy('extensions.zotero.citeLens.','extensions.zotero.paperLoom.shared.');
    for(const key of branch.getChildList('extensions.paperVoice.')) {
      const name=key.slice('extensions.paperVoice.'.length);if(!this.isShared(name))continue;
      const target='extensions.zotero.paperLoom.shared.'+name;if(branch.prefHasUserValue(target))continue;
      const type=branch.getPrefType(key);if(type===branch.PREF_STRING)branch.setStringPref(target,branch.getStringPref(key));else if(type===branch.PREF_INT)branch.setIntPref(target,branch.getIntPref(key));else if(type===branch.PREF_BOOL)branch.setBoolPref(target,branch.getBoolPref(key));
    }
    const target=PathUtils.join(Zotero.DataDirectory.dir,'paper-loom'),source=PathUtils.join(Zotero.DataDirectory.dir,'cite-lens');
    await IOUtils.makeDirectory(target,{ignoreExisting:true});
    if(await IOUtils.exists(source))for(const old of await IOUtils.getChildren(source)) {
      const name=PathUtils.filename(old),to=PathUtils.join(target,name==='state.json'?'references-state.json':name);
      if(!await IOUtils.exists(to))await IOUtils.copy(old,to,{recursive:true});
    }
    const statePath=PathUtils.join(target,'references-state.json');
    if(!await IOUtils.exists(statePath)){
      const settings={};
      for(const [old,key] of [['theme','theme'],['interfaceLanguage','interfaceLanguage'],['surfaceTransparency','transparency'],['themeImageEnabled','customThemeImage']]){
        if(branch.prefHasUserValue('extensions.paperVoice.'+old))settings[key]=Zotero.Prefs.get('extensions.paperVoice.'+old,true);
      }
      await IOUtils.writeJSON(statePath,{schema:1,queue:[],metrics:[],cache:{},settings});
    }
    const oldImage=PathUtils.join(PathUtils.profileDir,'paper-voice-background.jpg'),image=PathUtils.join(target,'background.jpg');
    if(!await IOUtils.exists(image)&&await IOUtils.exists(oldImage))await IOUtils.copy(oldImage,image);
    // Merge non-conflicting provider configurations. Save both originals for review.
    const read=(prefix,key)=>{try{return Zotero.Prefs.get(prefix+key,true);}catch(_){return undefined;}};
    const profiles={voice:{},references:{}};
    for(const key of this.common)for(const [name,prefix] of [['voice','extensions.paperVoice.'],['references','extensions.zotero.citeLens.']]){const value=read(prefix,key);if(value!==undefined)profiles[name][key]=value;}
    if(!Zotero.Prefs.get('paperLoom.shared.previousTranslationProfiles'))Zotero.Prefs.set('paperLoom.shared.previousTranslationProfiles',JSON.stringify(profiles));
    let a={},b={};try{a=JSON.parse(profiles.voice.llmConfigs||'{}');b=JSON.parse(profiles.references.llmConfigs||'{}');}catch(_){}
    if(Object.keys(a).length||Object.keys(b).length)Zotero.Prefs.set('paperLoom.shared.llmConfigs',JSON.stringify({...a,...b,...JSON.parse(Zotero.Prefs.get('paperLoom.shared.llmConfigs')||'{}')}));
    const {nsLoginInfo}=ChromeUtils.importESModule('resource://gre/modules/LoginInfo.sys.mjs');
    const logins=await Services.logins.getAllLogins();
    for(const realm of ['Paper Nexus API','Paper Voice API'])for(const old of logins.filter(l=>l.httpRealm===realm)) {
      if(Services.logins.findLogins(old.hostname,null,'Paper Loom API').some(l=>l.username===old.username))continue;
      const login=new nsLoginInfo();login.init(old.hostname,null,'Paper Loom API',old.username,old.password,'','');await Services.logins.addLoginAsync(login);
    }
    // Persist a metadata-only migration receipt, never credentials.
    await IOUtils.writeJSON(PathUtils.join(target,'migration.json'),{schema:1,date:new Date().toISOString(),sources:['Paper Voice 1.4.16','Paper Nexus 1.1.3'],originalsPreserved:true});
    branch.setIntPref(marker,2);branch.savePrefFile(null);
  },
  connect(owner) {
    this.owner=owner;const V=owner.voice,R=owner.referencesScope,T=R.CiteLensTranslation,S=R.CiteLensServices,rawGet=V.get.bind(V),rawSet=V.set.bind(V);
    const appearance={theme:'theme',interfaceLanguage:'interfaceLanguage',surfaceTransparency:'transparency',themeImageEnabled:'customThemeImage'};
    const aliases={captionSize:'translationSize',captionFont:'translationFont'};
    V.get=(key,fallback)=>aliases[key]?T.get(aliases[key],fallback):this.isShared(key)?T.get(key,fallback):appearance[key]&&S.state?.settings?(S.state.settings[appearance[key]]??rawGet(key,fallback)):rawGet(key,fallback);
    V.set=(key,value)=>{
      if(aliases[key]){T.set(aliases[key],String(value));R.CiteLensThemes.refresh();return;}
      if(this.isShared(key)){T.set(key,value);return;}
      if(appearance[key]&&S.state?.settings){S.state.settings[appearance[key]]=value;S.persist().catch(e=>Zotero.logError(e));R.CiteLensThemes.refresh();}else rawSet(key,value);
    };
    V.themeImagePath=()=>R.CiteLensThemes.imagePath();
    const refresh=R.CiteLensThemes.refresh.bind(R.CiteLensThemes);
    R.CiteLensThemes.refresh=()=>{refresh();V.customThemeImage=R.CiteLensThemes.customImage;V.syncSettings();};
    // One provider catalog, one credential realm and one translation execution path.
    for(const key of ['llmPreset','llmConfig','llmKey','llmLogins','validateLLM','removeLLMKey','translateLLM','llmRequest'])V[key]=(...args)=>T[key](...args);
    V.llmPresets=T.llmPresets;
    V.saveLLM=(config,key)=>T.saveLLM(config,key);
    V.testLLM=async config=>{const result=await T.testLLM(config);if(!result.translation?.ok)throw Error(result.translation?.message||'连接失败');return {text:'连接成功',source:config.name||config.id};};
    V.translate=(text,sourceLanguage=null,options={})=>T.translate(owner.voiceScope.PaperVoiceCore.speechText(text),sourceLanguage||V.activeSpeechLanguage||V.speechLanguage?.()||'en',options);
    T.syncSettings=()=>{V.syncSettings();};
  },
  async restoreTranslation(source) {
    const T=this.owner.referencesScope.CiteLensTranslation,profiles=JSON.parse(T.get('previousTranslationProfiles','{}')),profile=profiles[source];
    if(!profile)throw Error('没有可导入的旧配置。');
    for(const [key,value] of Object.entries(profile))T.set(key,value);
    const realm=source==='voice'?'Paper Voice API':'Paper Nexus API';
    const {nsLoginInfo}=ChromeUtils.importESModule('resource://gre/modules/LoginInfo.sys.mjs');
    for(const old of (await Services.logins.getAllLogins()).filter(l=>l.httpRealm===realm)) {
      const existing=Services.logins.findLogins(old.hostname,null,'Paper Loom API').find(l=>l.username===old.username);
      const login=new nsLoginInfo();login.init(old.hostname,null,'Paper Loom API',old.username,old.password,'','');if(existing)Services.logins.modifyLogin(existing,login);else await Services.logins.addLoginAsync(login);
    }
    T.translationCache.clear();T.syncSettings();Services.prefs.savePrefFile(null);
  }
};
