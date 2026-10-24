if(!/qa-profile-assistant127$/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const A=L.assistant,wait=ms=>Zotero.Promise.delay(ms);
let attachment=(await Zotero.Items.getAll(Zotero.Libraries.userLibraryID)).find(x=>x.isAttachment()&&x.attachmentContentType==='application/pdf');
if(!attachment)attachment=await Zotero.Attachments.importFromFile({file:PathUtils.join(Services.dirsvc.get('Home',Components.interfaces.nsIFile).path,'Zotero','storage','WU4RE6LI','Grand et al. - 2021 - BANP opens chromatin and activates CpG-island-regulated genes.pdf')});
let r=await Zotero.Reader.open(attachment.id);for(let i=0;i<100&&!r;i++){await wait(100);r=Zotero.Reader._readers.find(r=>r.itemID===attachment.id);}await r._initPromise;
const view=await A.open(r,{}),doc=view.doc,win=doc.defaultView,I=L.referencesScope.CiteLensI18n;
view.session={schema:1,id:Services.uuid.generateUUID().toString().replace(/[{}]/g,''),title:'Performance fixture',created:Date.now(),updated:Date.now(),messages:[]};
for(let i=0;i<20;i++)view.session.messages.push({role:'user',text:'解释这个结果 '+i},{role:'assistant',status:'done',text:('Scientific text with **bold** and *cis* / *trans*. Evidence [P1].\n').repeat(60),sources:[{id:'P1',title:'Current paper',itemID:attachment.id,page:0}]});
view.render();await wait(1000);view.input.focus();
let calls=0,cost=0,mutations=0;const apply=I.apply;I.apply=function(...args){const t=win.performance.now();calls++;try{return apply.apply(this,args);}finally{cost+=win.performance.now()-t;}};
const observer=new win.MutationObserver(rs=>mutations+=rs.length);observer.observe(view.frame.querySelector('.pl-ai-transcript'),{childList:true,subtree:true,characterData:true});
const samples=[];for(let i=0;i<80;i++){const start=win.performance.now();view.input.setRangeText('文',view.input.value.length,view.input.value.length,'end');view.input.dispatchEvent(new win.InputEvent('input',{bubbles:true,inputType:'insertText',data:'文'}));await new Promise(resolve=>win.requestAnimationFrame(resolve));samples.push(win.performance.now()-start);}
const idle={calls,cost,mutations};calls=0;cost=0;mutations=0;
const streaming={role:'assistant',text:'',status:'streaming',sources:[]};view.session.messages.push(streaming);view.render();await wait(100);calls=0;cost=0;mutations=0;
for(let i=0;i<80;i++){const start=win.performance.now();streaming.text+='New evidence and observation. '.repeat(4);view.stream(streaming);view.input.setRangeText('a',view.input.value.length,view.input.value.length,'end');await new Promise(resolve=>win.requestAnimationFrame(resolve));samples.push(win.performance.now()-start);}
I.apply=apply;observer.disconnect();samples.sort((a,b)=>a-b);return {passed:true,simulatedInput:true,idle,streaming:{calls,cost,mutations},frameLatencyMs:{median:samples[80],p95:samples[152],max:samples.at(-1)},nodes:view.frame.querySelectorAll('*').length};
