/* User-facing operation summaries, separate from the answer and model reasoning. */
Object.assign(LoomAssistant,{
 recordActivity(view,text){
  const message=view.session?.messages?.at(-1);if(message?.role!=='assistant'||message.status!=='streaming')return false;
  const steps=message.activity||=([]),last=steps.at(-1),value=String(text).slice(0,240);if(last?.text===value)return true;
  // Index counters replace the previous counter rather than growing a page-by-page log.
  if(last&&/^(建立文献上下文|Indexing paper) /.test(last.text)&&/^(建立文献上下文|Indexing paper) /.test(value))last.text=value;else{steps.push({text:value,at:Date.now()});if(steps.length>24)steps.shift();}
  view.activityUI?.update(message);return true;
 },
 renderActivity(view,bubble,message){
  if(message.status!=='streaming'&&!message.activity?.length)return;
  const doc=view.doc,t=(z,e)=>this.t(z,e),el=(tag,value,cls)=>PaperLoom.el(doc,tag,value,cls),details=el('details',null,'pl-ai-activity'),summary=el('summary'),label=el('span'),list=el('ol');details.dataset.clContent='true';summary.append(label);details.append(summary,list);bubble.append(details);details.open=message.status==='streaming';
  const update=current=>{if(current!==message||view.disposed)return;const running=message.status==='streaming',steps=message.activity||[];details.dataset.running=String(running);label.textContent=running?(steps.at(-1)?.text||t('正在准备…','Preparing…')):message.status==='done'?t('处理过程','Activity'):['cancelled','interrupted'].includes(message.status)?t('已停止 · 查看过程','Stopped · View activity'):t('未完成 · 查看过程','Incomplete · View activity');
   // Mutate only this small bounded list, never the transcript or composer.
   const visible=running?steps.slice(0,-1):steps;while(list.children.length>visible.length)list.lastChild.remove();visible.forEach((step,index)=>{let row=list.children[index];if(!row){row=el('li');list.append(row);}if(row.textContent!==step.text)row.textContent=step.text;});
  };update(message);if(message.status==='streaming')view.activityUI={update};
 }
});
