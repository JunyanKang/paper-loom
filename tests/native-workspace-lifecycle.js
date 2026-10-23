if(!/qa-profile/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const w=Zotero.getMainWindow(),d=w.document,U=L.referencesScope.CiteLensUI,wait=ms=>Zotero.Promise.delay(ms),checks=[];
const check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
try{
 w.Zotero_Tabs.select('zotero-pane');await wait(200);await L.showHome(null,d);
 const library=L.workspaceReader(d),ui=L.voice.panels.get(library);check('library owns one mascot',d.querySelectorAll('.pv-orb').length===1);
 check('queue and home share the library reader',L.workspaceReader(d)===library);
 const all=await Zotero.Items.getAll(Zotero.Libraries.userLibraryID),attachment=all.find(i=>i.isAttachment()&&i.attachmentContentType==='application/pdf');
 if(!attachment)throw Error('PDF fixture missing');const r=await Zotero.Reader.open(attachment.id);await r._initPromise;L.voice.ensurePanel(r);await wait(300);
 check('library mascot hidden in PDF',w.getComputedStyle(ui.root).display==='none');
 check('reader mascot visible',r._iframeWindow.getComputedStyle(L.voice.panels.get(r).root).display!=='none');
 await L.showHome(r,d);check('toolbar context opens PDF settings in PDF document',!!r._iframeWindow.document.querySelector('.cl-settings'));
 w.Zotero_Tabs.select('zotero-pane');await wait(200);check('library mascot returns',w.getComputedStyle(ui.root).display!=='none');
 await L.showHome(null,d);check('reentry does not create another mascot',d.querySelectorAll('.pv-orb').length===1);
 const updater=L.referencesScope.CiteLensUpdater;
 const disposable=w.openDialog('about:blank','_blank','chrome,width=200,height=100');await wait(100);disposable.close();
 const scope={Zotero:{getMainWindow:()=>disposable,logError:e=>Zotero.logError(e)},ChromeUtils};Services.scriptloader.loadSubScript(L.rootURI+'references/updater.js',scope);await scope.CiteLensUpdater.start({id:L.id,version:L.version});await scope.CiteLensUpdater.check();check('closed startup window cannot break update check',scope.CiteLensUpdater.phase==='current'||scope.CiteLensUpdater.phase==='available');scope.CiteLensUpdater.stop();
 check('update deadlines are independent of a DOM window',typeof updater.host.setTimeout==='function'&&!('document' in updater.host));
 await updater.check();check('real native update check succeeds',updater.phase==='current'||updater.phase==='available');
 return {passed:true,checks,updater:updater.snapshot()};
}catch(e){return {passed:false,checks,error:String(e),stack:e.stack};}
