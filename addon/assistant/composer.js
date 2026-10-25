/* A quiet composer: persistent attachments and a reversible source preview. */
Object.assign(LoomAssistant,{
 async submit(view,text){
  if(view.busy||this.active)throw Error('busy');
  const question=String(text||'').trim()||(view.image?this.t('请分析这张图片。','Please analyze this image.'):'');
  if(!question)return;
  return this.send(view,question);
 },
 pastedMarkdown(doc,html){
  const template=doc.createElement('template');template.innerHTML=String(html).slice(0,150000);
  const walk=(node,depth=0)=>{
   if(depth>24)return '';if(node.nodeType===3)return node.textContent;
   const tag=node.localName||'';if(/^(script|style|iframe|object|embed|svg|math|img|link|meta)$/.test(tag))return '';
   const text=[...node.childNodes].map(n=>walk(n,depth+1)).join('');
   if(tag==='table'){const rows=[...node.querySelectorAll('tr')].map(row=>'| '+[...row.children].map(n=>walk(n,depth+1).trim().replace(/\|/g,'/')).join(' | ')+' |');if(rows.length)rows.splice(1,0,'| '+[...node.querySelector('tr').children].map(()=>'---').join(' | ')+' |');return '\n'+rows.join('\n')+'\n';}
   if(['b','strong'].includes(tag))return text.trim()?'**'+text+'**':'';
   if(['i','em'].includes(tag))return text.trim()?'*'+text+'*':'';
   if(tag==='br')return '\n';if(tag==='pre')return '\n```\n'+node.textContent+'\n```\n';
   if(tag==='code'&&node.parentElement?.localName!=='pre')return '`'+text+'`';
   if(tag==='li')return '\n'+(node.parentElement?.localName==='ol'?([...node.parentElement.children].indexOf(node)+1)+'. ':'- ')+text.trim();
   if(tag==='blockquote')return '\n'+text.trim().split('\n').map(x=>'> '+x).join('\n')+'\n';
   if(/^h[1-6]$/.test(tag))return '\n'+('#'.repeat(Number(tag[1])))+' '+text.trim()+'\n';
   if(tag==='a'){try{return '['+text+']('+LoomAssistantCore.publicURL(node.getAttribute('href'))+')';}catch(_){return text;}}
   if(tag==='tr')return '\n| '+[...node.children].map(n=>walk(n,depth+1).trim().replace(/\|/g,'/')).join(' | ')+' |';
   return /^(p|div|ul|ol|table)$/.test(tag)?'\n'+text+'\n':text;
  };
  return walk(template.content).replace(/\n{3,}/g,'\n\n').trim();
 },
 composerTools(view,composer,options){
  const A=this,L=PaperLoom,doc=view.doc,win=doc.defaultView,input=view.input,t=(z,e)=>A.t(z,e),el=(tag,text,cls)=>L.el(doc,tag,text,cls);
  const row=el('div',null,'pl-ai-context-row'),source=L.button(doc,'',()=>toggle()),hint=el('span',t('文字 / 图片','Text / images'),'pl-ai-input-hint');source.className='pl-ai-context-trigger';source.hidden=true;source.setAttribute('aria-expanded','false');source.setAttribute('aria-haspopup','dialog');row.append(source);composer.prepend(row);
  const attach=A.iconButton(doc,t('添加图片 · 也可粘贴或拖入','Attach image · paste or drop also works'),'plus',async()=>{try{await A.attachImage(view);}catch(e){view.notice(A.error(e));}});attach.dataset.aiAttach='true';options.prepend(attach,hint);
  let panel=null,disposed=false,frame=0;
  const close=()=>{if(!panel)return;panel.remove();panel=null;source.setAttribute('aria-expanded','false');doc.removeEventListener('pointerdown',outside,true);win.removeEventListener('resize',position);};
  const outside=e=>{if(panel&&!panel.contains(e.target)&&!source.contains(e.target))close();};
  function position(){if(!panel)return;const b=source.getBoundingClientRect(),c=composer.getBoundingClientRect(),height=Math.max(48,Math.min(330,b.top-16));panel.style.width=Math.min(c.width-24,win.innerWidth-24)+'px';panel.style.maxHeight=height+'px';panel.style.left=Math.max(8,Math.min(c.left+12,win.innerWidth-panel.getBoundingClientRect().width-8))+'px';panel.style.top=Math.max(8,b.top-panel.getBoundingClientRect().height-6)+'px';}
  function toggle(){
   if(panel){close();return;}const c=view.context;if(!c?.original)return;
   panel=el('section',null,'cl-floating pl-ai-context-popover');panel.setAttribute('popover','manual');panel.setAttribute('role','dialog');panel.setAttribute('aria-label',t('带入的文段','Passage context'));panel.dataset.clContent='true';
   const style=win.getComputedStyle(view.frame);for(const key of ['--cl-ink','--cl-muted','--cl-accent','--cl-line','--cl-bg','--cl-paper','--pl-font'])panel.style.setProperty(key,style.getPropertyValue(key));
   const header=el('header'),title=el('strong',source.textContent),dismiss=A.iconButton(doc,t('关闭文段预览','Close passage preview'),'x',()=>{close();source.focus();});header.append(title,dismiss);panel.append(header);
   if(c.paper?.title)panel.append(el('p',c.paper.title,'pl-ai-context-paper'));
   panel.append(el('h4',t('原文','Original')),el('p',c.original,'pl-ai-context-text'));
   if(c.translation)panel.append(el('h4',t('译文','Translation')),el('p',c.translation,'pl-ai-context-text'));
   doc.body.append(panel);panel.showPopover();position();source.setAttribute('aria-expanded','true');doc.addEventListener('pointerdown',outside,true);win.addEventListener('resize',position);dismiss.focus();
   panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();source.focus();}});
  }
  const update=()=>{if(disposed)return;const c=view.context;source.hidden=!c?.original;row.hidden=source.hidden;source.textContent=c?.original?(c.kind==='reading'?t('来自朗读','From reading'):t('来自划选','From selection'))+(Number.isInteger(c.page)?' · p. '+(c.page+1):''):'';source.title=t('查看带入的原文与译文','View the original passage and translation');attach.disabled=view.busy;};
  const insert=text=>{const start=input.selectionStart,end=input.selectionEnd,room=input.maxLength-input.value.length+end-start;input.setRangeText(text.slice(0,Math.max(0,room)),start,end,'end');input.dispatchEvent(new win.Event('input',{bubbles:true}));};
  const paste=e=>{const files=[...(e.clipboardData?.files||[])],file=files.find(f=>/^image\/(png|jpeg|webp)$/.test(f.type));if(file){e.preventDefault();A.attachImage(view,file).catch(err=>view.notice(A.error(err)));return;}const html=e.clipboardData?.getData('text/html');if(html){const text=A.pastedMarkdown(doc,html);if(text){e.preventDefault();insert(text);}}};
  const key=e=>{if((e.metaKey||e.ctrlKey)&&!e.altKey&&['b','i'].includes(e.key.toLowerCase())){e.preventDefault();const mark=e.key.toLowerCase()==='b'?'**':'*',start=input.selectionStart,end=input.selectionEnd;if(input.value.length+mark.length*2>input.maxLength)return;insert(mark+input.value.slice(start,end)+mark);input.setSelectionRange(start+mark.length,end+mark.length);}};
  const drag=e=>{if([...e.dataTransfer?.types||[]].includes('Files'))e.preventDefault();};
  const drop=e=>{const file=[...e.dataTransfer?.files||[]].find(f=>/^image\/(png|jpeg|webp)$/.test(f.type));if(file){e.preventDefault();e.stopPropagation();A.attachImage(view,file).catch(err=>view.notice(A.error(err)));}};
  const resize=()=>{if(frame||disposed)return;frame=win.requestAnimationFrame(()=>{frame=0;if(disposed)return;input.style.height='0px';input.style.height=Math.min(140,Math.max(82,input.scrollHeight))+'px';});};
  input.addEventListener('paste',paste);input.addEventListener('keydown',key);input.addEventListener('input',resize);composer.addEventListener('dragover',drag);composer.addEventListener('drop',drop);view.frame.addEventListener('cl-page-hidden',close);update();
  return {reset(){close();update();resize();},update,close,dispose(){disposed=true;close();win.cancelAnimationFrame(frame);input.removeEventListener('paste',paste);input.removeEventListener('keydown',key);input.removeEventListener('input',resize);composer.removeEventListener('dragover',drag);composer.removeEventListener('drop',drop);view.frame.removeEventListener('cl-page-hidden',close);}};
 }
});
