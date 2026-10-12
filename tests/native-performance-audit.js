const V=L.voice,R=L.referencesScope,U=R.CiteLensUI,T=R.CiteLensTranslation,w=Zotero.getMainWindow(),d=w.document,wait=ms=>Zotero.Promise.delay(ms),profile=Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path;
if(!profile.includes('qa-profile'))throw Error('QA only');
await L.showSettings(null,d);await U.pageScopes.get(d)?.queue;await wait(300);
const frame=d.querySelector('.cl-settings'),inside=frame.querySelector('iframe').contentDocument,metrics={},originalStyle=w.getComputedStyle,originalLocalize=V.localize,originalSync=V.syncSettings;
let styleReads=0,localized=0,syncs=0;w.getComputedStyle=function(el,...args){if(el?.classList?.contains('cl-select-trigger'))styleReads++;return originalStyle.call(this,el,...args);};V.localize=function(...args){localized++;return originalLocalize.apply(this,args);};V.syncSettings=function(...args){syncs++;return originalSync.apply(this,args);};
const unrelated=d.createElement('div');d.documentElement.append(unrelated);const savedSize=V.get('captionSize',12);
try{
 await wait(50);styleReads=0;for(let i=0;i<10;i++){const n=d.createElement('span');n.textContent='Unrelated UI '+i;unrelated.append(n);await wait(20);}metrics.unrelatedDropdownStyleReads=styleReads;
 localized=0;for(let i=0;i<10;i++)V.updatePanels();metrics.playbackUpdatesLocalizations=localized;
 syncs=0;V.set('captionSize',Number(savedSize)===14?16:14);await wait(150);metrics.fontChangeGlobalSyncs=syncs;
 const b=frame.getBoundingClientRect();metrics.frame={width:b.width,height:b.height};return {passed:metrics.unrelatedDropdownStyleReads===0&&metrics.playbackUpdatesLocalizations===0&&metrics.fontChangeGlobalSyncs===1,metrics};
}finally{w.getComputedStyle=originalStyle;V.localize=originalLocalize;V.syncSettings=originalSync;unrelated.remove();V.set('captionSize',savedSize);}
