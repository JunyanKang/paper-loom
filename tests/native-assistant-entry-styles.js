if(!/qa-profile-assistant126$/.test(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path))throw Error('QA only');
const checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name+' '+JSON.stringify(detail));},wait=ms=>Zotero.Promise.delay(ms),A=L.assistant;
const attachment=await Zotero.Attachments.importFromFile({file:PathUtils.join(Services.dirsvc.get('Home',Components.interfaces.nsIFile).path,'Zotero','storage','WU4RE6LI','Grand et al. - 2021 - BANP opens chromatin and activates CpG-island-regulated genes.pdf')});
let reader=await Zotero.Reader.open(attachment.id);for(let i=0;i<100&&!reader;i++){await wait(100);reader=Zotero.Reader._readers.find(r=>r.itemID===attachment.id);}await reader._initPromise;
const doc=reader._iframeWindow.document,win=doc.defaultView;
check('fresh paper has no assistant conversation',!A.views.has(doc));
L.voice.ensurePanel(reader);L.voice.panels.get(reader)._openWorkspace();
for(let i=0;i<100&&!doc.querySelector('.pl-settings [data-loom-page=assistant]');i++)await wait(50);
await doc.querySelector('.pl-settings')._plReady;await L.referencesScope.CiteLensUI.pageQueue;await wait(250);
const settings=doc.querySelector('.pl-settings'),button=settings?.querySelector('[data-loom-page=assistant]'),icon=button?.querySelector('.pl-ai-icon'),style=icon&&win.getComputedStyle(icon);
check('fresh logo entry has assistant tab',!!button);
check('assistant tab icon paints before selecting text',parseFloat(style?.width)>=18&&parseFloat(style?.height)>=18&&style.maskImage!=='none',style?.maskImage);
check('fresh entry loads current style resource',doc.getElementById('pl-assistant-style')?.getAttribute('href')==='resource://'+L.resource+'/assistant/style.css');
const base=parseFloat(win.getComputedStyle(settings).width);button.click();for(let i=0;i<100&&!A.views.has(doc);i++)await wait(50);for(let i=0;i<100&&A.views.get(doc)?.frame._clPage.container.hidden;i++)await wait(50);await wait(300);
const view=A.views.get(doc);check('fresh navigation opens assistant',!!view&&!view.frame._clPage.container.hidden,{hidden:view?.frame._clPage.container.hidden,connected:view?.frame.isConnected,style:doc.getElementById('pl-assistant-style')?.outerHTML});

for(const scale of [1,2,3]){A.setWidthScale(scale);await wait(100);const right=parseFloat(win.getComputedStyle(doc.documentElement).getPropertyValue('--pl-dock-right'))||18;check('fresh width '+scale,Math.abs(view.frame.getBoundingClientRect().width-Math.min(base*scale,win.innerWidth-right-16))<2);}
const link=doc.getElementById('pl-assistant-style');link.href='resource://retired-paper-loom/assistant/style.css';A.installStyle(doc);await wait(100);check('existing retired stylesheet refreshed',link.href==='resource://'+L.resource+'/assistant/style.css');check('style installation stays singular',doc.querySelectorAll('#pl-assistant-style').length===1);
const probe=doc.implementation.createHTMLDocument('style lifecycle');A.installStyle(probe);check('style document tracked',A.styleDocuments.has(probe));A.styleDocuments.get(probe)();check('style release removes link and tracking',!probe.getElementById('pl-assistant-style')&&!A.styleDocuments.has(probe));
A.setWidthScale(1);await wait(100);const rect=view.frame.getBoundingClientRect(),canvas=doc.createElement('canvas');canvas.width=Math.ceil(rect.width*2);canvas.height=Math.ceil(rect.height*2);const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.drawWindow(win,rect.x,rect.y,rect.width,rect.height,'white');await IOUtils.write('/tmp/loom126-fresh-assistant.png',Uint8Array.from(win.atob(canvas.toDataURL().split(',')[1]),x=>x.charCodeAt(0)));return {passed:true,checks};
