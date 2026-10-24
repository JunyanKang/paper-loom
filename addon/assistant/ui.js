Object.assign(LoomAssistant,{
 renderText(doc,node,text,view=null,sources=[]){
  node.replaceChildren();let code=null,table=null;const el=(tag,value)=>PaperLoom.el(doc,tag,value);
  const inline=(parent,value)=>{for(const token of value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)){if(token.startsWith('**')&&token.endsWith('**'))parent.append(el('strong',token.slice(2,-2)));else if(token.startsWith('`')&&token.endsWith('`'))parent.append(el('code',token.slice(1,-1)));else for(const part of this.citationTokens(token,sources)){if(view&&part.sources){part.sources.forEach((s,i)=>{if(i)parent.append(doc.createTextNode(' '));parent.append(this.citationButton(view,s));});}else parent.append(doc.createTextNode(part.text));}}};
  for(const line of text.split('\n')){if(/^```/.test(line)){if(code)code=null;else{code=el('pre','');node.append(code);}table=null;continue;}if(code){code.textContent+=line+'\n';continue;}
   if(/^\s*\|.*\|\s*$/.test(line)){if(/^\s*\|?[\s:|-]+\|\s*$/.test(line))continue;if(!table){table=el('table');const wrap=el('div');wrap.className='pl-ai-table';wrap.append(table);node.append(wrap);}const row=el('tr');for(const cell of line.trim().replace(/^\||\|$/g,'').split('|')){const td=el('td');inline(td,cell.trim());row.append(td);}table.append(row);continue;}table=null;
   if(!line.trim())continue;const heading=line.match(/^#{1,4}\s+(.+)/),block=el(heading?'h4':'p');inline(block,heading?heading[1]:line.replace(/^\s*[-*]\s+/,'• '));node.append(block);
  }
 },
 icon(doc){const icon=PaperLoom.el(doc,'span');icon.className='pl-ai-icon';icon.setAttribute('aria-hidden','true');icon.style.setProperty('--pl-ai-icon','url("'+PaperLoom.voice.assetURI+'icons/message-circle.svg")');return icon;},
 iconButton(doc,label,icon,run){const b=PaperLoom.button(doc,'',run);b.className='pl-ai-icon-button';b.setAttribute('aria-label',label);b.title=label;if(icon==='assistant')b.append(this.icon(doc));else{const span=PaperLoom.el(doc,'span');span.className='pl-ai-icon';span.style.setProperty('--pl-ai-icon','url("'+PaperLoom.voice.assetURI+'icons/'+icon+'.svg")');b.append(span);}return b;},
 installStyle(doc){if(doc.getElementById('pl-assistant-style'))return;const link=PaperLoom.el(doc,'link');link.id='pl-assistant-style';link.rel='stylesheet';link.href='resource://'+PaperLoom.resource+'/assistant/style.css';(doc.head||doc.documentElement).append(link);},
 async open(reader,entry={},doc=reader?._iframeWindow?.document||Zotero.getMainWindow().document){this.dead=false;await LoomAssistantStore.init();this.installStyle(doc);PaperLoom.style(doc);const context=LoomAssistantContext.capture(reader,entry);let view=this.views.get(doc);if(view){if(view.busy){if(view.reader!==reader)throw Error('busy');await view.frame._clPage.activate();return view;}view.reader=reader;{if(view.context?.paper?.attachmentID!==context.paper?.attachmentID){view.session=null;view.input.value='';}view.context=context;view.image=null;}view.render();await view.frame._clPage.activate();return view;}
  for(const old of this.views.values()){if(this.views.size<3)break;if(!old.busy&&!old.input.value&&!old.image&&old.frame._clPage?.container.hidden)old.frame._clPage.destroy();}
  const A=this,L=PaperLoom,U=L.referencesScope.CiteLensUI,t=(z,e)=>A.t(z,e),el=(tag,text,cls)=>L.el(doc,tag,text,cls);const dialog=U.dialog(doc,'Paper Loom',{className:'pl-assistant',reader,autoOpen:false,onClose:()=>view?.dispose()}),{frame,root,footer}=dialog;footer.remove();root.className='pl-ai-body';
  const top=el('header',null,'pl-ai-header'),brand=el('div',null,'pl-ai-brand');brand.append(A.icon(doc),el('strong',t('织知 · 科研助手','Loom · Research assistant')));top.append(brand);
  const historyButton=A.iconButton(doc,t('对话记录','Conversations'),'history',()=>view.history.toggle()),newButton=A.iconButton(doc,t('新对话','New conversation'),'plus',()=>{if(view.busy)return;view.history.reset();view.session=null;view.input.value='';view.image=null;view.render();}),close=A.iconButton(doc,t('收起','Close'),'x',()=>dialog.close());top.append(historyButton,newButton,close);
  const historyPanel=el('section',null,'pl-ai-history');historyPanel.hidden=true;const historyBack=el('button',null,'pl-ai-history-back');historyBack.hidden=true;
  const transcript=el('div',null,'pl-ai-transcript');transcript.setAttribute('role','log');transcript.setAttribute('aria-label',t('对话内容','Conversation'));transcript.tabIndex=0;
  const state=el('div',null,'pl-ai-status');state.setAttribute('role','status');state.setAttribute('aria-live','polite');
  const composer=el('section',null,'pl-ai-composer');
  const preview=el('div',null,'pl-ai-image-preview');preview.hidden=true;const input=el('textarea');input.rows=3;input.maxLength=LoomAssistantCore.limits.question;input.placeholder=t('问这篇论文，或提出你的研究问题…','Ask about this paper or your research…');input.setAttribute('aria-label',input.placeholder);
  const options=el('div',null,'pl-ai-composer-tools');
  const send=A.iconButton(doc,t('发送','Send'),'arrow-up',async()=>{try{if(view.busy){A.cancel();return;}await A.send(view,input.value);}catch(e){view.notice(A.error(e));}});send.dataset.aiSend='true';options.append(send);
  composer.append(preview,input,options);root.append(top,historyBack,historyPanel,transcript,state,composer);
  let timer=0,disposed=false,noticeText='',renderLimit=40;const win=doc.defaultView;
  view={doc,frame,reader,context,session:null,image:null,busy:false,input,online:true,vision:true,
   phase(text){state.textContent=text||noticeText;},notice(text){noticeText=text;state.textContent=text;},
   update(){newButton.disabled=historyButton.disabled=this.busy;input.disabled=false;send.setAttribute('aria-label',this.busy?t('停止生成','Stop generating'):t('发送','Send'));send.title=send.getAttribute('aria-label');send.firstChild.style.setProperty('--pl-ai-icon','url("'+L.voice.assetURI+'icons/'+(this.busy?'square':'arrow-up')+'.svg")');},
   stream(message){if(disposed||timer)return;timer=win.setTimeout(()=>{timer=0;if(disposed)return;const node=transcript.querySelector('[data-streaming]');if(node){const follow=transcript.scrollHeight-transcript.scrollTop-transcript.clientHeight<90;node.textContent=message.text;if(follow)transcript.scrollTop=transcript.scrollHeight;}},70);},
   render(){if(disposed)return;this.citation?.close();win.clearTimeout(timer);timer=0;const follow=transcript.scrollHeight-transcript.scrollTop-transcript.clientHeight<90;this.update();this.history?.chat();
    preview.replaceChildren();preview.hidden=!this.image;if(this.image){const img=el('img');img.src=this.image.url;img.alt=t('页面预览','Page preview');preview.append(img,el('span','p. '+(this.image.page+1)),A.iconButton(doc,t('移除图片','Remove image'),'x',()=>{this.image=null;this.render();}));}
    transcript.replaceChildren();const messages=this.session?.messages||[];
    if(!messages.length){const empty=el('div',null,'pl-ai-empty');empty.append(el('h3',t('想一起研究什么？','What shall we explore?')),el('p',t('结合原文、图表和可追溯的文献来源，推敲证据与下一步实验。','Explore the paper, figures, evidence and possible next experiments.')));const prompts=[[t('解释这段','Explain this passage'),t('解释当前内容的科学含义、关键术语及其与论文结论的关系。','Explain this passage, its key terms, and its relationship to the paper’s conclusions.')],[t('梳理论文','Map the paper'),t('梳理论文的科学问题、主要贡献、方法和证据链，引用原文页码。','Outline the question, contribution, methods and evidence, citing source pages.')],[t('审视证据','Assess evidence'),t('评估这篇论文的对照、重复单位、因果推断和局限，区分事实与推断。','Assess controls, replication units, causal claims and limitations. Distinguish findings from inference.')],[t('后续实验','Next experiments'),t('根据当前论文提出可检验的后续实验，说明假设、关键对照和判定标准。','Propose testable next experiments with hypotheses, controls and decision criteria.')]];const grid=el('div',null,'pl-ai-prompts');for(const [label,prompt]of prompts)grid.append(L.button(doc,label,()=>{input.value=prompt;input.focus();}));empty.append(grid);transcript.append(empty);}
    if(messages.length>renderLimit)transcript.append(L.button(doc,t('显示更早消息','Show earlier messages'),()=>{renderLimit+=40;this.render();}));
    for(const m of messages.slice(-renderLimit)){const article=el('article',null,'pl-ai-message');article.dataset.role=m.role;const meta=el('header',m.role==='user'?t('你','You'):t('织知','Loom')+(m.model?' · '+m.model:'')),body=el('div',m.text|| (m.status==='streaming'?t('正在准备…','Preparing…'):''),'pl-ai-message-text');body.dataset.clContent='true';if(m.status==='streaming')body.dataset.streaming='true';if(m.status!=='streaming')A.renderText(doc,body,m.text||'',this,m.sources||[]);article.append(meta,body);
     if(m.imagePage!==undefined)article.append(el('small',t('已发送页面图 · p. ','Page image sent · p. ')+(m.imagePage+1)));
     if(m.sources?.length){const details=el('details',null,'pl-ai-sources'),summary=el('summary',t('查看来源','Sources')+' · '+m.sources.length);details.append(summary);for(const s of m.sources){const b=A.citationButton(this,s,'['+s.id+'] '+s.title+(s.page!==undefined?' · p. '+(s.page+1):''));details.append(b);}article.append(details);}
     if(m.error||['cancelled','interrupted','truncated'].includes(m.status))article.append(el('p',m.error||t('回答未完成，可重试。','Response incomplete. You can retry.'),'pl-ai-message-error'));
     if(m.role==='assistant'&&m.status!=='streaming'){const actions=el('div',null,'pl-ai-message-actions');actions.append(A.iconButton(doc,t('复制回答','Copy answer'),'copy',()=>Zotero.Utilities.Internal.copyTextToClipboard(m.text)));if(m===messages.at(-1))actions.append(L.button(doc,t('重新生成','Regenerate'),async()=>{if(this.busy)return;const user=messages.at(-2);if(user?.role!=='user')return;input.value=user.text;this.context=user.context||this.context;this.render();try{await A.send(this,input.value);}catch(e){this.notice(A.error(e));}}));article.append(actions);}transcript.append(article);
    }if(!messages.length)transcript.scrollTop=0;else if(follow)transcript.scrollTop=transcript.scrollHeight;
   },
   dispose(){if(disposed)return;disposed=true;this.history?.dispose();this.citation?.close();win.clearTimeout(timer);if(A.active?.view===this)A.cancel();A.views.delete(doc);win.removeEventListener('pagehide',leave);}
  };
  const leave=()=>view.dispose();win.addEventListener('pagehide',leave,{once:true});frame.addEventListener('cl-page-hidden',()=>view.citation?.close());this.views.set(doc,view);
  view.history=A.historyUI(view,{panel:historyPanel,transcript,composer,button:historyButton,back:historyBack});
  input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!view.busy)send.click();}});frame.addEventListener('keydown',e=>{if(e.key==='Escape'&&view.busy){e.stopPropagation();e.preventDefault();A.cancel();}},true);
  view.render();await frame._clPage.activate();return view;
 },
 settingsAdapter(){
  const A=this,T=PaperLoom.referencesScope.CiteLensTranslation;
  return {
   llmPresets:A.presets(),
   llmTaskConfig(task,id){return A.config(id);},
   llmKey:c=>A.key(c.id,c.endpoint),
   removeLLMKey:c=>A.writeKey(c.id,c.endpoint,'',true),
   modelChoices(id,task,current){let discovered={};try{discovered=JSON.parse(A.get('models','{}'));}catch(_){}const c=A.config(id);return [...new Set([current,c.model,...(c.models||[]),...(discovered[id]?.endpoint===c.endpoint?discovered[id].models:[])].filter(Boolean))];},
   modelChoiceLabel:(id,value)=>T.modelChoiceLabel(id,value),
   async refreshModelSources(task,draft){try{const c=draft?.config||A.config(),models=await A.models(c,draft?.key);let all={};try{all=JSON.parse(A.get('models','{}'));}catch(_){}all[c.id]={endpoint:c.endpoint,models};A.set('models',JSON.stringify(all));return {results:[{ok:true,name:c.name||c.id}],changed:false};}catch(e){throw Error(A.error(e));}},
   async saveLLM(c,key){try{return await A.saveConfig(c,key);}catch(e){throw Error(A.error(e));}},
   async testLLM(c){try{await A.test(c,'');return {assistant:{ok:true}};}catch(e){return {assistant:{ok:false,message:A.error(e)}};}},
   mountSettings({doc,llm,row,ui}){
    const protocol=ui.el(doc,'select');for(const [value,label] of [['openai','OpenAI 兼容'],['anthropic','Anthropic Messages']]){const o=ui.el(doc,'option',label);o.value=value;protocol.append(o);}row(llm,'协议','assistantProtocol',protocol);
    const vision=ui.el(doc,'input');vision.type='checkbox';vision.style.cssText='width:32px!important;min-width:32px!important;justify-self:end';row(llm,'看图','assistantVision',vision);
    const search=ui.el(doc,'input');search.type='password';search.autocomplete='off';search.placeholder='可选 · Brave Search API';row(llm,'搜索','assistantSearch',search);
    const remove=ui.iconButton(doc,'移除密钥','remove',async()=>{await A.writeKey('brave','https://api.search.brave.com','',true);search.value='';search.placeholder='可选 · Brave Search API';});search.closest('.cl-setting-row').append(remove);
    return {load(c){protocol.value=c.protocol||'openai';vision.checked=!!c.vision;search.value='';},values:()=>({protocol:protocol.value,vision:vision.checked}),async save(){if(search.value.trim())await A.writeKey('brave','https://api.search.brave.com',search.value.trim());search.value='';}};
   }
  };
 }
});
