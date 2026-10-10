const base=PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),doc=Zotero.getMainWindow().document;
doc.querySelector('.cl-settings')?._clClose?.();await Zotero.Promise.delay(400);
Services.scriptloader.loadSubScript(Services.io.newFileURI(Zotero.File.pathToFile(PathUtils.join(base,'addon','voice','panel.js'))).spec,L.voiceScope);
return {passed:true,progress:Runtime.state};
