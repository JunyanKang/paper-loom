const checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);},doc=Zotero.getMainWindow().document,T=L.referencesScope.CiteLensTranslation;
const size=L.voice.get('captionSize',12),provider=T.get('translationProvider','tencenttransmart'),target=T.get('translationTarget','zh-Hans');
try{
 check('single library launcher',doc.querySelectorAll('.pl-library-entry').length===1);
 L.voice.setCaptionStyle('captionSize',16);check('caption font size shared with abstracts',T.get('translationSize')==='16');
 await L.showSettings(null,doc);const frame=doc.querySelector('.cl-settings'),tabs=[...frame.querySelectorAll('.cl-settings-tabs [role=tab]')];await Zotero.Promise.delay(400);
 check('four setting tabs stay on one row',Math.max(...tabs.map(b=>b.getBoundingClientRect().y))-Math.min(...tabs.map(b=>b.getBoundingClientRect().y))<2);
 check('one translation size control',!frame.querySelector('[data-translation-setting=translationSize]')&&!!frame.querySelector('iframe').contentDocument.querySelector('[data-field=captionSize]'));
 check('periodic discovery and auto-install settings both retained',!!frame.querySelector('.pl-update-schedule select')&&!!frame.querySelector('#cl-setting-autoUpdate'));
 frame._plSelect('voice');await Zotero.Promise.delay(300);const iframe=frame.querySelector('iframe'),panel=iframe.contentDocument.querySelector('.pv-panel');check('voice settings use one outer scroll area',panel.getBoundingClientRect().height<=iframe.clientHeight);
 frame._clClose();const queue=L.showQueue();await L.referencesScope.CiteLensUI.pageQueue;await Zotero.Promise.delay(500);check('library opens actual later-reading list',queue.querySelector('[data-view=queue]').getAttribute('aria-selected')==='true');queue._clClose();
 const empty=PathUtils.join(PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),'test-results','empty-hash.fixture');await IOUtils.write(empty,new Uint8Array());check('empty package files hash correctly',await Runtime.hash(empty)==='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
 T.set('translationProvider','tencenttransmart');T.set('translationTarget','zh-Hans');const translated=await L.voice.translate('The retina detects light.','en');check('shared translation service returns real translation',!!translated.text&&translated.text!=='The retina detects light.',{text:translated.text});
 return {passed:true,checks};
}catch(e){return {passed:false,checks,error:String(e),stack:e.stack};}finally{L.voice.setCaptionStyle('captionSize',size);T.set('translationProvider',provider);T.set('translationTarget',target);}
