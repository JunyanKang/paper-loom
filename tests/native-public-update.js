(async()=>{
 const root=__ROOT__,resultPath=PathUtils.join(root,__RESULT_DIR__,'result.json'),checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);},wait=ms=>Zotero.Promise.delay(ms);
 try{
  const before=Zotero.PaperLoom;check('previous version started',before.version===__PREVIOUS__);
  const {nsLoginInfo}=ChromeUtils.importESModule('resource://gre/modules/LoginInfo.sys.mjs'),credential=new nsLoginInfo();credential.init('https://upgrade-fixture.invalid',null,'Paper Loom API','custom https://upgrade-fixture.invalid/v1','upgrade-fixture-only','','');await Services.logins.addLoginAsync(credential);
  before.voice.set('rate','1.15');before.referencesScope.CiteLensTranslation.set('translationTarget','fr');
  const item=new Zotero.Item('journalArticle');item.setField('title','Paper Loom upgrade preservation sample');await item.saveTx();const itemID=item.id;
  before.referencesScope.CiteLensServices.state.settings.theme='porcelain';before.referencesScope.CiteLensServices.state.settings.transparency=75;await before.referencesScope.CiteLensServices.persist();Services.prefs.savePrefFile(null);
  const {AddonManager:M}=ChromeUtils.importESModule('resource://gre/modules/AddonManager.sys.mjs'),addon=await M.getAddonByID('paper-loom@local.research');
  const install=await new Promise((resolve,reject)=>{let found;addon.findUpdates({onUpdateAvailable(a,i){found=i;},onUpdateFinished(a,error){error?reject(Error('Update discovery '+error)):resolve(found);}},M.UPDATE_WHEN_USER_REQUESTED);});
  check('public feed offers target release',install?.version===__TARGET__,{version:install?.version});
  await new Promise((resolve,reject)=>{const listener={onInstallEnded(){install.removeListener(listener);resolve();},onDownloadFailed(){reject(Error('Download failed'));},onInstallFailed(){reject(Error('Install failed'));}};install.addListener(listener);install.install().catch(reject);});
  for(let n=0;n<150&&!(Zotero.PaperLoom?.version===__TARGET__&&Zotero.PaperLoom.started);n++)await wait(100);
  const after=Zotero.PaperLoom;check('new release starts',after.version===__TARGET__&&after.started);check('voice preference kept',after.voice.get('rate')==='1.15');check('shared translation preference kept',after.referencesScope.CiteLensTranslation.get('translationTarget')==='fr');check('appearance kept',after.referencesScope.CiteLensServices.state.settings.theme==='porcelain');check('old excessive transparency is clamped on upgrade',after.referencesScope.CiteLensServices.state.settings.transparency===10);check('library item kept',Zotero.Items.get(itemID)?.getField('title')==='Paper Loom upgrade preservation sample');check('one launcher after upgrade',Zotero.getMainWindow().document.querySelectorAll('.pl-library-entry').length===1);
  check('secure key survives upgrade',await after.referencesScope.CiteLensTranslation.llmKey({id:'custom',endpoint:'https://upgrade-fixture.invalid/v1'})==='upgrade-fixture-only');
  await after.referencesScope.CiteLensUpdater.check();check('live product update check reports current',after.referencesScope.CiteLensUpdater.phase==='current',after.referencesScope.CiteLensUpdater.snapshot());
  await IOUtils.writeJSON(resultPath,{passed:true,checks});
 }catch(e){await IOUtils.writeJSON(resultPath,{passed:false,checks,error:String(e),stack:e.stack});}
})();
