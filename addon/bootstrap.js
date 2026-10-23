var LoomScope;
async function startup({rootURI,version}) {
  await Zotero.initializationPromise;await Zotero.uiReadyPromise;
  LoomScope={Zotero,ChromeUtils,Services,IOUtils,PathUtils,Components,URL:Zotero.getMainWindow().URL};
  for(const file of ['shared/runtime-core.js','shared/runtime.js','shared/settings.js','shared/design.js','shared/shell.js','shared/settings-ui.js','shared/voice-welcome.js','shared/integration.js','assistant/core.js','assistant/store.js','assistant/transport.js','assistant/context.js','assistant/tools.js','assistant/controller.js','assistant/citations.js','assistant/history.js','assistant/ui.js'])Services.scriptloader.loadSubScript(rootURI+file,LoomScope);
  await LoomScope.PaperLoom.start({rootURI,version});
}
async function shutdown(){if(LoomScope)await LoomScope.PaperLoom.stop();LoomScope=null;}
function install(){}
function uninstall(){}
function onMainWindowLoad({window}){LoomScope?.PaperLoom.addWindow(window);}
function onMainWindowUnload({window}){LoomScope?.PaperLoom.removeWindow(window);}
