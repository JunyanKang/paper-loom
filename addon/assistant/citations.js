/* Reuse the citation product, including abstracts and library actions. */
Object.assign(LoomAssistant,{
 citationTokens(text,sources=[]){const known=new Map(sources.map(s=>[s.id,s]));return String(text).split(/(\[(?:[LP]\d+)(?:\s*[,;]\s*[LP]\d+)*\])/g).map(value=>{const ids=value.match(/^\[([LP]\d+(?:\s*[,;]\s*[LP]\d+)*)\]$/)?.[1]?.split(/\s*[,;]\s*/);return {text:value,sources:ids?.every(id=>known.has(id))?ids.map(id=>known.get(id)):null};});},
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
 citationButton(view,source,label){const button=PaperLoom.button(view.doc,label||'['+source.id+']',async()=>{if(source.record)return;if(source.page!==undefined&&source.itemID){const reader=await Zotero.Reader.open(source.itemID);await reader.navigate({pageIndex:source.page});}else if(source.url){try{Zotero.launchURL(LoomAssistantCore.publicURL(source.url));}catch(_){}}else if(source.itemID)Zotero.getMainWindow().ZoteroPane.selectItem(source.itemID);});button.classList.add('pl-ai-citation');this.bindCitation(view,button,[source]);return button;}
});
