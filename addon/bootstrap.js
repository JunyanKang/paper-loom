var LoomScope;
async function startup({rootURI,version}) {
  await Zotero.initializationPromise;await Zotero.uiReadyPromise;
  LoomScope={Zotero,ChromeUtils,Services,IOUtils,PathUtils,Components};
  for(const file of ['shared/runtime-core.js','shared/runtime.js','shared/settings.js','shared/shell.js','shared/settings-ui.js','shared/integration.js'])Services.scriptloader.loadSubScript(rootURI+file,LoomScope);
  await LoomScope.PaperLoom.start({rootURI,version});
}
async function shutdown(){if(LoomScope)await LoomScope.PaperLoom.stop();LoomScope=null;}
function install(){}
function uninstall(){}
function onMainWindowLoad({window}){LoomScope?.PaperLoom.addWindow(window);}
function onMainWindowUnload({window}){LoomScope?.PaperLoom.removeWindow(window);}
