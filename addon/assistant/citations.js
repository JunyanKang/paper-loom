/* Reuse the citation product, including abstracts and library actions. */
Object.assign(LoomAssistant,{
 paperMentions(text){
  const C=PaperLoom.referencesScope.CiteLensCore,all=C.citationMentions(text);
  for(const m of text.matchAll(/(?:参考文献|引用|文献|引文)\s*[\[【]?\s*(\d{1,3})\s*[\]】]?/g))all.push({start:m.index,end:m.index+m[0].length,text:m[0],keys:[{number:Number(m[1])}]});
  all.sort((a,b)=>a.start-b.start||b.end-a.end);const out=[];
  for(const m of all){const prev=out.at(-1);if(prev&&m.start<prev.end)continue;
   if(prev&&prev.keys.length===1&&prev.keys[0].number&&m.keys.length===1&&m.keys[0].author&&/^[\s,，;；(（]*$/.test(text.slice(prev.end,m.start))){prev.end=m.end;prev.text=text.slice(prev.start,m.end);prev.confirm=m.keys;}
   else out.push({...m});
  }return out;
 },
 resolvePaperMention(mention,bibliographies){
  const C=PaperLoom.referencesScope.CiteLensCore,answers=[];
  for(const refs of bibliographies){const hit=C.resolveMention(mention,refs);if(hit.unresolved.length||!hit.records.length)continue;
   if(mention.confirm){const confirm=C.resolveMention({keys:mention.confirm},hit.records);if(confirm.unresolved.length||confirm.records.length!==1||hit.records.length!==1||C.identity(confirm.records[0])!==C.identity(hit.records[0]))continue;}
   answers.push(hit.records);
  }
  if(!answers.length)return [];
  const signature=records=>records.map(r=>C.identity(r)).sort().join('|');
  // Reference numbers are local to a paper. Never choose arbitrarily between papers.
  if(new Set(answers.map(signature)).size!==1)return [];
  return answers[0];
 },
 async hydratePaperCitations(view,body,message,context){
  const session=view.session,doc=view.doc;
  if(!this.paperMentions(body.textContent).length)return;
  const ids=[...new Set((context?.papers||[context?.paper]).filter(Boolean).map(p=>p.attachmentID).filter(Number.isInteger))].slice(0,8);
  const saved=message.paperCitations||[];let bibliographies=[];
  if(ids.length&&this.paperMentions(body.textContent).some(m=>!saved.some(s=>s.text===m.text))){
   const results=await Promise.all(ids.map(async id=>{const reader=Zotero.Reader._readers?.find(r=>r.itemID===id&&!r._isTabClosed);if(!reader)return null;try{return await PaperLoom.references.references(reader);}catch(_){return null;}}));
   // An unavailable member of a comparison could change a numeric match.
   if(results.every(Boolean))bibliographies=results;
  }
  if(!body.isConnected||view.session!==session||this.dead)return;
  const nodes=[],walker=doc.createTreeWalker(body,4);let node;
  while((node=walker.nextNode()))if(!node.parentElement.closest('button,a,code,pre'))nodes.push(node);
  const compact=r=>{const record={};for(const key of ['title','DOI','doi','year','author','journal','volume','issue','pages','url','itemType','type','source','number','suffix','raw','abstract'])if(r[key]!==undefined)record[key]=typeof r[key]==='string'?r[key].slice(0,key==='abstract'?12000:3000):r[key];if(r.creators)record.creators=r.creators.slice(0,100).map(c=>({firstName:c.firstName||'',lastName:c.lastName||'',creatorType:c.creatorType||'author'}));return record;};
  let changed=false;
  for(const node of nodes){const text=node.nodeValue,fragment=doc.createDocumentFragment();let at=0;
   for(const mention of this.paperMentions(text)){let records=bibliographies.length?this.resolvePaperMention(mention,bibliographies):saved.find(s=>s.text===mention.text)?.records||[];if(!records.length)continue;
    fragment.append(doc.createTextNode(text.slice(at,mention.start)));const button=PaperLoom.button(doc,mention.text,()=>{});button.classList.add('pl-ai-citation');this.bindCitation(view,button,records.map(record=>({record})));fragment.append(button);at=mention.end;
    if(!saved.some(s=>s.text===mention.text)&&saved.length<100){saved.push({text:mention.text,records:records.map(compact)});changed=true;}
   }
   if(at){fragment.append(doc.createTextNode(text.slice(at)));node.replaceWith(fragment);}
  }
  if(changed){message.paperCitations=saved;await LoomAssistantStore.save(session);}
 },

 citationTokens(text,sources=[]){const known=new Map(sources.map(s=>[s.id,s])),pattern=/([\[【（(][LP]\d+(?:\s*[,;，；、]\s*[LP]\d+)*[\]】）)])/g;return String(text).split(pattern).map(value=>{const ids=value.match(/^[\[【（(]([LP]\d+(?:\s*[,;，；、]\s*[LP]\d+)*)[\]】）)]$/)?.[1]?.split(/\s*[,;，；、]\s*/);return {text:value,sources:ids?.every(id=>known.has(id))?ids.map(id=>known.get(id)):null};});},
 bindCitation(view,button,sources){
  const A=this,doc=view.doc,win=doc.defaultView,U=PaperLoom.referencesScope.CiteLensUI;
  const records=sources.filter(s=>s.record?.title).map(s=>s.record);if(!records.length)return;
  button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
  const open=()=>{
   if(view.citation?.anchor===button){view.citation.keep();return;}
   view.citation?.close();const root=U.el(doc,'section',null,'cl-floating pl-ai-reference-popover');root.dataset.citeLens='floating';root.setAttribute('popover','manual');root.setAttribute('role','dialog');root.setAttribute('aria-label',A.t('参考文献','References'));
   const context={assistant:true,sourceTitle:view.session?.title||A.t('科研助手对话','Research conversation')};
   root.append(U.citationGroup(doc,records,null,{context}));doc.body.append(root);root.showPopover();button.setAttribute('aria-expanded','true');
   let timer=0,closed=false;
   const close=()=>{if(closed)return;closed=true;win.clearTimeout(timer);if(doc._clAbstract?.title&&root.contains(doc._clAbstract.title))doc._clAbstract.close(true);root.remove();button.setAttribute('aria-expanded','false');doc.removeEventListener('pointerover',over,true);doc.removeEventListener('pointerdown',outside,true);doc.removeEventListener('scroll',scroll,true);win.removeEventListener('resize',close);if(view.citation?.anchor===button)view.citation=null;};
   const keep=()=>{win.clearTimeout(timer);timer=0;};
   const modal=node=>{const overlay=node?.closest?.('.cl-overlay');return overlay&&overlay!==view.frame.closest('.cl-overlay')&&overlay.getClientRects().length;};
   const related=node=>button.contains(node)||root.contains(node)||modal(node)||!!node?.closest?.('.cl-summary,.cl-select-popover,.cl-tooltip');
   const defer=()=>{keep();timer=win.setTimeout(()=>{if(!button.isConnected||!root.isConnected){close();return;}if((doc.activeElement?.matches?.(':focus-visible')&&related(doc.activeElement))||root.matches(':hover')||button.matches(':hover')||doc.querySelector('.cl-summary:hover')||[...doc.querySelectorAll('.cl-overlay:not([hidden])')].some(modal))return;close();},PaperLoom.hoverDismissDelay??180);};
   const over=e=>related(e.target)?keep():defer(),outside=e=>{if(!related(e.target))close();},scroll=e=>{if(!root.contains(e.target)&&!e.target.closest?.('.cl-summary'))close();};
   root.addEventListener('pointerenter',keep);root.addEventListener('pointerleave',defer);root.addEventListener('focusout',defer);root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();button.focus();}});
   doc.addEventListener('pointerover',over,true);doc.addEventListener('pointerdown',outside,true);doc.addEventListener('scroll',scroll,true);win.addEventListener('resize',close);
   const a=button.getBoundingClientRect(),r=root.getBoundingClientRect();root.style.left=Math.max(8,Math.min(a.left,win.innerWidth-r.width-8))+'px';root.style.top=Math.max(8,Math.min(a.bottom+6,win.innerHeight-r.height-8))+'px';U.fitPopup(root,doc);
   view.citation={anchor:button,close,keep,defer};
  };
  button.addEventListener('pointerenter',open);button.addEventListener('focus',open);button.addEventListener('pointerleave',()=>view.citation?.defer());button.addEventListener('blur',()=>view.citation?.defer());button.addEventListener('click',e=>{e.preventDefault();open();});
 },
 citationButton(view,source,label){const button=PaperLoom.button(view.doc,label||'['+source.id+']',async()=>{if(source.record)return;if(source.attachmentID&&Number.isInteger(source.annotationPage)){const reader=await Zotero.Reader.open(source.attachmentID);await reader.navigate({pageIndex:source.annotationPage});}else if(source.page!==undefined&&source.itemID){const reader=await Zotero.Reader.open(source.itemID);await reader.navigate({pageIndex:source.page});}else if(source.url){try{Zotero.launchURL(LoomAssistantCore.publicURL(source.url));}catch(_){}}else if(source.itemID)Zotero.getMainWindow().ZoteroPane.selectItem(source.itemID);});button.classList.add('pl-ai-citation');this.bindCitation(view,button,[source]);return button;}
});
