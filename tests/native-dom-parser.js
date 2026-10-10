const win=Zotero.getMainWindow(),doc=win.document.querySelector('.pl-settings-frame').contentDocument,html='<div><button data-test="x">Test</button><select><option>A</option></select><input type="checkbox"></div>',checks={};
try{checks.domParser=new win.DOMParser().parseFromString(html,'text/html').body.innerHTML;}catch(e){checks.domParser=String(e);}
try{const r=doc.createRange();r.selectNodeContents(doc.body);const f=r.createContextualFragment(html);checks.range={buttons:f.querySelectorAll('button').length,selects:f.querySelectorAll('select').length};}catch(e){checks.range=String(e);}
try{const el=doc.createElement('div');checks.unsafe=typeof el.setHTMLUnsafe;if(el.setHTMLUnsafe){el.setHTMLUnsafe(html);checks.unsafeHTML=el.innerHTML;}}catch(e){checks.unsafe=String(e);}
return checks;
