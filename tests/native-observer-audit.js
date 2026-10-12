const V=L.voice,R=L.referencesScope,I=R.CiteLensI18n,U=R.CiteLensUI,w=Zotero.getMainWindow(),d=w.document,wait=ms=>Zotero.Promise.delay(ms),checks=[];
if(!Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path.includes('qa-profile'))throw Error('QA only');
U.style(d);
const check=(name,ok)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name+' '+JSON.stringify({tag:select.tagName,value:select.value,label:root.querySelector('.cl-select-trigger')?.textContent,options:select.options?.length,descriptor:!!Object.getOwnPropertyDescriptor(select,'value')}));},saved=V.get('interfaceLanguage'),root=d.createElement('div');root.className='cl-dialog';root.style.cssText='position:fixed;top:30px;left:30px';
const select=d.createElement('select');select.id='loom-observer-select';select.setAttribute('aria-hidden','false');for(const [value,label] of [['a','Alpha'],['b','Beta']]){const option=d.createElement('option');option.value=value;option.textContent=label;select.append(option);}root.append(select);d.documentElement.append(root);
try{
 V.setLanguage('en');await wait(150);let button=root.querySelector('.cl-select-trigger');check('new selects enhanced',!!button);
 select.value='b';check('programmatic value stays synchronous',button.textContent==='Beta');
 select.options[1].firstChild.nodeValue='Beta changed';await wait(80);check('option text changes synchronize',button.textContent==='Beta changed');
 select.disabled=true;await wait(80);check('disabled synchronizes',button.disabled);select.disabled=false;
 select.hidden=true;await wait(80);check('hidden synchronizes',button.hidden);select.hidden=false;
 const text=d.createElement('span');text.textContent='检查更新';root.append(text);await wait(80);check('added UI phrase localized',text.textContent==='Check');
 text.firstChild.nodeValue='自动更新';await wait(80);check('changed UI text localized',text.textContent==='Auto-update');
 const title=d.createElement('div');title.className='cl-title';const scientific=d.createElement('span');scientific.textContent='检查更新';title.append(scientific);root.append(title);await wait(80);scientific.firstChild.nodeValue='自动更新';await wait(80);check('nested bibliographic text preserved',scientific.textContent==='自动更新');
 V.setLanguage('fr');await wait(120);check('language switches update existing text',text.textContent===I.catalogs.fr['自动更新']);check('language switches preserve scientific text',scientific.textContent==='自动更新');
 const removedButton=button;select.remove();await wait(100);check('removed select restores native descriptors',!Object.hasOwn(select,'value')&&!Object.hasOwn(select,'selectedIndex')&&!removedButton.isConnected&&select.getAttribute('aria-hidden')==='false');
 root.append(select);await wait(100);button=root.querySelector('.cl-select-trigger');check('reinserted select binds once',root.querySelectorAll('.cl-select-trigger').length===1&&button!==removedButton);select.value='a';check('reinserted select still synchronizes',button.textContent==='Alpha');
 return {passed:true,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}finally{root.remove();V.setLanguage(saved);}
