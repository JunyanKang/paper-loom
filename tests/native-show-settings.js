const doc=Zotero.getMainWindow().document;
await L.showSettings(null,doc);doc.querySelector('.cl-settings')._plSelect('voice');
return {passed:true,progress:Runtime.state};
