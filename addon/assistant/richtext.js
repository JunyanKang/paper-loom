/* A small, DOM-only Markdown renderer. Model output never becomes executable HTML. */
Object.assign(LoomAssistant,{
 renderText(doc,node,text,view=null,sources=[]){
  node.replaceChildren();const el=(tag,value)=>PaperLoom.el(doc,tag,value);let code=null,table=null,list=null,paragraph=null;
  const inline=(parent,value,depth=0)=>{
   if(depth>6){parent.append(doc.createTextNode(value));return;}
   const pattern=/(`[^`\n]+`|!?\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|\*\*[^\n]+?\*\*|__[^\n]+?__|~~[^\n]+?~~|\*(?!\s)[^*\n]+?\*|(?<![\w])_(?!\s)[^_\n]+?_(?![\w]))/g;
   for(const token of value.split(pattern)){
    if(!token)continue;
    const link=token.match(/^(!?)\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if(link){let url;try{url=LoomAssistantCore.publicURL(link[3]);}catch(_){parent.append(doc.createTextNode(token));continue;}
     // External images are links until explicitly opened; no tracking requests on render.
     const a=el('a',(link[1]?this.t('图片：','Image: '):'')+link[2]);a.href=url;a.rel='noopener noreferrer';if(view)a.addEventListener('click',e=>{e.preventDefault();Zotero.launchURL(url);});parent.append(a);continue;
    }
    let tag=null,size=1;if(token.startsWith('`'))tag='code';else if(token.startsWith('**')||token.startsWith('__')){tag='strong';size=2;}else if(token.startsWith('~~')){tag='del';size=2;}else if(token.startsWith('*')||token.startsWith('_'))tag='em';
    if(tag){const child=el(tag);if(tag==='code')child.textContent=token.slice(size,-size);else inline(child,token.slice(size,-size),depth+1);parent.append(child);}
    else for(const part of this.citationTokens(token,sources)){if(view&&part.sources)part.sources.forEach((s,i)=>{if(i)parent.append(doc.createTextNode(' '));parent.append(this.citationButton(view,s));});else parent.append(doc.createTextNode(part.text));}
   }
  };
  for(const line of String(text||'').split('\n')){
   if(/^\s*```/.test(line)){if(code)code=null;else{code=el('code');const pre=el('pre');pre.append(code);node.append(pre);}table=list=paragraph=null;continue;}
   if(code){code.append(doc.createTextNode(line+'\n'));continue;}
   if(/^\s*\|.*\|\s*$/.test(line)){list=paragraph=null;if(/^\s*\|?[\s:|-]+\|\s*$/.test(line))continue;if(!table){table=el('table');const wrap=el('div');wrap.className='pl-ai-table';wrap.append(table);node.append(wrap);}const row=el('tr');for(const cell of line.trim().replace(/^\||\|$/g,'').split('|')){const td=el('td');inline(td,cell.trim());row.append(td);}table.append(row);continue;}table=null;
   if(!line.trim()){list=paragraph=null;continue;}
   const heading=line.match(/^#{1,6}\s+(.+)/),item=line.match(/^\s*(?:([-*+])|\d+[.)])\s+(.+)/),quote=line.match(/^>\s?(.*)/);
   if(item){paragraph=null;const kind=item[1]?'ul':'ol';if(!list||list.localName!==kind){list=el(kind);if(kind==='ol')list.start=Number(line.trim().match(/^\d+/)[0]);node.append(list);}const li=el('li');inline(li,item[2]);list.append(li);continue;}list=null;
   if(heading||quote){paragraph=null;const block=el(heading?'h4':'blockquote');inline(block,(heading||quote)[1]);node.append(block);continue;}
   if(!paragraph){paragraph=el('p');node.append(paragraph);}else paragraph.append(doc.createTextNode('\n'));inline(paragraph,line);
  }
 },
 composerTools(view,composer,options){
  const A=this,doc=view.doc,input=view.input,t=(z,e)=>A.t(z,e),bar=PaperLoom.el(doc,'div',null,'pl-ai-format-bar'),preview=PaperLoom.el(doc,'div',null,'pl-ai-compose-preview');bar.hidden=preview.hidden=true;preview.dataset.clContent='true';
  const keepBottom=run=>{const log=view.frame.querySelector('.pl-ai-transcript'),follow=log.scrollHeight-log.scrollTop-log.clientHeight<90;run();if(follow)doc.defaultView.requestAnimationFrame(()=>{if(!view.disposed)view.scrollToLatest();});};
  const toggle=PaperLoom.button(doc,'Aa',()=>keepBottom(()=>{bar.hidden=!bar.hidden;toggle.setAttribute('aria-expanded',String(!bar.hidden));if(bar.hidden)preview.hidden=true;}));toggle.className='pl-ai-format-toggle';toggle.title=toggle.getAttribute('aria-label')||t('格式与图片','Formatting and images');toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-expanded','false');options.prepend(toggle);
  const insert=(before,after='')=>{const start=input.selectionStart,end=input.selectionEnd,selected=input.value.slice(start,end);if(input.value.length+before.length+after.length>input.maxLength)return;input.setRangeText(before+selected+after,start,end,'end');input.focus();input.setSelectionRange(start+before.length,end+before.length);preview.hidden=true;};
  for(const [label,title,before,after]of [['B',t('粗体','Bold'),'**','**'],['I',t('斜体','Italic'),'*','*'],['≡',t('列表','List'),'\n- ',''],['❯',t('引用','Quote'),'\n> ',''],['<>',t('代码','Code'),'`','`']]){const button=PaperLoom.button(doc,label,()=>insert(before,after));button.title=title;button.setAttribute('aria-label',title);bar.append(button);}
  bar.append(A.iconButton(doc,t('预览格式','Preview formatting'),'eye',()=>keepBottom(()=>{preview.hidden=!preview.hidden;if(!preview.hidden)A.renderText(doc,preview,input.value);})),A.iconButton(doc,t('添加图片','Attach image'),'image-plus',async()=>{try{await A.attachImage(view);}catch(e){view.notice(A.error(e));}}));
  const generate=A.iconButton(doc,t('生成图片','Generate image'),'sparkles',async()=>{try{await A.generateImage(view,input.value);}catch(e){view.notice(A.error(e));}});bar.append(generate);generate.dataset.aiGenerate='true';composer.prepend(bar,preview);
  input.addEventListener('input',()=>{preview.hidden=true;});
  input.addEventListener('paste',e=>{const file=[...(e.clipboardData?.files||[])].find(f=>/^image\/(png|jpeg|webp)$/.test(f.type));if(file){e.preventDefault();A.attachImage(view,file).catch(err=>view.notice(A.error(err)));}});
  input.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&!e.altKey&&['b','i'].includes(e.key.toLowerCase())){e.preventDefault();const mark=e.key.toLowerCase()==='b'?'**':'*';insert(mark,mark);}});
  return {reset(){preview.hidden=true;},dispose(){preview.replaceChildren();}};
 }
});
