const w=Zotero.getMainWindow(),d=w.document,U=L.referencesScope.CiteLensUI,S=L.referencesScope.CiteLensServices,wait=ms=>Zotero.Promise.delay(ms),checks=[],check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
if(!Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path.includes('qa-profile'))throw Error('QA only');
const oldQueue=S.state.queue;let panel,fixture;
try{
 S.state.queue=Array.from({length:150},(_,i)=>({key:'test-'+i,record:{title:'Test paper '+i,year:'2026',authors:[]},status:'pending',context:{}}));
 panel=U.panel(d,null,{view:'queue'});await U.pageScopes.get(d)?.queue;await wait(180);
 const body=panel.querySelector('.cl-body'),search=panel.querySelector('.cl-search'),replace=body.replaceChildren;let writes=0;body.replaceChildren=function(...args){writes++;return replace.apply(this,args);};
 for(const value of ['T','Te','Tes','Test','Test paper 149']){search.value=value;search.dispatchEvent(new w.InputEvent('input',{bubbles:true}));}
 check('typing burst retains existing rows before filtering',writes===0);await wait(200);check('typing burst renders the final result once',writes===2&&body.textContent.includes('Test paper 149'),{writes});
 writes=0;search.dispatchEvent(new w.InputEvent('input',{bubbles:true,isComposing:true}));await wait(170);check('IME composition does not rebuild the list',writes===0);search.dispatchEvent(new w.CompositionEvent('compositionend',{bubbles:true}));await wait(170);check('IME completion applies one result',writes===2);
 search.value='unused';search.dispatchEvent(new w.InputEvent('input',{bubbles:true}));writes=0;panel._clPage.destroy();await wait(170);check('closing cancels scheduled searches',writes===0);panel=null;
 fixture=U.el(d,'div',null,'cl-dialog');fixture.style.cssText='position:fixed;left:80px;top:80px;z-index:200000';const select=U.el(d,'select');for(const [text,disabled] of [['Alpha',false],['Beta',false],['Unavailable',true]]){const o=U.el(d,'option',text);o.disabled=disabled;select.append(o);}fixture.append(select);d.documentElement.append(fixture);await wait(100);const b=fixture.querySelector('.cl-select-trigger');b.click();b.dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));b.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));check('End skips a disabled trailing option',select.value==='Beta');b.click();b.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));b.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));check('ArrowDown keeps the last enabled selection',select.value==='Beta');
 return {passed:checks.every(c=>c.ok),checks};
}finally{panel?._clPage.destroy();fixture?.remove();S.state.queue=oldQueue;}
