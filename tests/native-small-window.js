const w=Zotero.getMainWindow();if(!Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path.includes('qa-profile'))throw Error('QA only');
w.resizeTo(900,640);await Zotero.Promise.delay(200);return {passed:true,viewport:{width:w.innerWidth,height:w.innerHeight},purpose:'Set a constrained window before layout and popup regressions'};
