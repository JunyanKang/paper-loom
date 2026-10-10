const base=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),scope={Zotero,IOUtils,PathUtils,Services,ChromeUtils,Components,LoomRuntimeCore:L.runtimeCore};
Services.scriptloader.loadSubScript(Services.io.newFileURI(Zotero.File.pathToFile(PathUtils.join(base,'addon','shared','runtime-core.js'))).spec,scope);
Services.scriptloader.loadSubScript(Services.io.newFileURI(Zotero.File.pathToFile(PathUtils.join(base,'addon','shared','runtime.js'))).spec,scope);
Runtime.hash=scope.LoomRuntime.hash;Runtime.run=scope.LoomRuntime.run;
return {passed:true};
