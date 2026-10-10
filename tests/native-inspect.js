const doc=Zotero.getMainWindow().document,f=doc.querySelector('.cl-settings'),i=f?.querySelector('iframe'),d=i.contentDocument,orig=d.createElement.bind(d),roots=[];
d.createElement=(tag)=>{const n=orig(tag);if(tag==='div')roots.push(n);return n;};let error;
try{L.voiceScope.PaperVoiceUI.create(L.voice,{_iframeWindow:i.contentWindow});}catch(e){error=String(e);}finally{delete d.createElement;}
return {error,contentType:d.contentType,ns:d.documentElement.namespaceURI,rootNS:roots[0]?.namespaceURI,selects:roots[0]?.querySelectorAll('select').length,html:roots[0]?.outerHTML.slice(-8000),voiceAt:roots[0]?.outerHTML.indexOf('pv-voice'),progress:Runtime.state};
