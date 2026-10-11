/* Free translation adapters. Prefer Translate for Zotero's documented public API.
 * Direct adapters use the same public website services; there are no API keys or paid fallbacks.
 * Reference: https://github.com/windingwind/zotero-pdf-translate (public api.translate contract).
 */
var PaperVoiceTranslation = {
 translationTerms(value,target) {
  // Protect a small, explicit scientific glossary and quantitative ranges.
  // Generic prose is still translated by the selected service.
  if(!['zh-Hans','zh-Hant'].includes(target))return {text:value,restore:text=>text};
  const definitions=[
   [/\bM\s*[üu]\s*l\s*l\s*e\s*r[ -]*(?:(?:glial[ -]+)?cells?|glia)\b/giu,'米勒细胞',/(?:穆勒|缪勒|穆雷|米勒)[的 ]*(?:胶质)?细胞/g],
   [/\bHenle(?:'s|’s)?[ -]+fib(?:er|re)[ -]+layer\b/gi,'亨勒纤维层'],
   [/\bHenle(?:'s|’s)?[ -]+fib(?:er|re)s?\b/gi,'亨勒纤维'],
   [/\bSchwann[ -]+cells?\b/gi,'施旺细胞'],
   [/\bastrocytes?\b/gi,'星形胶质细胞'],[/\bmicroglia(?:l[ -]+cells?)?\b/gi,'小胶质细胞'],
  ];
  if(/retin|fove|photoreceptor|ganglion|bipolar|müller|muller/i.test(value))definitions.push(
   [/\bretinal[ -]+pigment[ -]+epithelium\b/gi,'视网膜色素上皮'],
   [/\bganglion[ -]+cell[ -]+layer\b/gi,'神经节细胞层'],
   [/\binner[ -]+nuclear[ -]+layer\b/gi,'内核层'],[/\bouter[ -]+nuclear[ -]+layer\b/gi,'外核层'],
   [/\binner[ -]+plexiform[ -]+layer\b/gi,'内丛状层'],[/\bouter[ -]+plexiform[ -]+layer\b/gi,'外丛状层'],
   [/\bamacrine[ -]+cells?\b/gi,'无长突细胞'],[/\bbipolar[ -]+cells?\b/gi,'双极细胞'],[/\bhorizontal[ -]+cells?\b/gi,'水平细胞'],
   [/\bfoveola\b/gi,'中央凹小窝'],[/\bfovea\b/gi,'中央凹'],
  );
  const entries=[],traditional=text=>text.replace(/[细胶纤维层视网节丛极长]/g,x=>({'细':'細','胶':'膠','纤':'纖','维':'維','层':'層','视':'視','网':'網','节':'節','丛':'叢','极':'極','长':'長'}[x]));
  const mark=(source,term,alias)=>{const index=entries.length;entries.push({source,term:target==='zh-Hant'?traditional(term):term,alias});return '[PVG'+String(index).padStart(3,'0')+']';};
  let text=value.normalize('NFC');for(const [pattern,term,alias] of definitions)text=text.replace(pattern,source=>mark(source,term,alias));
  text=text.replace(/(?<![\p{L}\p{N}_.])((?:\d{1,3}(?:[,，]\d{3})+|\d+)(?:\.\d+)?)\s*[‒–—−~～-]\s*((?:\d{1,3}(?:[,，]\d{3})+|\d+)(?:\.\d+)?)(?![\p{L}\p{N}_]|\.\d)/gu,(source,a,b,at)=>{
   if(/(?:fig(?:ure)?s?\.?|table|version)\s*$/i.test(text.slice(Math.max(0,at-20),at))||/[-/]\d/.test(text.slice(at+source.length,at+source.length+4)))return source;
   return mark(source,a+'～'+b);
  });
  return {text,restore:translated=>{
   let result=translated.replace(/[\[（⟦]?\s*PVG\s*_?\s*(\d{3})\s*[\]）⟧]?/gi,(marker,index)=>entries[Number(index)]?.term||marker);
   for(const entry of entries){result=result.replaceAll(entry.source,entry.term);if(entry.alias)result=result.replace(entry.alias,entry.term);}
   return result.replace(/\[\s*PVG[^\]]*$/i,'').trim();
  }};
 },
 initTranslation() {this.translationCache=new Map();this.translationJobs=new Map();this.translationTicket=0;},
 toggleTranslation(enabled) {
  this.set('translation',enabled??!this.get('translation',true));this.refreshTranslation();this.syncSettings();
 },
 refreshTranslation() {
  const enabled=this.get('translation',true),c=this.caption,ticket=++this.translationTicket;
  if(c){c.suppressed=!enabled;c.box.style.opacity=enabled&&!c.occluded?'1':'0';c.box.style.pointerEvents=enabled&&!c.occluded?'':'none';c.controls?.sync();c.occlusion?.check();}
  if(!enabled||!this.currentUnit||!this.currentReader||!['playing','paused','loading'].includes(this.state)||this.session?.sample)return;
  const reader=this.currentReader,unit=this.currentUnit,generation=this.generation;
  this.translate(unit.translationText||unit.text).then(result=>{if(ticket===this.translationTicket&&generation===this.generation&&this.get('translation',true))this.showTranslation(reader,unit,result.text,result.source);},error=>{if(ticket===this.translationTicket&&generation===this.generation)this.showTranslation(reader,unit,error.message||'翻译暂不可用');});
 },
 async translate(text,sourceLanguage=null,options={}) {
  text=PaperVoiceCore.speechText(text);
  sourceLanguage=sourceLanguage||this.activeSpeechLanguage||this.speechLanguage?.()||'en';
  const provider=options.provider||this.get('translationProvider','tencenttransmart'),target=options.target||this.get('translationTarget','zh-Hans'),key=provider+'\0'+sourceLanguage+'\0'+target+'\0'+text;
  const glossary=this.translationTerms(text,target),requestText=glossary.text;
  if(provider==='llm'){const partial=options.onPartial;const result=await this.translateLLM(requestText,sourceLanguage,{...options,target,onPartial:partial?text=>partial(glossary.restore(text)):undefined});return {...result,text:glossary.restore(result.text)};}
  if(provider==='tencenttransmart'&&target==='zh-Hant')throw new Error('腾讯通道暂不提供繁体中文，请选择微软或 Google');
  const code=provider==='tencenttransmart'?(target==='zh-Hans'?'zh':target):provider==='google'?({'zh-Hans':'zh-CN','zh-Hant':'zh-TW'}[target]||target):target;
  if(this.translationCache.has(key))return this.translationCache.get(key);
  if(this.translationJobs.has(key))return this.translationJobs.get(key);
  const serviceName={bing:'微软翻译',tencenttransmart:'腾讯交互翻译',google:'Google 翻译'}[provider];
  const task=(async()=>{
   let result;
   if(Zotero.PDFTranslate?.api?.translate){
    let timeout;
    try{
     const translated=await Promise.race([Zotero.PDFTranslate.api.translate(requestText,{pluginID:this.id,service:provider,langfrom:sourceLanguage,langto:code}),new Promise((_,reject)=>{timeout=this.host.setTimeout(()=>reject(new Error('翻译超时')),12000);})]);
     if(typeof translated?.result==='string' && translated.result.trim() && translated.status!=='error' && !/^\s*\[Request Error\]/i.test(translated.result))result={text:translated.result,source:serviceName+' · Translate for Zotero'};
    }catch(_){}finally{if(timeout)this.host.clearTimeout(timeout);}
   }
   if(!result){
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0'};
    let translated;
    if(provider==='google'){
      const endpoint='https://translate.googleapis.com/translate_a/single?client=gtx&sl='+encodeURIComponent(sourceLanguage)+'&tl='+encodeURIComponent(code)+'&dt=t';
      headers['Content-Type']='application/x-www-form-urlencoded';
      let response;
      for(let attempt=0;attempt<2;attempt++){
       try{response=await Zotero.HTTP.request('POST',endpoint,{headers,body:'q='+encodeURIComponent(requestText),responseType:'json',timeout:12000,errorDelayMax:0,logBody:false});break;}
       catch(error){
        const transient=error.status===0||/timed? ?out|timeout|network/i.test(String(error));
        if(attempt||!transient)throw new Error('Google 暂时连接失败，请重试或切换腾讯 / 微软翻译');
       }
      }
      translated=response.response?.[0]?.map(x=>x[0]).join('');
    }else{
      const endpoint=provider==='bing'?'https://edge.microsoft.com/translate/translatetext?from='+encodeURIComponent(sourceLanguage)+'&to='+encodeURIComponent(code)+'&isEnterpriseClient=false':'https://transmart.qq.com/api/imt';
      const body=provider==='bing'?[requestText]:{header:{fn:'auto_translation',client_key:'browser-chrome-131.0.0-Mac OS-paper-voice'},type:'plain',model_category:'normal',source:{lang:sourceLanguage,text_list:[requestText]},target:{lang:code}};
      if(provider==='tencenttransmart')headers.Referer='https://transmart.qq.com/zh-CN/index';
      const response=await Zotero.HTTP.request('POST',endpoint,{body:JSON.stringify(body),headers,responseType:'json',timeout:12000,errorDelayMax:0,logBody:false});
      translated=provider==='bing'?response.response?.[0]?.translations?.[0]?.text:response.response?.auto_translation?.join('\n');
    }
    if(typeof translated!=='string' || !translated.trim())throw new Error('免费翻译服务暂不可用，请更换服务或译文语言');
    result={text:translated.trim(),source:serviceName+' · 免费通道'};
   }
   result={...result,text:glossary.restore(result.text)};
   if(this.translationCache.size>=300)this.translationCache.delete(this.translationCache.keys().next().value);
   this.translationCache.set(key,result);return result;
  })();
  this.translationJobs.set(key,task);
  try{return await task;}finally{this.translationJobs.delete(key);}
 },
 selectionAnchor(reader,position) {
  // Zotero supplies PDF-space selection rectangles. Resolve the actual selected
  // glyph, not the first matching word/letter elsewhere on the page.
  try{
   if(!Number.isInteger(position?.pageIndex)||!position.rects?.length)return null;
   const win=reader._internalReader?._primaryView?._iframeWindow,doc=win?.document;
   const page=doc?.querySelector(`.page[data-page-number="${position.pageIndex+1}"]`),view=win?.PDFViewerApplication?.pdfViewer?.getPageView(position.pageIndex);
   if(!page||!view?.viewport)return null;
   const bounds=page.getBoundingClientRect(),targets=position.rects.map(rect=>{
    const [x1,y1,x2,y2]=view.viewport.convertToViewportRectangle(Components.utils.cloneInto(Array.from(rect),win));
    return {left:bounds.left+page.clientLeft+Math.min(x1,x2),right:bounds.left+page.clientLeft+Math.max(x1,x2),top:bounds.top+page.clientTop+Math.min(y1,y2),bottom:bounds.top+page.clientTop+Math.max(y1,y2)};
   });
   const overlaps=(r,t)=>Math.min(r.right,t.right)-Math.max(r.left,t.left)>Math.min(r.width,t.right-t.left)*.25&&Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top)>Math.min(r.height,t.bottom-t.top)*.4;
   let offset=0;
   for(const span of page.querySelectorAll('.textLayer span[role="presentation"]')){
    const text=span.textContent||'',targetsHere=targets.filter(t=>overlaps(span.getBoundingClientRect(),t));
    for(let i=0;i<text.length;i++){
     const length=PaperVoiceCore.anchorText(text[i]).length;
     if(targetsHere.length&&span.firstChild?.nodeType===3){
      const range=doc.createRange();range.setStart(span.firstChild,i);range.setEnd(span.firstChild,i+1);
      if(targetsHere.some(t=>overlaps(range.getBoundingClientRect(),t)))return Math.max(0,offset-(length?0:1));
     }
     offset+=length;
    }
   }
  }catch(_){}
  return null;
 },
 findSentence(reader,unit) {
  const view=reader._internalReader?._primaryView,doc=view?._iframeWindow?.document;
  if(!doc)return null;
  const pages=unit.pageIndex!==null && unit.pageIndex!==undefined?[doc.querySelector(`.page[data-page-number="${unit.pageIndex+1}"]`)]:Array.from(doc.querySelectorAll('.page'));
  const normalize=s=>s.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
  const needle=normalize(unit.text);if(!needle)return null;
  for(const page of pages.filter(Boolean)){
   const spans=Array.from(page.querySelectorAll('.textLayer span[role="presentation"]')).filter(x=>x.textContent);
   let joined='',positions=[];
   for(const span of spans)for(let offset=0;offset<span.textContent.length;offset++){
    const char=normalize(span.textContent[offset]);joined+=char;for(let k=0;k<char.length;k++)positions.push({span,offset});
   }
   let index=joined.indexOf(needle,Number.isInteger(unit.anchorOffset)?unit.anchorOffset:0);
   if(index<0)index=joined.indexOf(needle);if(index<0)continue;
   const a=positions[index],b=positions[index+needle.length-1];
   const range=doc.createRange();range.setStart(a.span.firstChild,a.offset);range.setEnd(b.span.firstChild,b.offset+1);
   const rects=Array.from(range.getClientRects()).filter(x=>x.width>0&&x.height>0);
   if(rects.length)return {view,doc,page,spans,rects,first:a.span,range};
  }
  return null;
 },
 readingBlocks(match) {
  // DOM reading order can jump from the foot of the left column to the top of
  // the right. Treat those as separate anchors, not one tall bounding box.
  const blocks=[];
  for(const rect of match.rects){
   const block=blocks.at(-1),previous=block?.rects.at(-1);
   const gap=block?Math.max(rect.left-block.right,block.left-rect.right):0;
   const lineHeight=Math.max(rect.height,previous?.height||0);
   const columnJump=block&&gap>lineHeight&&
    (rect.top<previous.top-lineHeight*.6||Math.abs(rect.top-previous.top)<lineHeight*.5&&gap>lineHeight*2);
   if(!block||columnJump)blocks.push({left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,rects:[rect]});
   else {block.left=Math.min(block.left,rect.left);block.right=Math.max(block.right,rect.right);block.top=Math.min(block.top,rect.top);block.bottom=Math.max(block.bottom,rect.bottom);block.rects.push(rect);}
  }
  return blocks;
 },
 readingColumn(match,block) {
  const h=Math.max(1,...block.rects.map(r=>r.height)),rows=[];
  // Use complete text-layer lines around the active passage, rather than the
  // selected words or a fixed fraction of the page. This also handles mixed layouts.
  for(const span of match.spans||[]){
   for(const r of span.getClientRects()){
    if(!r.width||r.height<h*.65||r.height>h*1.45||r.bottom<block.top-h*10||r.top>block.bottom+h*10)continue;
    let row=rows.find(x=>Math.abs(x.y-(r.top+r.bottom)/2)<h*.4);
    if(!row){row={y:(r.top+r.bottom)/2,rects:[]};rows.push(row);}row.rects.push(r);
   }
  }
  const lines=[];
  for(const row of rows){
   row.rects.sort((a,b)=>a.left-b.left);let line=null;
   for(const r of row.rects){
    if(!line||r.left-line.right>h*1.35){line={left:r.left,right:r.right,top:r.top,bottom:r.bottom,row};lines.push(line);}
    else {line.right=Math.max(line.right,r.right);line.top=Math.min(line.top,r.top);line.bottom=Math.max(line.bottom,r.bottom);}
   }
  }
  const touches=(line,r)=>line.left<r.right+1&&line.right>r.left-1&&line.top<r.bottom&&line.bottom>r.top;
  const anchored=lines.filter(line=>block.rects.some(r=>touches(line,r)));
  const seed=anchored.sort((a,b)=>(b.right-b.left)-(a.right-a.left))[0];
  if(!seed)return {left:block.left,right:block.right};
  const aligned=lines.filter(line=>Math.abs(line.left-seed.left)<h*2.5);
  let leftLimit=-Infinity,rightLimit=Infinity;
  for(const line of aligned){
   for(const other of lines){
    if(other.row!==line.row)continue;
    if(other.right<line.left-h*1.35)leftLimit=Math.max(leftLimit,other.right+h*.5);
    if(other.left>line.right+h*1.35)rightLimit=Math.min(rightLimit,other.left-h*.5);
   }
  }
  // Full-width headings above a multi-column body must not widen its caption.
  const column=aligned.filter(line=>line.left>=leftLimit&&line.right<=rightLimit);
  if(!column.length)return {left:seed.left,right:seed.right};
  return {left:Math.min(...column.map(line=>line.left)),right:Math.max(...column.map(line=>line.right))};
 },
 async highlightSentence(reader,unit,generation) {
  const target={...unit,text:unit.highlightText||unit.sentenceText||unit.text,anchorOffset:unit.highlightOffset??unit.sentenceOffset},previous=this.sentenceHighlight;
  if(previous?.layer?.isConnected&&previous.reader===reader&&previous.unit.pageIndex===target.pageIndex&&previous.unit.text===target.text&&previous.unit.anchorOffset===target.anchorOffset){
   previous.focusUnit=unit;const focus=this.findSentence(reader,unit);if(focus)await this.focusReadingPosition(focus);return;
  }
  this.clearSentenceHighlight();
  if(!this.get('translation',true))this.showTranslation(reader,unit,'');
  const active={markers:[],reader,unit:target,focusUnit:unit};
  this.sentenceHighlight=active;
  let match;
  // Navigate each spoken unit when its page is absent/offscreen, including selected passages.
  const view=reader._internalReader?._primaryView,viewer=view?._iframeWindow?.PDFViewerApplication?.pdfViewer;
  if(Number.isInteger(unit.pageIndex)&&viewer?.currentPageNumber!==unit.pageIndex+1)await reader.navigate({pageIndex:unit.pageIndex});
  for(let attempt=0;attempt<40;attempt++){
   if(this.sentenceHighlight!==active||generation!==this.generation||this.dead)return;
   match=this.findSentence(reader,active.unit)||this.findSentence(reader,unit);if(match)break;
   await Zotero.Promise.delay(75);
  }
  if(!match||this.sentenceHighlight!==active)return;
  const win=match.doc.defaultView;active.win=win;
  const focus=this.findSentence(reader,unit)||match;
  await this.focusReadingPosition(focus);
  if(this.sentenceHighlight!==active||generation!==this.generation||this.dead)return;
  const draw=()=>{
   active.raf=undefined;if(this.sentenceHighlight!==active)return;
   const current=this.findSentence(reader,active.unit)||this.findSentence(reader,active.focusUnit);
   // PDF.js can temporarily remove the text layer during zoom. Preserve the
   // page-anchored geometry until the new layer is ready, rather than flashing.
   if(!current)return;
   const page=current.page,bounds=page.getBoundingClientRect();
   const scaleX=bounds.width/page.offsetWidth||1,scaleY=bounds.height/page.offsetHeight||1;
   if(!active.layer||active.layer.parentElement!==page){
    const layer=current.doc.createElement('div');layer.dataset.paperVoice='highlight-layer';
    layer.style.cssText='pointer-events:none;position:absolute;inset:0;z-index:8;overflow:hidden;';
    page.append(layer);active.layer?.remove();active.layer=layer;active.markers=[];
   }
   active.rects=current.rects;
   const rects=current.rects.filter((rect,i,all)=>!all.slice(0,i).some(r=>Math.abs(r.left-rect.left)<.1&&Math.abs(r.top-rect.top)<.1&&Math.abs(r.width-rect.width)<.1&&Math.abs(r.height-rect.height)<.1));
   for(let i=0;i<rects.length;i++){
    const rect=rects[i];let marker=active.markers[i];
    if(!marker){marker=current.doc.createElement('div');marker.dataset.paperVoice='sentence-highlight';active.layer.append(marker);active.markers.push(marker);}
    const style=`pointer-events:none;position:absolute;left:${(rect.left-bounds.left)/scaleX-page.clientLeft-1}px;top:${(rect.top-bounds.top)/scaleY-page.clientTop}px;width:${rect.width/scaleX+2}px;height:${rect.height/scaleY}px;background:${this.theme?.().highlight||'#e3b84138'};border-radius:3px;`;
    if(marker.getAttribute('style')!==style)marker.setAttribute('style',style);
   }
   while(active.markers.length>rects.length)active.markers.pop().remove();
  };
  active.redraw=()=>{if(active.raf===undefined)active.raf=win.requestAnimationFrame(draw);};
  // The highlight lives on the PDF page and therefore scrolls with the text
  // without any event-driven removal or viewport-coordinate repositioning.
  win.addEventListener('resize',active.redraw);
  const viewerRoot=reader._internalReader?._primaryView?._iframeWindow?.PDFViewerApplication?.pdfViewer?.viewer;
  if(viewerRoot){
   active.observer=new this.host.MutationObserver(records=>{
    if(records.some(r=>r.target.closest?.('.textLayer')||r.type==='attributes'&&r.target.matches?.('.page')||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('.page,.textLayer')||n.querySelector?.('.textLayer')))))active.redraw();
   });
   active.observer.observe(viewerRoot,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  }
  draw();
 },
 async focusReadingPosition(match) {
  const win=match.view._iframeWindow,viewer=win.PDFViewerApplication?.pdfViewer;
  const container=viewer?.container||match.doc.scrollingElement;if(!container)return;
  const bounds=container.getBoundingClientRect(),height=container.clientHeight||win.innerHeight,width=container.clientWidth||win.innerWidth;
  const block=this.readingBlocks(match)[0],top=block.top-bounds.top;
  const left=block.left-bounds.left,right=block.right-bounds.left;
  const targetLeft=left<width*.08||right>width*.92?Math.max(0,container.scrollLeft+left-width*.12):container.scrollLeft;
  // Keep the spoken passage near the upper-middle, leaving space for following lines.
  // A comfort band avoids tiny scrolls at every sentence and permits ordinary browsing.
  if(top<height*.22||top>height*.50||block.bottom-bounds.top>height*.78||targetLeft!==container.scrollLeft){
   const target=container.scrollTop+top-height*.34;
   const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   const distant=Math.abs(target-container.scrollTop)>height*.6||Math.abs(targetLeft-container.scrollLeft)>width*.35;
   this.caption?.layout();
   // Zotero's privileged/plugin realm must pass a content-realm options dictionary.
   container.scrollTo(Components.utils.cloneInto({top:Math.max(0,target),left:targetLeft,behavior:reduced||distant?'instant':'smooth'},win));
   // Keep the source in place before audio begins, but bound scrolling to a
   // brief sentence transition instead of adding a half-second playback gap.
   const generation=this.generation;
   for(let i=0;i<4;i++){
    await Zotero.Promise.delay(40);
    if(this.generation!==generation||this.dead)return;
    const expectedTop=Math.max(0,Math.min(target,container.scrollHeight-height)),expectedLeft=Math.max(0,Math.min(targetLeft,container.scrollWidth-width));
    if(Math.abs(container.scrollTop-expectedTop)<1&&Math.abs(container.scrollLeft-expectedLeft)<1)break;
   }
   if(this.generation!==generation||this.dead)return;
   container.scrollTo(Components.utils.cloneInto({top:Math.max(0,target),left:targetLeft,behavior:'instant'},win));
   await Zotero.Promise.delay(40);
  }
 },
 clearSentenceHighlight() {
  const active=this.sentenceHighlight;this.sentenceHighlight=null;if(!active)return;
  if(active.win){active.win.removeEventListener('resize',active.redraw);if(active.raf!==undefined)active.win.cancelAnimationFrame(active.raf);}
  active.observer?.disconnect();active.layer?.remove();active.markers.forEach(marker=>marker.remove());
 },
 watchCaptionOcclusion(c) {
  const selector='.cl-floating,.cl-native-host,.cl-summary,.cl-root,.cl-dialog,.selection-popup',docs=new Set([c.box.ownerDocument,Zotero.getMainWindow()?.document]),observers=[],hooks=[];let raf=null,disposed=false;
  const rect=el=>{const r=el.getBoundingClientRect(),w=el.ownerDocument.defaultView,x=w.mozInnerScreenX||0,y=w.mozInnerScreenY||0;return {left:r.left+x,right:r.right+x,top:r.top+y,bottom:r.bottom+y,width:r.width,height:r.height};};
  const overlaps=(a,b)=>a.width>0&&a.height>0&&b.width>0&&b.height>0&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
  const check=()=>{
   if(disposed||this.caption!==c)return;
   const areas=c.suppressed?[]:[rect(c.box)];if(!c.tools.hidden)areas.push(rect(c.tools),...Array.from(c.tools.querySelectorAll('.pv-caption-popup:not([hidden])'),rect));
   let blocked=false;
   for(const d of docs){if(!d?.defaultView||d.defaultView.closed)continue;for(const el of d.querySelectorAll(selector)){
    if(el.closest('[hidden],[aria-hidden=true]')||el.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})===false)continue;const css=d.defaultView.getComputedStyle(el);if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0)continue;
    if(areas.some(a=>overlaps(a,rect(el)))){blocked=true;break;}
   }if(blocked)break;}
   if(c.occluded===blocked)return;c.occluded=blocked;if(blocked){c.sourceHovered=false;c.pointerInside=false;this.releaseCaptionPause?.(c.reader);}
   for(const el of [c.box,c.tools]){el.dataset.occluded=String(blocked);el.style.opacity=blocked||el===c.box&&c.suppressed?'0':'1';el.style.pointerEvents=blocked||el===c.box&&c.suppressed?'none':'';el.inert=blocked;el.setAttribute('aria-hidden',String(blocked));}
  };
  const schedule=()=>{if(raf!==null||disposed)return;raf=c.box.ownerDocument.defaultView.requestAnimationFrame(()=>{raf=null;check();});};
  for(const d of docs){if(!d?.defaultView)continue;const w=d.defaultView,observer=new w.MutationObserver(records=>{if(records.some(r=>r.target.closest?.(selector)||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches(selector)||n.querySelector(selector)))))schedule();});observer.observe(d.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden','aria-hidden']});observers.push(observer);
   for(const event of ['resize','scroll','transitionend','animationend']){w.addEventListener(event,schedule,true);hooks.push(()=>w.removeEventListener(event,schedule,true));}
  }
  c.occlusion={check,dispose(){disposed=true;if(raf!==null)c.box.ownerDocument.defaultView.cancelAnimationFrame(raf);for(const o of observers)o.disconnect();for(const off of hooks)off();}};
 },
 createCaptionControls(c) {
  const doc=c.box.ownerDocument,win=doc.defaultView,make=(tag,cls)=>{const el=doc.createElement(tag);el.className=cls;return el;};
  const tools=make('div','pv-caption-tools');tools.hidden=true;tools.setAttribute('role','toolbar');
  const style=make('style','');style.textContent=`
   .pv-caption-tools{position:absolute;z-index:21;display:flex;flex-direction:column;align-items:center;gap:4px;box-sizing:border-box;padding:5px 7px;color:var(--pv-ink,#253c33);font:12px/1.4 system-ui,sans-serif;isolation:isolate;transition:opacity 160ms ease}
   .pv-caption-tools[hidden],.pv-caption-tools [hidden]{display:none!important}
   .pv-caption-tools-row,.pv-caption-tools-group{display:flex;align-items:center;gap:2px}
   .pv-caption-tools-row{display:grid;grid-template-columns:repeat(8,var(--pv-caption-button,28px));gap:2px}.pv-caption-modes{display:contents}.pv-caption-modes>button:nth-child(1){grid-column:1}.pv-caption-modes>button:nth-child(2){grid-column:2}.pv-caption-modes>button:nth-child(3){grid-column:3}.pv-caption-modes>button:nth-child(4){grid-column:4}.pv-caption-tools-row>.pv-caption-language-tools{grid-column:7}.pv-caption-tools-row>[data-caption-action=display]{grid-column:8}
   .pv-caption-tools button{appearance:none;box-sizing:border-box;flex:none;display:flex;align-items:center;justify-content:center;position:relative;width:var(--pv-caption-button,28px);height:30px;margin:0;padding:3px;border:0;border-radius:6px;background:transparent;color:inherit;cursor:pointer}
   .pv-caption-tools button:is(:hover,:focus-visible),.pv-caption-tools button[aria-pressed=true]{background:color-mix(in srgb,var(--pv-accent,#386c59) 14%,transparent);color:var(--pv-accent,#386c59)}
   .pv-caption-tools button:focus-visible{outline:1px solid currentColor;outline-offset:-1px}
   .pv-caption-control-icon{display:block;width:19px;height:19px;background:currentColor;mask:var(--pv-control-icon) center/contain no-repeat;pointer-events:none}
   .pv-caption-tools .pl-flag{display:block;width:22px;height:15px;object-fit:contain;pointer-events:none}
   .pv-caption-language-tools,.pv-caption-repeat-host{position:relative}
   .pv-caption-popup{box-sizing:border-box;position:absolute;z-index:3;display:flex;gap:2px;padding:5px;background:transparent;scrollbar-width:none}
   .pv-caption-language-menu{right:-2px;padding:5px 2px;bottom:100%;display:grid;grid-template-columns:repeat(2,var(--pv-caption-button,28px));overflow-y:auto;max-height:300px}.pv-caption-language-menu[data-spoken=true]{grid-template-columns:var(--pv-caption-button,28px)}
   .pv-caption-repeat-menu{left:50%;bottom:100%;transform:translateX(-50%);flex-direction:column}
   .pv-caption-voice-menu{flex-direction:row;max-width:calc(100vw - 24px);overflow-x:auto}
   .pv-caption-voice-menu button{width:30px;height:30px}
   .pv-caption-repeat-icon{width:24px;height:24px;pointer-events:none}
   .pv-caption-repeat-icon text{fill:currentColor;stroke:none;font:600 10px system-ui,sans-serif;text-anchor:middle;dominant-baseline:central}
   .pv-caption-tools .pl-voice-symbol{position:relative;display:block;width:26px;height:26px;flex:none}
   .pv-caption-tools .pl-voice-symbol>.pl-flag{position:absolute;left:0;top:2px;width:24px;height:16px;border-radius:2px;object-fit:cover}
   .pv-caption-tools .pl-voice-avatar{position:absolute;z-index:1;right:0;bottom:0;width:17px;height:17px;background-repeat:no-repeat;border-radius:50%}
   .pv-caption-tools .pv-caption-audio-badge{position:absolute;right:0;bottom:0;width:10px;height:10px;border-radius:3px;color:var(--pv-accent,#386c59)}
   .pv-caption-audio-badge>.pv-caption-control-icon{width:10px;height:10px}
   .pv-caption-connected-surface{position:absolute;z-index:-1;pointer-events:none;filter:drop-shadow(0 5px 8px #1827381a)}
   .pv-caption-connected-fill{position:absolute;inset:0;background-color:var(--pv-paper);background-image:linear-gradient(var(--pv-image-mask),var(--pv-image-mask)),var(--pv-art);background-size:cover;background-position:center;opacity:var(--pv-art-opacity,.88);backdrop-filter:blur(22px) saturate(135%)}
   .pv-caption-connected-rim{position:absolute;inset:0;width:100%;height:100%;overflow:visible;fill:none;stroke:var(--pv-glass-line);stroke-width:1}
   @media(prefers-reduced-motion:reduce){.pv-caption-tools *{animation:none!important;transition:none!important}}
  `;
  tools.append(style);c.box.parentElement.append(tools);this.applyTheme?.(tools);c.tools=tools;
  // Match the caption's quiet artwork mask rather than the stronger settings mask.
  tools.style.setProperty('--pv-image-mask',c.box.style.getPropertyValue('--pv-image-mask'));
  const surface=make('div','pv-caption-connected-surface'),fill=make('div','pv-caption-connected-fill'),svg=doc.createElementNS('http://www.w3.org/2000/svg','svg'),rim=doc.createElementNS('http://www.w3.org/2000/svg','path'),guides=doc.createElementNS('http://www.w3.org/2000/svg','path');guides.dataset.captionGuides='true';svg.setAttribute('class','pv-caption-connected-rim');svg.append(rim,guides);surface.append(fill,svg);tools.append(surface);
  const icon=name=>{const el=make('span','pv-caption-control-icon');el.setAttribute('aria-hidden','true');el.style.setProperty('--pv-control-icon',`url("${this.assetURI}icons/${name}.svg")`);return el;};
  const repeatIcon=(scope,count)=>{const el=doc.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('viewBox','0 0 24 24');el.setAttribute('class','pv-caption-repeat-icon');el.setAttribute('aria-hidden','true');const path=doc.createElementNS(el.namespaceURI,'path');path.setAttribute('d',scope==='sentence'?'M19 6H7a5 5 0 0 0-5 5M5 18h12a5 5 0 0 0 5-5M16 3l3 3-3 3M8 15l-3 3 3 3':'M19 5H7a5 5 0 0 0-5 5M5 19h12a5 5 0 0 0 5-5M16 2l3 3-3 3M8 16l-3 3 3 3M9 8h5M10 16h5');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.5');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');const text=doc.createElementNS(el.namespaceURI,'text');text.setAttribute('x','12');text.setAttribute('y','12');text.textContent=count===0?'∞':String(count);el.append(path,text);return el;};
  const buttons=[],button=(parent,name,label,action)=>{const b=make('button','');b.type='button';b.dataset.label=label;if(name)b.append(icon(name));b.onclick=e=>{e.preventDefault();e.stopPropagation();c.retainControls=true;action(e);};parent.append(b);buttons.push(b);return b;};
  const transport=make('div','pv-caption-tools-group');tools.append(transport);
  const repeatMenus=[];
  for(const [scope,prefix,names] of [['sentence','句',['chevron-left',null,'chevron-right']],['paragraph','段',['chevrons-left',null,'chevrons-right']]])for(const [i,delta] of [-1,0,1].entries()){
   const host=delta===0?make('div','pv-caption-repeat-host'):transport;if(delta===0)transport.append(host);
   const b=button(host,names[i],delta<0?'上一'+prefix:delta>0?'下一'+prefix:'重读当前'+prefix,()=>delta===0?this.replayScope(scope,this.captionRepeatCounts?.[scope]??1,c.reader):this.navigateScope(delta,c.reader,scope));b.dataset.captionScope=scope;b.dataset.delta=delta;
   if(delta===0){const popup=make('div','pv-caption-popup pv-caption-repeat-menu');popup.hidden=true;popup.setAttribute('role','group');host.append(popup);b.setAttribute('aria-haspopup','true');b.setAttribute('aria-expanded','false');for(const count of [1,3,5,0]){const choice=button(popup,null,'重读当前'+prefix,()=>{this.captionRepeatCounts||={};this.captionRepeatCounts[scope]=count;sync();this.replayScope(scope,count,c.reader);});choice.dataset.repeatCount=String(count);choice.dataset.repeatScope=scope;choice.append(repeatIcon(scope,count));}repeatMenus.push({host,popup,b,scope});}
  }
  const pause=button(transport,'pause','暂停',()=>this.primary(c.reader));pause.dataset.captionAction='pause';button(transport,'square','停止',()=>this.stop()).dataset.captionAction='stop';
  const secondRow=make('div','pv-caption-tools-row'),modes=make('div','pv-caption-tools-group pv-caption-modes');tools.append(secondRow);secondRow.append(modes);
  for(const mode of PaperVoiceCore.modes){const b=button(modes,mode.icon,mode.short,()=>this.setMode(mode.id));b.dataset.captionMode=mode.id;}
  const languageHost=make('div','pv-caption-tools-group pv-caption-language-tools');secondRow.append(languageHost);
  const language=button(languageHost,null,'译文语言',e=>this.quickTranslationClick(e));language.dataset.captionAction='translation';language.setAttribute('aria-haspopup','true');language.setAttribute('aria-expanded','false');
  const flag=make('span','pv-caption-language-symbol');const badge=make('span','pv-caption-audio-badge');badge.append(icon('headphones'));badge.setAttribute('aria-hidden','true');language.append(flag,badge);language.ondblclick=e=>{e.preventDefault();e.stopPropagation();this.quickTranslationDoubleClick();};
  const display=button(secondRow,'eye','显示译文',()=>this.toggleTranslation(!this.get('translation',true)));display.dataset.captionAction='display';
  const menu=make('div','pv-caption-popup pv-caption-language-menu');menu.hidden=true;menu.dataset.side='above';menu.setAttribute('role','group');languageHost.append(menu);
  const voices=make('div','pv-caption-popup pv-caption-voice-menu');voices.hidden=true;voices.setAttribute('role','group');tools.append(voices);
  let timer=null,exitTimer=null,popupTimer=null,voiceTimer=null,voiceAnchor=null,disposed=false,surfaceKey=null;
  const events=[],listen=(el,name,fn)=>{el.addEventListener(name,fn);events.push(()=>el.removeEventListener(name,fn));};
  const engaged=el=>!!el&&(el.matches(':hover')||el.contains(doc.activeElement)&&doc.activeElement.matches(':focus-visible'));
  const closeVoices=()=>{win.clearTimeout(voiceTimer);voices.hidden=true;voiceAnchor?.setAttribute('aria-expanded','false');voiceAnchor=null;};
  const closePopups=()=>{win.clearTimeout(popupTimer);closeVoices();menu.hidden=true;language.setAttribute('aria-expanded','false');for(const x of repeatMenus){x.popup.hidden=true;x.b.setAttribute('aria-expanded','false');}drawSurface();};
  const drawSurface=()=>{
   if(tools.hidden||disposed)return;const bar=tools.getBoundingClientRect(),rects=[{left:0,top:0,right:bar.width,bottom:bar.height}];
   for(const el of [menu,voices,...repeatMenus.map(x=>x.popup)])if(!el.hidden){const r=el.getBoundingClientRect();rects.push({left:r.left-bar.left,top:r.top-bar.top,right:r.right-bar.left,bottom:r.bottom-bar.top});}
   const key=JSON.stringify(rects);if(key===surfaceKey)return;surfaceKey=key;
   const left=Math.min(...rects.map(r=>r.left)),top=Math.min(...rects.map(r=>r.top)),right=Math.max(...rects.map(r=>r.right)),bottom=Math.max(...rects.map(r=>r.bottom)),path=PaperVoiceUI.connectedSurfacePath(rects.map(r=>({left:r.left-left,top:r.top-top,right:r.right-left,bottom:r.bottom-top})),10);
   surface.style.cssText=`left:${left}px;top:${top}px;width:${right-left}px;height:${bottom-top}px`;fill.style.clipPath='path("'+path+'")';rim.setAttribute('d',path);svg.setAttribute('viewBox',`0 0 ${right-left} ${bottom-top}`);
   const divider=secondRow.getBoundingClientRect().top-bar.top-2,y=divider-top;let lines=`M${10-left} ${y} H${bar.width-10-left}`;if(!menu.hidden){const m=menu.getBoundingClientRect(),a=m.left-bar.left-left,b=m.right-bar.left-left;lines+=` M${a} ${-top} V${y-5} Q${a} ${y} ${a-5} ${y} M${b} ${-top} V${y-5} Q${b} ${y} ${b+5} ${y}`;}guides.setAttribute('d',lines);
  };
  const positionVoices=()=>{if(!voiceAnchor||voices.hidden)return;const a=voiceAnchor.getBoundingClientRect(),bar=tools.getBoundingClientRect(),fr=c.frame.getBoundingClientRect();voices.style.maxWidth=Math.max(36,a.left-fr.left-8)+'px';voices.style.left=(a.left-bar.left-voices.getBoundingClientRect().width-2)+'px';voices.style.top=(a.top-bar.top-5)+'px';};
  const layout=()=>{
   if(c.box.style.visibility==='hidden'||!c.box.isConnected){hide();return;}
   const parent=tools.parentElement.getBoundingClientRect(),fr=c.frame.getBoundingClientRect(),source=c.suppressed&&c.sourceBlock;
   // A hidden/empty caption has no useful width. Anchor directly to the active
   // source block, translating PDF viewport coordinates into the reader overlay.
   const b=source?{left:fr.left+source.left,right:fr.left+source.right,bottom:fr.top+source.bottom}:c.box.getBoundingClientRect();
   tools.style.setProperty('--pv-caption-button',Math.max(16,Math.min(28,(fr.width-38)/8))+'px');const width=tools.getBoundingClientRect().width;
   tools.style.left=(Math.max(fr.left+4,Math.min((b.left+b.right-width)/2,fr.right-width-4))-parent.left)+'px';tools.style.top=(b.bottom-parent.top+(source?8:-1))+'px';positionVoices();drawSurface();
  };
  const hide=()=>{win.clearTimeout(timer);closePopups();tools.hidden=true;};
  const show=()=>{win.clearTimeout(timer);if(c.box.style.visibility==='hidden')return;tools.hidden=false;layout();};
  const enter=()=>{if(c.occluded)return;c.pointerInside=true;win.clearTimeout(exitTimer);show();this.requestCaptionPause?.(c.reader);};
  const outside=()=>!c.sourceHovered&&!c.pointerInside&&!c.box.matches(':hover')&&!engaged(tools);
  const leave=e=>{if(c.box.contains(e?.relatedTarget)||tools.contains(e?.relatedTarget))return;c.pointerInside=false;win.clearTimeout(timer);win.clearTimeout(exitTimer);exitTimer=win.setTimeout(()=>{if(outside())this.releaseCaptionPause?.(c.reader);},180);timer=win.setTimeout(()=>{if(outside()){c.retainControls=false;if(c.pendingHide)this.hideTranslation();else hide();}},700);};
  const reveal=popup=>{popup.hidden=false;if(!win.matchMedia('(prefers-reduced-motion: reduce)').matches)popup.animate([{opacity:0},{opacity:1}],{duration:130,easing:'ease-out'});};
  const openVoices=b=>{
   win.clearTimeout(voiceTimer);if(!this.get('readTranslation',false))return;if(voiceAnchor===b&&!voices.hidden)return;closeVoices();voiceAnchor=b;b.setAttribute('aria-expanded','true');const code=b.dataset.captionLanguage,choice=this.translationVoiceChoices().find(x=>x.code===code);if(!choice)return;const {language:lang,voices:available}=choice;voices.replaceChildren();
   for(const v of available){const item=make('button',''),symbol=make('span','');item.type='button';item.dataset.captionVoice=v.id;item.setAttribute('aria-label',this.t(v.label));item.setAttribute('aria-pressed',String(v.id===choice.voice));PaperVoiceUI.voiceSymbol(symbol,this,v.id);item.append(symbol);item.onclick=e=>{e.preventDefault();e.stopPropagation();c.retainControls=true;this.selectTranslationVoice(code,v.id);for(const x of voices.children)x.setAttribute('aria-pressed',String(x.dataset.captionVoice===v.id));};voices.append(item);}
   reveal(voices);positionVoices();drawSurface();
  };
  const leaveVoices=()=>{win.clearTimeout(voiceTimer);voiceTimer=win.setTimeout(()=>{if(!engaged(voices)&&!engaged(voiceAnchor)){closeVoices();drawSurface();}},700);};
  const renderLanguage=(el,code,voice)=>{
   const key=voice||code;if(el.dataset.symbolKey===key)return;el.dataset.symbolKey=key;
   el.replaceChildren();delete el.dataset.voice;el.classList.remove('pl-voice-symbol');
   if(voice)PaperVoiceUI.voiceSymbol(el,this,voice);else{const img=make('img','pl-flag');img.alt='';img.src=this.flagURI(code);el.append(img);}
  };
  for(const code of ['ko','de','es','ru','zh-Hant','ja','fr','en','en-US','en-GB','zh-Hans']){const b=make('button',''),symbol=make('span','');b.type='button';b.dataset.captionLanguage=code;b.append(symbol);b.onclick=e=>{e.preventDefault();e.stopPropagation();c.retainControls=true;const choice=this.get('readTranslation',false)&&this.translationVoiceChoices().find(x=>x.code===code);if(choice)this.selectTranslationVoice(code,choice.voice);else this.setTranslationTarget(code);};listen(b,'pointerenter',()=>openVoices(b));listen(b,'pointerleave',leaveVoices);listen(b,'focusin',()=>openVoices(b));menu.append(b);}
  const openLanguages=()=>{show();win.clearTimeout(popupTimer);if(!menu.hidden)return;closePopups();menu.style.bottom=(languageHost.getBoundingClientRect().bottom-tools.getBoundingClientRect().top)+'px';menu.style.maxHeight=Math.max(35,tools.getBoundingClientRect().top-c.frame.getBoundingClientRect().top-8)+'px';reveal(menu);language.setAttribute('aria-expanded','true');drawSurface();};
  const leavePopup=host=>{win.clearTimeout(popupTimer);popupTimer=win.setTimeout(()=>{if(!engaged(host)&&!engaged(voices))closePopups();},700);};
  for(const el of [c.box,tools]){listen(el,'pointerenter',enter);listen(el,'pointerleave',leave);listen(el,'focusin',show);listen(el,'focusout',leave);}
  listen(tools,'pointerdown',e=>e.preventDefault());
  listen(tools,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closePopups();}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();const all=[...tools.querySelectorAll('button')].filter(b=>!b.closest('[hidden]')),i=all.indexOf(doc.activeElement),step=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;all[(i+step+all.length)%all.length]?.focus();}});
  listen(languageHost,'pointerenter',openLanguages);listen(languageHost,'pointerleave',()=>leavePopup(languageHost));listen(languageHost,'focusin',e=>{if(e.target.matches(':focus-visible'))openLanguages();});listen(languageHost,'focusout',()=>leavePopup(languageHost));
  listen(voices,'pointerenter',()=>{win.clearTimeout(voiceTimer);win.clearTimeout(popupTimer);});listen(voices,'pointerleave',()=>{leaveVoices();leavePopup(languageHost);});listen(voices,'focusout',()=>{leaveVoices();leavePopup(languageHost);});
  for(const x of repeatMenus){const open=()=>{show();win.clearTimeout(popupTimer);if(!x.popup.hidden)return;closePopups();reveal(x.popup);x.b.setAttribute('aria-expanded','true');drawSurface();};listen(x.host,'pointerenter',open);listen(x.host,'pointerleave',()=>leavePopup(x.host));listen(x.host,'focusin',e=>{if(e.target.matches(':focus-visible'))open();});listen(x.host,'focusout',()=>leavePopup(x.host));}
  const sync=()=>{
   tools.setAttribute('aria-label',this.t('朗读控制'));tools.style.setProperty('--pv-image-mask',c.box.style.getPropertyValue('--pv-image-mask'));
   for(const b of buttons){const count=b.dataset.repeatCount,label=this.t(b===pause?(this.state==='paused'?'继续':'暂停'):b.dataset.label)+(count===undefined?'':' · '+(count==='0'?'∞':count));b.setAttribute('aria-label',label);if(b!==language)b.title=label;}
   for(const x of repeatMenus){const count=this.captionRepeatCounts?.[x.scope]??1;if(x.b.dataset.count!==String(count)){x.b.dataset.count=String(count);x.b.replaceChildren(repeatIcon(x.scope,count));}for(const b of x.popup.children)b.setAttribute('aria-pressed',String(Number(b.dataset.repeatCount)===count));}
   for(const b of modes.children)b.setAttribute('aria-pressed',String(b.dataset.captionMode===this.get('mode','selection')));
   pause.firstChild.style.setProperty('--pv-control-icon',`url("${this.assetURI}icons/${this.state==='paused'?'play':'pause'}.svg")`);
   const spoken=this.get('readTranslation',false),target=this.get('translationTarget','zh-Hans');renderLanguage(flag,target,spoken?this.settingsVoice():null);menu.dataset.spoken=String(spoken);language.setAttribute('aria-pressed',String(spoken));display.setAttribute('aria-pressed',String(this.get('translation',true)));badge.hidden=true;
   const choices=spoken?this.translationVoiceChoices():this.translationLanguages();
   for(const b of menu.children){const code=b.dataset.captionLanguage,choice=choices.find(x=>x.code===code);b.hidden=!choice;if(!choice)continue;renderLanguage(b.firstChild,code,spoken?choice.voice:null);b.setAttribute('aria-label',this.t(this.translationLanguage(choice.target||code).label));const selected=(choice.target||code)===target&&(!spoken||choice.voice===this.settingsVoice());b.setAttribute('aria-pressed',String(selected));b.setAttribute('aria-haspopup',String(spoken));}

   if(!this.get('readTranslation',false)||voiceAnchor?.hidden)closeVoices();if(!tools.hidden)layout();
  };
  const sourceDoc=c.pdfWindow.document;let sourceFrame=null,point=null;
  const sourceMove=e=>{point={x:e.clientX,y:e.clientY};if(sourceFrame!==null)return;sourceFrame=win.requestAnimationFrame(()=>{sourceFrame=null;if(disposed||c.occluded)return;const rects=this.sentenceHighlight?.reader===c.reader?this.sentenceHighlight.markers.map(m=>m.getBoundingClientRect()):c.sourceRects||[],inside=rects.some(r=>point.x>=r.left&&point.x<=r.right&&point.y>=r.top&&point.y<=r.bottom);if(inside===!!c.sourceHovered)return;c.sourceHovered=inside;if(inside)enter();else leave();});};
  sourceDoc.addEventListener('pointermove',sourceMove,true,true);events.push(()=>sourceDoc.removeEventListener('pointermove',sourceMove,true));listen(sourceDoc,'pointerleave',()=>{c.sourceHovered=false;leave();});
  c.controls={sync,layout,hide,dispose(){hide();win.clearTimeout(exitTimer);if(sourceFrame!==null)win.cancelAnimationFrame(sourceFrame);disposed=true;for(const off of events)off();tools.remove();}};sync();
 },
 showTranslation(reader,unit,text,source='') {
  if(!this.get('translation',true)&&this.session?.sample)return;
  const frame=reader._internalReader?._primaryView?._iframe,doc=reader._iframeWindow.document;
  if(!frame)return;
  let c=this.caption;
  if(c?.reader!==reader){this.hideTranslation(true);c=null;}
  if(!c){
   const box=doc.createElement('div');box.dataset.paperVoice='translation';box.className='pv-caption';
   box.setAttribute('role','status');box.setAttribute('aria-label','显示译文');
   box.style.cssText='position:absolute;z-index:20;box-sizing:border-box;padding:7px 10px;background:light-dark(rgba(248,250,245,var(--pv-caption-opacity,.88)),rgba(36,55,47,var(--pv-caption-opacity,.88)));backdrop-filter:blur(22px) saturate(135%);-webkit-backdrop-filter:blur(22px) saturate(135%);color:light-dark(#253c33,#edf2e9);border:0;border-radius:12px;font:12px/1.45 system-ui,sans-serif;box-shadow:0 4px 20px #15342922;overflow:auto;scrollbar-width:none;overflow-wrap:anywhere;transition:opacity 120ms ease;';
   this.applyCaptionTypography(box);
   box.style.setProperty('--pv-caption-opacity',String(this.surfaceOpacity?.()??.88));
   this.applyTheme?.(box,true);
   const original={height:frame.style.height,width:frame.style.width,display:frame.style.display};
   const pdfWindow=reader._internalReader._primaryView._iframeWindow;
   c=this.caption={box,frame,original,reader,pdfWindow,inline:true,timer:null};
   frame.parentElement.append(box);this.createCaptionControls(c);this.watchCaptionOcclusion(c);
   // Keep the caption visible while geometry changes. All events in one
   // rendering frame share one measurement; unrelated annotation/UI mutations
   // must not restart the appearance transition.
   box.style.visibility='hidden';box.style.opacity='0';
   c.layout=event=>{
    if(event?.target&&box.contains(event.target))return;
    if(c.raf!==undefined)return;
    c.raf=pdfWindow.requestAnimationFrame(()=>{c.raf=undefined;if(this.caption===c)this.positionTranslation(c);});
   };
   pdfWindow.addEventListener('scroll',c.layout,true);pdfWindow.addEventListener('resize',c.layout);
   const viewerRoot=pdfWindow.PDFViewerApplication?.pdfViewer?.viewer;
   if(viewerRoot){
    c.observer=new this.host.MutationObserver(records=>{
     if(records.some(r=>r.target.closest?.('.textLayer')||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('.page,.textLayer')||n.querySelector?.('.textLayer')))))c.layout();
    });
    c.observer.observe(viewerRoot,{childList:true,subtree:true});
   }
   c.layout();
  }
  c.pendingHide=false;c.suppressed=!this.get('translation',true);
  if(c.unit&&c.unit!==unit)c.layout();
  c.box.lang=this.get('translationTarget','zh-Hans');c.box.setAttribute('aria-label',(this.t?.('显示译文')||'显示译文')+' · '+(this.translationLanguage?.().label||c.box.lang));
  c.unit=unit;const content=source?text:(this.t?.(text)||text);if(c.box.textContent!==content)c.box.textContent=content;c.box.removeAttribute('title');delete c.box.dataset.pvTooltip;c.box.dataset.provider=source;
  this.positionTranslation(c);
 },
 positionTranslation(c) {
  if(this.caption!==c)return;
  const {box,frame,reader}=c,match=this.findSentence(reader,c.unit);
  if(!match){c.controls?.hide();if(!c.missingSince)c.missingSince=Date.now();if(!c.positioned||Date.now()-c.missingSince>250)box.style.visibility='hidden';else if(c.timer===null)c.timer=this.host.setTimeout(()=>{c.timer=null;c.layout();},260);return;}
  c.missingSince=null;
  c.sourceRects=match.rects;
  const fr=frame.getBoundingClientRect(),parent=frame.parentElement.getBoundingClientRect();
  const blocks=this.readingBlocks(match);
  // Prefer the leading visible part of this spoken chunk. In a two-column
  // sentence, the final DOM rectangle may be at the top of the opposite column.
  const block=blocks.find(part=>part.rects.some(r=>r.bottom>0&&r.top<fr.height&&r.right>0&&r.left<fr.width));
  if(!block){box.style.visibility='hidden';c.controls?.hide();return;}
  c.sourceBlock=block;
  const column=this.readingColumn(match,block);
  box.style.visibility='visible';box.style.opacity=c.occluded||c.suppressed?'0':'1';box.style.pointerEvents=c.occluded||c.suppressed?'none':'';c.positioned=true;
  if(c.suppressed){c.controls?.layout();c.occlusion?.check();return;}
  // Follow the current source directly. Covering subsequent unread text is intentional;
  // the original PDF viewport keeps its full width and height.
  const left=Math.max(12,column.left),right=Math.min(fr.width-12,column.right);
  const width=Math.max(1,right-left);
  // Short captions hug their text; the detected source column remains the
  // wrapping limit for longer translations and larger user-selected fonts.
  box.style.width='max-content';box.style.maxWidth=width+'px';box.style.maxHeight=Math.max(56,fr.height*.55)+'px';
  const height=box.getBoundingClientRect().height,bottomInset=c.controls?80:12;
  let top=block.bottom+8;c.inline=true;box.dataset.placement='below-source';
  if(this.get('captionPlacement','below')==='above'){
   const room=block.top-20;
   if(room<24){box.style.visibility='hidden';c.controls?.hide();return;}
   box.style.maxHeight=Math.min(fr.height*.55,room)+'px';
   top=block.top-box.getBoundingClientRect().height-8;box.dataset.placement='above-source';
  }else if(top+height>fr.height-bottomInset&&block.top-height-8>=12){
   top=block.top-height-8;box.dataset.placement='above-source';
  }else if(top+height>fr.height-bottomInset){
   box.style.maxHeight=Math.max(56,fr.height-top-bottomInset)+'px';
  }
  box.style.left=(fr.left-parent.left+left)+'px';box.style.top=(fr.top-parent.top+top)+'px';c.controls?.layout();c.occlusion?.check();
 },
 hideTranslation(force=false) {
  const c=this.caption;if(!c)return;if(!force&&!this.dead&&c.retainControls){c.pendingHide=true;return;}this.releaseCaptionPause?.(c.reader);this.caption=null;
  c.occlusion?.dispose();c.controls?.dispose();c.pdfWindow.removeEventListener('scroll',c.layout,true);c.pdfWindow.removeEventListener('resize',c.layout);
  if(c.timer!==null)this.host.clearTimeout(c.timer);if(c.raf!==undefined)c.pdfWindow.cancelAnimationFrame(c.raf);c.observer?.disconnect();
  c.box.style.opacity='0';c.box.style.pointerEvents='none';
  if(this.dead||c.pdfWindow.matchMedia?.('(prefers-reduced-motion: reduce)').matches)c.box.remove();
  else this.host.setTimeout(()=>c.box.remove(),160);
 },
};
