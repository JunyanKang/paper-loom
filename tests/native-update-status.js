if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const Q=L.referencesScope,U=Q.CiteLensUI,A=Q.CiteLensUpdater,wait=ms=>Zotero.Promise.delay(ms),d=Zotero.getMainWindow().document,checks=[],saved={phase:A.phase,message:A.message,errorKind:A.errorKind};
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};let f;
try{
 d.querySelector('.cl-settings')?._clPage?.destroy();A.set('current','已是最新版本');await L.showSettings(null,d);await U.pageScopes.get(d)?.queue;await wait(200);f=d.querySelector('.cl-settings');const status=f.querySelector('[data-update-status]'),version='v'+A.snapshot().version,baseline=f.getBoundingClientRect().height;
 check('settings starts with installed version instead of previous result',!status.hidden&&status.textContent===version,status.textContent);
 A.set('checking','正在检查更新…');await wait(60);check('checking temporarily replaces version',status.textContent!==version&&!status.hidden,status.textContent);
 A.set('current','已是最新版本');await wait(5200);check('result restores installed version after five seconds',status.textContent===version,status.textContent);
 A.set('error','连接失败','network');await wait(60);check('error is visible',status.classList.contains('cl-error')&&status.textContent!==version);
 A.set('checking','正在检查更新…');await wait(5200);check('previous result timer cannot erase a newer pending operation',status.textContent!==version&&!status.classList.contains('cl-error'),status.textContent);
 A.set('current','已是最新版本');await wait(5200);check('latest completion restores version',status.textContent===version&&status.getAttribute('aria-label')===version&&!status.classList.contains('cl-error'),status.outerHTML);
 check('footer feedback does not resize workspace',f.getBoundingClientRect().height===baseline);
 f._clPage.destroy();f=null;A.set('error','连接失败','network');await L.showSettings(null,d);await U.pageScopes.get(d)?.queue;await wait(200);f=d.querySelector('.cl-settings');check('reopening does not carry a stale error',f.querySelector('[data-update-status]').textContent===version);
 return {passed:true,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}finally{f?._clPage?.destroy();A.set(saved.phase,saved.message,saved.errorKind);}
