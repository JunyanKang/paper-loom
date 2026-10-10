var PaperVoiceUI = {
 visibility(element,visible) {
  if(!element)return;
  if(element._pvDockVisibility)return element._pvDockVisibility(visible);
  const target=String(visible);
  if(element.dataset.pvVisible===target&&element.hidden===!visible)return;
  const wasHidden=element.hidden,current=wasHidden?0:Number(element.ownerDocument.defaultView.getComputedStyle(element).opacity);
  element._pvFade?.cancel();element.dataset.pvVisible=target;element.inert=!visible;
  element.style.pointerEvents=visible?'':'none';
  if(element.ownerDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches||!element.animate){element.hidden=!visible;return;}
  element.hidden=false;
  const animation=element._pvFade=element.animate([{opacity:current},{opacity:visible?1:0}],{duration:160,easing:'ease-out',fill:'both'});
  animation.finished.then(()=>{if(element._pvFade!==animation)return;element.hidden=!visible;animation.cancel();element._pvFade=null;},()=>{});
 },
 bindQuickReveal(root,bar,orb,onHide) {
  const doc=root.ownerDocument,win=doc.defaultView;let timer=null,animation=null,opened=false,overOrb=false,overBar=false,disposed=false;
  const listen=(el,type,fn,capture=false)=>{el.addEventListener(type,fn,capture);return ()=>el.removeEventListener(type,fn,capture);},off=[];
  const clear=()=>{win.clearTimeout(timer);timer=null;};
  const keyboardInside=()=>{const el=doc.activeElement;return (el===orb||bar.contains(el))&&el?.matches(':focus-visible');};
  const layout=()=>{
   if(bar.hidden)return;bar.style.top='auto';bar.style.right=(orb.offsetWidth+7)+'px';bar.style.bottom=Math.max(0,(orb.offsetHeight-bar.offsetHeight)/2)+'px';bar.dataset.placement='side';
   const o=orb.getBoundingClientRect();if(o.left-7-bar.offsetWidth<8){bar.style.right='0px';bar.style.bottom=(orb.offsetHeight+8)+'px';bar.dataset.placement='above';if(o.top-8-bar.offsetHeight<8){bar.style.bottom='auto';bar.style.top=(orb.offsetHeight+8)+'px';bar.dataset.placement='below';}const left=o.right-bar.offsetWidth;if(left<8)bar.style.right=(left-8)+'px';}
  };
  const setOpen=show=>{
   if(disposed||opened===show)return;opened=show;clear();
   const hidden=bar.hidden,style=win.getComputedStyle(bar),from={opacity:hidden?'0':style.opacity,transform:hidden?'translateX(9px) scale(.97)':style.transform};
   animation?.cancel();animation=null;bar.dataset.revealed=String(show);bar.inert=!show;bar.style.pointerEvents=show?'':'none';
   if(!show)onHide();bar.hidden=false;if(show)layout();
   if(win.matchMedia('(prefers-reduced-motion: reduce)').matches||!bar.animate){bar.hidden=!show;return;}
   const offset=bar.dataset.placement==='above'?'translateY(7px)':bar.dataset.placement==='below'?'translateY(-7px)':'translateX(9px)';if(hidden)from.transform=offset+' scale(.97)';
   const end=show?{opacity:1,transform:'none'}:{opacity:0,transform:offset+' scale(.98)'};
   const current=animation=bar.animate([from,end],{duration:show?240:180,easing:show?'cubic-bezier(.16,1,.3,1)':'cubic-bezier(.4,0,1,1)',fill:'both'});
   current.finished.then(()=>{if(animation!==current)return;bar.hidden=!show;current.cancel();animation=null;},()=>{});
  };
  const leave=()=>{clear();timer=win.setTimeout(()=>{if(!overOrb&&!overBar&&!keyboardInside())setOpen(false);},420);};
  const hide=()=>{clear();overOrb=overBar=false;setOpen(false);};
  // DOM order gives keyboard users the controls immediately after the mascot.
  orb.after(bar);bar.hidden=true;bar.inert=true;bar.dataset.revealed='false';bar.setAttribute('role','group');bar.setAttribute('aria-label','Paper Loom 朗读控制');
  off.push(listen(orb,'pointerenter',()=>{overOrb=true;clear();setOpen(true);}),listen(orb,'pointerleave',()=>{overOrb=false;leave();}));
  off.push(listen(bar,'pointerenter',()=>{overBar=true;clear();}),listen(bar,'pointerleave',()=>{overBar=false;leave();}));
  for(const el of [orb,bar]){off.push(listen(el,'focusin',e=>{if(e.target.matches(':focus-visible')){clear();setOpen(true);}}),listen(el,'focusout',()=>{overOrb=orb.matches(':hover');overBar=bar.matches(':hover');leave();}));}
  off.push(listen(orb,'keydown',e=>{if(e.key==='Tab'&&!e.shiftKey){setOpen(true);}else if(e.key==='ArrowLeft'){e.preventDefault();setOpen(true);bar.querySelector('button:not([hidden]):not(:disabled)')?.focus();}}));
  off.push(listen(doc,'pointerdown',e=>{if(!orb.contains(e.target)&&!bar.contains(e.target))hide();},true),listen(win,'blur',hide),listen(win,'resize',()=>{onHide();layout();}),listen(doc,'visibilitychange',()=>{if(doc.hidden)hide();}));
  const observer=new win.ResizeObserver(()=>{if(opened)layout();});observer.observe(bar);observer.observe(orb);
  return {hide,layout,dispose(){disposed=true;clear();animation?.cancel();observer.disconnect();for(const remove of off)remove();}};
 },
 // Zotero's reader can leave native range pointer input inert. Keep the native
 // input for keyboard/accessibility, and handle primary pointer gestures locally.
 bindRangePointer(input) {
  const win=input.ownerDocument.defaultView;let pointer=null;
  const update=e=>{
   const box=input.getBoundingClientRect(),min=Number(input.min)||0,max=Number(input.max)||100,step=Number(input.step)||1;
   const inset=Math.min(6,box.width/2),width=box.width-2*inset;if(width<=0)return;
   let ratio=Math.max(0,Math.min(1,(e.clientX-box.left-inset)/width));
   if(win.getComputedStyle(input).direction==='rtl')ratio=1-ratio;
   const value=Math.max(min,Math.min(max,min+Math.round(ratio*(max-min)/step)*step));
   if(Number(input.value)===value)return;
   input.value=String(value);input.dispatchEvent(new win.Event('input',{bubbles:true}));
  };
  const down=e=>{
   if(input.disabled||e.button!==0||e.isPrimary===false||pointer!==null)return;
   e.preventDefault();e.stopPropagation();pointer=e.pointerId;
   input.focus({preventScroll:true});input.setPointerCapture(pointer);update(e);
  };
  const move=e=>{if(e.pointerId!==pointer)return;e.preventDefault();update(e);};
  const finish=e=>{
   if(e.pointerId!==pointer)return;
   if(e.type==='pointerup')update(e);
   const id=pointer;pointer=null;if(input.hasPointerCapture(id))input.releasePointerCapture(id);
   input.dispatchEvent(new win.Event('change',{bubbles:true}));
  };
  const handlers={pointerdown:down,pointermove:move,pointerup:finish,pointercancel:finish,lostpointercapture:finish};
  for(const [name,handler] of Object.entries(handlers))input.addEventListener(name,handler);
  return ()=>{const id=pointer;pointer=null;if(id!==null&&input.hasPointerCapture(id))input.releasePointerCapture(id);for(const [name,handler] of Object.entries(handlers))input.removeEventListener(name,handler);};
 },
 syncSelects(root) {root._pvSelects?.sync();},
 installTooltips(root,controller) {
  const doc=root.ownerDocument,win=doc.defaultView,tip=doc.createElementNS('http://www.w3.org/1999/xhtml','div');tip.className='pv-tooltip';tip.setAttribute('role','tooltip');tip.id='pv-tooltip';tip.hidden=true;root.append(tip);
  let target=null,timer=null,description=null;
  const owns=el=>el?.closest?.('[data-paper-voice]')&&!!el.closest('[data-paper-voice="shell"],[data-paper-voice="selection-card"],[data-paper-voice="toolbar"],[data-paper-voice="selection"],[data-paper-voice="translation"]');
  const collect=el=>{if(!owns(el))return;if(el.querySelector('.pl-flag')||el.matches('[data-paper-voice=toolbar],[data-action=settings],[data-action=close],[data-action=llmBack],[data-action=orb]')){delete el.dataset.pvTooltip;el.removeAttribute('title');return;}const hasTitle=el.hasAttribute('title');if(!hasTitle&&el.dataset.pvTooltip)return;const text=hasTitle?el.getAttribute('title'):el.matches('button,a')&&!el.textContent.trim()?el.getAttribute('aria-label'):null;if(text===null)return;const labelled=el.matches('[data-theme-choice],[data-mode],[data-settings-tab]')||el.textContent.trim()===text||el.closest('.pv-panel')&&el.matches('button')&&!el.matches('.pv-select-trigger,[data-action=llmRemoveKey]')&&!!el.textContent.trim();if(text&&!labelled)el.dataset.pvTooltip=text;else delete el.dataset.pvTooltip;if(hasTitle)el.removeAttribute('title');};
  const scan=el=>{collect(el);el.querySelectorAll?.('[title],[aria-label]').forEach(collect);};scan(doc.body||doc.documentElement);
  const observer=new win.MutationObserver(records=>{for(const rec of records){if(rec.type==='attributes')collect(rec.target);else rec.addedNodes.forEach(scan);}});observer.observe(doc.body||doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['title','aria-label']});
  const hide=()=>{win.clearTimeout(timer);if(target){if(description===null)target.removeAttribute('aria-describedby');else target.setAttribute('aria-describedby',description);}target=null;PaperVoiceUI.visibility(tip,false);};
  const show=el=>{
   if(el.querySelector('.pl-flag')||el.closest('[data-paper-voice=toolbar]')||!el.isConnected||el.matches(':disabled')||el.getAttribute('aria-expanded')==='true')return;const value=el.querySelector('.pv-select-value');if(value&&!el.classList.contains('pl-language-select')&&value.scrollWidth<=value.clientWidth+1)return;
   const text=el.dataset.pvTooltip;if(!text)return;
   target=el;description=el.getAttribute('aria-describedby');el.setAttribute('aria-describedby',((description||'')+' '+tip.id).trim());tip.textContent=controller.t(text);controller.applyTheme(tip);
   tip.style.left='0px';tip.style.top='0px';tip.style.visibility='hidden';PaperVoiceUI.visibility(tip,true);
   const b=el.getBoundingClientRect(),t=tip.getBoundingClientRect(),top=b.bottom+8;
   // Keep one consistent side. At the screen edge, omit a nonessential hint
   // rather than covering its control or jumping to another side.
   if(top+t.height>win.innerHeight-4){hide();tip.style.visibility='';return;}
   tip.style.left=Math.max(8,Math.min(b.left+(b.width-t.width)/2,win.innerWidth-t.width-8))+'px';tip.style.top=top+'px';tip.style.visibility='';
  };
  const enter=e=>{const el=e.target.closest?.('[data-pv-tooltip]');if(!owns(el)||el===target)return;hide();timer=win.setTimeout(()=>show(el),e.type==='focusin'?0:450);};
  const leave=e=>{if(!target||!target.contains(e.relatedTarget))hide();};
  doc.addEventListener('pointerover',enter);doc.addEventListener('pointerout',leave);doc.addEventListener('focusin',enter);doc.addEventListener('focusout',leave);doc.addEventListener('pointerdown',hide,true);doc.addEventListener('keydown',hide,true);doc.addEventListener('scroll',hide,true);win.addEventListener('resize',hide);
  return {hide,dispose(){hide();observer.disconnect();for(const [name,fn,capture] of [['pointerover',enter],['pointerout',leave],['focusin',enter],['focusout',leave],['pointerdown',hide,true],['keydown',hide,true],['scroll',hide,true]])doc.removeEventListener(name,fn,capture);win.removeEventListener('resize',hide);tip._pvFade?.cancel();tip.remove();}};
 },
 installSelects(root,controller) {
  const doc=root.ownerDocument,win=doc.defaultView,entries=[],portal=doc._pvSelectHost,menuDoc=portal?.ownerDocument||doc,menuWin=menuDoc.defaultView;
  let host=root;if(portal){host=menuDoc.createElementNS('http://www.w3.org/1999/xhtml','div');host.className='pv-shell pl-select-portal';host.style.cssText='position:fixed;width:0;height:0;right:0;bottom:0';const style=menuDoc.createElementNS('http://www.w3.org/1999/xhtml','style');style.textContent=controller.cssText;host.append(style);portal.append(host);}
  const box=el=>{const b=el.getBoundingClientRect(),x=win.mozInnerScreenX-menuWin.mozInnerScreenX,y=win.mozInnerScreenY-menuWin.mozInnerScreenY;return {left:b.left+x,right:b.right+x,top:b.top+y,bottom:b.bottom+y,width:b.width,height:b.height};};
  const menu=menuDoc.createElementNS('http://www.w3.org/1999/xhtml','div');menu.className='pv-select-popover';menu.dataset.field='selectPopover';menu.hidden=true;menu.setAttribute('role','listbox');host.append(menu);if(portal){menu.setAttribute('popover','manual');menu.style.margin='0';menu.style.inset='auto';}
  const isLanguage=select=>!!controller.flagURI&&['language','speechLanguage','target'].includes(select.dataset.field);
  const isProvider=select=>!!controller.providerMeta&&['provider','llmProvider'].includes(select.dataset.field);
  const isIcon=select=>isLanguage(select)||isProvider(select);
  const flag=(label,code)=>{const src=controller.flagURI(code);let img=label.querySelector('img');if(!img){img=label.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml','img');img.className='pl-flag';img.alt='';label.replaceChildren(img);}if(img.getAttribute('src')!==src)img.src=src;};
  const symbol=(select,label,code)=>{if(isLanguage(select)){flag(label,code);return;}const meta=controller.providerMeta(code);let img=label.querySelector('img');if(!img){img=label.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml','img');img.alt='';label.replaceChildren(img);}img.className='pl-provider-icon';if(img.getAttribute('src')!==meta.uri)img.src=meta.uri;img.dataset.provider=meta.id;};
  let active=null,index=-1,typeAhead='',typeTimer=null;
  const close=()=>{if(active){active.button.setAttribute('aria-expanded','false');active.button.removeAttribute('aria-activedescendant');}active=null;PaperVoiceUI.visibility(menu,false);if(portal&&menu.matches(':popover-open'))menu.hidePopover();};
  const choose=i=>{if(!active)return;const entry=active,option=entry.select.options[i];if(!option||option.disabled)return;entry.select.selectedIndex=i;close();entry.select.dispatchEvent(new win.Event('change',{bubbles:true}));entry.button.focus();sync();};
  const highlight=i=>{if(!active)return;const options=Array.from(active.select.options);if(!options.length)return;index=Math.max(0,Math.min(i,options.length-1));for(const row of menu.children)row.dataset.focused=String(Number(row.dataset.index)===index);const row=menu.children[index];if(row){active.button.setAttribute('aria-activedescendant',row.id);row.scrollIntoView({block:'nearest'});}};
  const open=entry=>{
   if(entry.select.disabled)return;
   close();active=entry;menu.replaceChildren();menu.classList.toggle('pl-language-menu',isIcon(entry.select));menu.id=entry.button.id+'-list';entry.button.setAttribute('aria-controls',menu.id);entry.button.setAttribute('aria-expanded','true');menu.setAttribute('aria-label',entry.button.getAttribute('aria-label')||entry.button.textContent);
   Array.from(entry.select.options).forEach((option,i)=>{const row=menuDoc.createElementNS('http://www.w3.org/1999/xhtml','div');row.id=menu.id+'-'+i;row.dataset.index=String(i);row.setAttribute('role','option');row.setAttribute('aria-selected',String(option.selected));row.setAttribute('aria-disabled',String(option.disabled));const label=menuDoc.createElementNS('http://www.w3.org/1999/xhtml','span');if(isIcon(entry.select)){symbol(entry.select,label,option.value);const name=isProvider(entry.select)?controller.providerMeta(option.value).label:option.textContent;if(!isLanguage(entry.select))row.title=name;row.setAttribute('aria-label',name);row.classList.add('pl-language-option');}else label.textContent=option.textContent;row.append(label);row.onpointermove=()=>highlight(i);row.onpointerdown=e=>e.preventDefault();row.onclick=()=>choose(i);menu.append(row);});
   if(portal){const css=win.getComputedStyle(root);for(const name of css)if(name.startsWith('--pv-'))host.style.setProperty(name,css.getPropertyValue(name));host.dataset.theme=root.dataset.theme;menu.hidden=false;menu.showPopover();}
   menu.style.maxHeight='230px';menu.style.width='max-content';menu.style.maxWidth=Math.max(80,Math.min(240,menuWin.innerWidth-16))+'px';menu.style.left='8px';menu.style.top='8px';PaperVoiceUI.visibility(menu,true);
   const b=box(entry.button),width=Math.min(Math.max(menu.offsetWidth,64),240,menuWin.innerWidth-16),below=menuWin.innerHeight-b.bottom-12,above=b.top-12,down=below>=Math.min(menu.scrollHeight,230)||below>=above,room=Math.max(36,down?below:above);
   menu.style.width=width+'px';menu.style.maxHeight=Math.min(230,room)+'px';menu.style.left=Math.max(8,Math.min(b.right-width,menuWin.innerWidth-width-8))+'px';menu.style.top=(down?b.bottom+5:Math.max(8,b.top-menu.offsetHeight-5))+'px';if(isIcon(entry.select)){const flagBox=box(entry.label.querySelector('img'));menu.style.left=Math.max(4,Math.min(flagBox.left+flagBox.width/2-menu.offsetWidth/2,menuWin.innerWidth-menu.offsetWidth-4))+'px';}else{const row=menu.querySelector('[role=option]>span');if(row){const delta=box(entry.label).right-row.getBoundingClientRect().right;menu.style.left=Math.max(8,Math.min(parseFloat(menu.style.left)+delta,menuWin.innerWidth-menu.offsetWidth-8))+'px';}}highlight(entry.select.selectedIndex);
  };
  for(const [i,select] of Array.from(root.querySelectorAll('select')).entries()){
   const wrapper=doc.createElementNS('http://www.w3.org/1999/xhtml','span');wrapper.className='pv-select';wrapper.dataset.selectField=select.dataset.field;
   select.before(wrapper);wrapper.append(select);select.hidden=true;select.tabIndex=-1;
   const button=doc.createElementNS('http://www.w3.org/1999/xhtml','button');button.type='button';button.className='pv-select-trigger';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
   const id=select.id||'pv-select-'+i;select.id=id+'-native';button.id=id;button.setAttribute('aria-label',select.getAttribute('aria-label')||doc.querySelector(`label[for="${id}"]`)?.textContent||'');
   const label=doc.createElementNS('http://www.w3.org/1999/xhtml','span');label.className='pv-select-value';button.append(label);const caret=doc.createElementNS('http://www.w3.org/1999/xhtml','span');caret.className='pv-select-arrow';caret.setAttribute('aria-hidden','true');button.append(caret);wrapper.append(button);
   const entry={select,button,label,wrapper};entries.push(entry);button.onclick=()=>active===entry?close():open(entry);
   button.onkeydown=e=>{
    if(['ArrowDown','ArrowUp','Home','End','Enter',' ','Escape','Tab'].includes(e.key)){
     if(e.key==='Tab'){close();return;}e.preventDefault();e.stopPropagation();
     if(e.key==='Escape'){close();return;}
     if(e.key==='Enter'||e.key===' '){if(active===entry)choose(index);else open(entry);return;}
     const wasOpen=active===entry;if(!wasOpen)open(entry);
     const options=Array.from(select.options),step=e.key==='ArrowUp'?-1:1;let next=e.key==='Home'?0:e.key==='End'?options.length-1:wasOpen?index+step:index;
     while(options[next]?.disabled)next+=step;highlight(next);return;
    }
    if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();if(active!==entry)open(entry);win.clearTimeout(typeTimer);typeAhead+=e.key.toLocaleLowerCase();typeTimer=win.setTimeout(()=>typeAhead='',700);const at=Array.from(select.options).findIndex(o=>!o.disabled&&o.textContent.toLocaleLowerCase().startsWith(typeAhead));if(at>=0)highlight(at);}
   };
   button.onblur=e=>{if(active===entry&&!menu.contains(e.relatedTarget))close();};
  }
  const sync=()=>{for(const e of entries){const text=isProvider(e.select)?controller.providerMeta(e.select.value).label:e.select.selectedOptions[0]?.textContent||'';if(isIcon(e.select)){symbol(e.select,e.label,e.select.value);e.button.classList.add('pl-language-select');e.button.setAttribute('aria-label',text);}else e.label.textContent=text;e.button.disabled=e.select.disabled;if(isLanguage(e.select)){e.button.removeAttribute('title');delete e.button.dataset.pvTooltip;}else e.button.title=text;}};
  const outside=e=>{if(active&&!active.wrapper.contains(e.target)&&!menu.contains(e.target))close();};
  const scroll=e=>{if(!menu.contains(e.target))close();};const surfaces=new Set([doc,menuDoc]);for(const d of surfaces){d.addEventListener('pointerdown',outside,true);d.addEventListener('scroll',scroll,true);}win.addEventListener('resize',close);menuWin.addEventListener('resize',close);portal?.addEventListener('cl-page-hidden',close);root._pvSelects={sync,close,menu,dispose(){win.clearTimeout(typeTimer);for(const d of surfaces){d.removeEventListener('pointerdown',outside,true);d.removeEventListener('scroll',scroll,true);}win.removeEventListener('resize',close);menuWin.removeEventListener('resize',close);portal?.removeEventListener('cl-page-hidden',close);menu._pvFade?.cancel();menu.remove();if(portal)host.remove();}};sync();
 },
 setMarkup(root, markup) {
  const doc=root.ownerDocument,parsed=new (doc.defaultView.DOMParser)().parseFromString(markup,'text/html');
  for(const node of parsed.querySelectorAll('script,iframe,object,embed'))node.remove();
  for(const node of parsed.querySelectorAll('*'))for(const attribute of [...node.attributes])if(/^on/i.test(attribute.name))node.removeAttribute(attribute.name);
  root.replaceChildren(...[...parsed.head.children,...parsed.body.childNodes].map(node=>doc.importNode(node,true)));
 },
 create(controller, reader) {
  const doc=reader._iframeWindow.document,win=doc.defaultView,root=doc.createElementNS('http://www.w3.org/1999/xhtml','div');let disposed=false;
  root.className='pv-shell';root.dataset.paperVoice='shell';root.dataset.state='idle';
  const icon=name=>`<img class="pv-icon" src="${controller.assetURI}icons/${name}.svg" alt=""/>`;
  const themeTile=t=>`<button type="button" data-theme-choice="${t.id}" aria-label="${t.name}" aria-pressed="false"><span class="pv-theme-swatch" style="background-color:${t.paper};background-image:url('${controller.assetURI}themes/${t.art}');color:${t.accent};--pv-swatch-mask:${t.paper}99;--pv-swatch-accent:${t.accent};--pv-swatch-text:${t.ink};--pv-swatch-ink:${t.dark?t.paper:'#ffffff'}"></span></button>`;
  this.setMarkup(root,`<style>${controller.cssText}</style><section class="pv-panel" data-paper-voice="panel" aria-label="Paper Loom 朗读控制" hidden>
   <header class="pv-header"><img class="pv-brand-icon" src="${controller.assetURI}mascot.png" alt=""/><div class="pv-brand">Paper Loom<span>论文听读</span></div><button class="pv-icon-button" data-action="settings" aria-label="声音与翻译设置">${icon('settings')}</button><button class="pv-icon-button" data-action="close" aria-label="收起朗读面板">${icon('x')}</button></header>
   <div data-field="home">
    <div class="pv-mode-options" role="group" aria-label="朗读模式">${PaperVoiceCore.modes.map(mode=>`<button data-mode="${mode.id}" aria-label="${mode.label}" title="${mode.label}" aria-pressed="false">${icon(mode.icon)}<span>${mode.short}</span></button>`).join('')}</div>
    <div class="pv-mode-note" data-field="modeNote"></div>
    <div class="pv-context-row" data-field="repeatRow" hidden><span>循环</span><select data-field="repeat" aria-label="循环次数"><option value="1">1 次</option><option value="0">持续循环</option><option value="2">2 次</option><option value="3">3 次</option><option value="5">5 次</option></select></div>
    <div class="pv-context-row" data-field="documentRow" hidden><span>起点</span><select data-field="documentStart" aria-label="全文朗读起点"><option value="begin">首页</option><option value="current">当前页</option><option value="resume">上次位置</option><option value="selection">选定句</option></select></div>
    <div class="pv-preview" data-field="preview" tabindex="0" role="region" aria-label="原文预览">选择一段文字，留一点时间给耳朵。</div>
    <div class="pv-progress-track"><div data-field="progressBar"></div></div><div class="pv-status" data-field="status" role="status" aria-live="polite"></div>
    <div class="pv-transport"><button class="pv-icon-button" data-action="previous" aria-label="上一句" title="上一句">${icon('chevron-left')}</button><button class="pv-primary" data-action="primary">${icon('headphones')}<span data-field="primaryLabel">开始朗读</span></button><button class="pv-icon-button" data-action="next" aria-label="下一句" title="下一句">${icon('chevron-right')}</button></div>
   </div>
   <div data-field="settingsPage" hidden>
    <div class="pv-settings-tabs" role="tablist" aria-label="设置分类"><button id="pv-tab-voice" data-settings-tab="voice" role="tab" aria-controls="pv-settings-voice" aria-selected="true">声音</button><button id="pv-tab-translation" data-settings-tab="translation" role="tab" aria-controls="pv-settings-translation" aria-selected="false" tabindex="-1">译文</button><button id="pv-tab-appearance" data-settings-tab="appearance" role="tab" aria-controls="pv-settings-appearance" aria-selected="false" tabindex="-1">外观</button><button id="pv-tab-shortcuts" data-settings-tab="shortcuts" role="tab" aria-controls="pv-settings-shortcuts" aria-selected="false" tabindex="-1">快捷键</button></div>
    <div class="pv-settings-content">
     <div id="pv-settings-voice" data-settings-pane="voice" role="tabpanel" aria-labelledby="pv-tab-voice">
    <div class="pv-setting-row"><label for="pv-speech-language">朗读语言</label><select id="pv-speech-language" data-field="speechLanguage" aria-label="朗读语言">${PaperVoiceCore.speechLanguages.map(x=>`<option value="${x.id}">${x.label}</option>`).join('')}</select></div>
    <div class="pv-setting-row"><label for="pv-voice">声音</label><select id="pv-voice" data-field="voice" aria-label="朗读声音"></select></div>
    <div class="pv-setting-row"><label for="pv-rate">语速</label><span data-field="rateLabel"></span></div><input id="pv-rate" class="pv-range" aria-label="朗读语速" data-field="rate" type="range" min="0.6" max="1.6" step="0.05"/>
    <label class="pv-setting-row" data-field="autoRow"><span>划选后自动朗读</span><input type="checkbox" data-field="auto"/></label>
    <button class="pv-sample" data-action="sample">${icon('headphones')}试听当前声音</button>
<div class="pv-engine-location"><span>声音位置</span><button data-action="resetEngineFolder" hidden>恢复自动</button><span class="pv-engine-error" data-field="engineFolderError" role="status" hidden></span><button data-action="chooseEngineFolder" aria-label="选择声音文件夹">${icon('folder')}<span class="pv-engine-spinner" aria-hidden="true"></span></button></div><div class="pv-updater"><div class="pv-update-row"><label><input type="checkbox" data-field="autoUpdate"/>自动检查</label><select data-field="updateInterval" aria-label="检查周期"><option value="1">1天</option><option value="7">1周</option><option value="30">1月</option></select><span data-field="updateStatus" class="pv-update-status" role="status">通过 GitHub 获取插件更新</span><button data-action="checkUpdate">检查更新</button></div></div><div class="pv-about"><span data-field="aboutVersion">Junyan Kang</span><button data-action="help">指南</button><button data-action="feedback">反馈</button><button data-action="privacy">隐私</button></div>
     </div>
     <div id="pv-settings-translation" data-settings-pane="translation" role="tabpanel" aria-labelledby="pv-tab-translation" hidden>
    <label class="pv-setting-row"><span>划词翻译</span><input type="checkbox" data-field="selectionTranslation"/></label>
    <label class="pv-setting-row"><span>显示译文</span><input type="checkbox" data-field="translation"/></label>
    <label class="pv-setting-row" data-field="readTranslationRow"><span>朗读译文</span><input type="checkbox" data-field="readTranslation"/></label>
    <div class="pv-setting-row"><label for="pv-provider">翻译服务</label><select id="pv-provider" data-field="provider" aria-label="翻译服务"><option value="tencenttransmart">腾讯</option><option value="bing">微软</option><option value="google">Google</option><option value="llm">大模型 · API</option></select></div>
    <button class="pv-llm-summary" data-action="configureLLM" hidden>${icon('sparkles')}<span data-field="llmSummary">配置大模型</span>${icon('chevron-right')}</button>
    <div class="pv-setting-row"><label for="pv-target">译文语言</label><select id="pv-target" data-field="target" aria-label="译文语言"><option value="zh-Hans">简体中文</option><option value="zh-Hant">繁體中文</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option><option value="es">Español</option><option value="ru">Русский</option></select></div>
    <div class="pv-setting-row pv-caption-style-row"><label for="pv-caption-font">译文字体</label><select id="pv-caption-font" data-field="captionFont" aria-label="译文字体"></select><select data-field="captionSize" aria-label="译文字号">${[10,11,12,13,14,15,16,18,20].map(n=>`<option value="${n}">${n} px</option>`).join('')}</select></div>
    <div class="pv-setting-row"><label for="pv-caption-placement">译文位置</label><select id="pv-caption-placement" data-field="captionPlacement" aria-label="译文位置"><option value="below">原文下方</option><option value="above">原文上方</option></select></div>
     </div>
     <div data-field="llmPage" hidden>
      <div class="pv-llm-heading"><button data-action="llmBack" aria-label="返回译文设置">${icon('chevron-left')}</button><span>大模型翻译</span><a data-action="llmHelp" href="#" aria-label="API 设置指南">${icon('file-text')}</a></div>
      <div class="pv-llm-row"><label for="pv-llm-provider">服务商</label><select id="pv-llm-provider" data-field="llmProvider" aria-label="大模型服务商">${controller.llmPresets.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
      <div class="pv-llm-row"><label for="pv-llm-model">模型</label><input id="pv-llm-model" data-field="llmModel" type="text" spellcheck="false" autocomplete="off" aria-label="模型名称" placeholder="Model ID"/></div>
      <div class="pv-llm-row"><label for="pv-llm-endpoint">地址</label><input id="pv-llm-endpoint" data-field="llmEndpoint" type="url" spellcheck="false" autocomplete="off" aria-label="API 地址" placeholder="https://…/v1"/></div>
      <div class="pv-llm-row"><label for="pv-llm-key">密钥</label><input id="pv-llm-key" data-field="llmKey" type="password" spellcheck="false" autocomplete="new-password" aria-label="API Key" placeholder="API Key"/><button data-action="llmRemoveKey" aria-label="移除已保存密钥" title="移除已保存密钥">${icon('trash-2')}</button></div>
      <div class="pv-llm-actions"><button data-action="llmSave">保存</button><button data-action="llmTest">保存并测试</button></div>
      <div class="pv-llm-result" data-field="llmResult" role="status" aria-live="polite">密钥仅存本机 · 费用由服务商收取</div>
     </div>
     <div id="pv-settings-appearance" data-settings-pane="appearance" role="tabpanel" aria-labelledby="pv-tab-appearance" hidden>
       <div class="pv-theme-browser" data-field="themeBrowser">
        <div class="pv-theme-choices" data-field="themeChoices" role="group" aria-label="窗口主题">${controller.themes.map(themeTile).join('')}</div>
       </div>
       <div class="pv-theme-choices pv-global-backgrounds" role="group" aria-label="全局背景">${controller.globalBackgrounds.map(t=>`<button type="button" data-global-background="${t.id}" aria-label="${t.name}" aria-pressed="false"><span class="pv-theme-swatch" style="background-image:url('${controller.assetURI}themes/${t.art}')"></span></button>`).join('')}<button type="button" data-field="customBackground" data-action="customBackground" class="pv-custom-background" aria-label="导入背景图片" aria-pressed="false"><span class="pv-theme-swatch">${icon('image-add')}</span></button></div>
       <span class="pv-theme-hint" data-field="themeHint" role="status"></span>
       <div class="pv-setting-row pv-transparency-row"><label for="pv-transparency">透明度</label><input id="pv-transparency" data-field="transparency" type="range" min="0" max="80" step="1" aria-label="窗口透明度"/><span data-field="transparencyLabel">0%</span></div>
       <div class="pv-setting-row"><label for="pv-language">界面语言</label><select id="pv-language" data-field="language" aria-label="Interface language / 界面语言"><option value="auto">跟随系统</option><option value="zh">简体中文</option><option value="en">English</option><option value="ja">日本語</option><option value="fr">Français</option><option value="de">Deutsch</option></select></div>
       <div class="pv-setting-row pv-companion-row"><label for="pv-companion">角色互动</label><button class="pv-companion-preview" data-action="previewCompanion" aria-label="预览动作" title="预览动作">${icon('companion-preview')}</button><select data-field="companionInterval" aria-label="互动间隔" title="互动间隔">${[1,3,5,10,15,30].map(n=>`<option value="${n}">${n} 分钟</option>`).join('')}</select><input id="pv-companion" type="checkbox" data-field="companion"/></div>
     </div>
     <div id="pv-settings-shortcuts" data-settings-pane="shortcuts" role="tabpanel" aria-labelledby="pv-tab-shortcuts" hidden>
      <div class="pv-shortcut-list">${PaperVoiceShortcuts.actions.map((a,i)=>`<div class="pv-shortcut-row${i&&a.group!==PaperVoiceShortcuts.actions[i-1].group?' pv-shortcut-group':''}" data-shortcut-row="${a.id}"><span>${a.label}</span><button class="pv-shortcut-key" data-shortcut="${a.id}" aria-label="${a.label}"></button><button class="pv-shortcut-clear" data-shortcut-clear="${a.id}" aria-label="清除快捷键" hidden>${icon('x')}</button></div>`).join('')}</div>
      <div class="pv-shortcut-footer"><button data-action="resetShortcuts" aria-label="恢复默认" title="恢复默认">${icon('rotate-ccw')}</button></div>
      <div class="pv-shortcut-status" data-field="shortcutStatus" role="status" aria-live="polite"></div>
     </div>
    </div>

   </div>
  </section><div class="pv-mini"><div class="pv-quick" data-field="quick" hidden><div class="pv-mode-tools" data-field="modeTools"><button class="pv-quick-mode" data-action="quickMode" aria-label="切换朗读模式">${icon("text-select")}<span data-field="quickModeLabel">划选</span></button><div class="pv-choice-popover pv-mode-popover" data-field="modePopover" role="group" aria-label="朗读模式" hidden>${PaperVoiceCore.modes.map(x=>`<button data-quick-mode="${x.id}" aria-label="${x.short}" title="${x.short}">${icon(x.icon)}<span>${x.short}</span></button>`).join('')}</div></div><div class="pv-playback-tools" data-field="playbackTools"><button data-action="quickPause" aria-label="暂停或继续" aria-expanded="false">${icon('pause')}</button><div class="pv-nav-popover" data-field="navigation" hidden><div class="pv-nav-card" role="group" aria-label="阅读导航"><div class="pv-nav-scopes" data-field="navigationScopes"><div class="pv-nav-row" data-field="sentenceNavigation"><span>句子</span><button data-action="quickSentencePrevious" aria-label="上一句" title="上一句">${icon('chevron-left')}</button><button data-action="quickSentenceReplay" aria-label="重读当前句" title="重读当前句">${icon('repeat-sentence')}</button><button data-action="quickSentenceNext" aria-label="下一句" title="下一句">${icon('chevron-right')}</button></div><div class="pv-nav-row" data-field="paragraphNavigation"><span>段落</span><button data-action="quickPrevious" aria-label="上一段" title="上一段">${icon('chevrons-left')}</button><button data-action="quickReplay" aria-label="重读当前段" title="重读当前段">${icon('repeat-paragraph')}</button><button data-action="quickNext" aria-label="下一段" title="下一段">${icon('chevrons-right')}</button></div></div><div class="pv-nav-row pv-stop-row" data-field="stopNavigation"><span>结束本次朗读</span><button data-action="quickStop" aria-label="停止朗读">${icon('square')}</button></div></div></div></div><div class="pv-translation-tools" data-field="translationTools"><button data-action="quickTranslate" aria-label="切换译文显示" title="译文开关 · Option/Alt + T"><span class="pv-language-token" data-field="quickTranslateLabel" aria-hidden="true"><img class="pl-flag" src="${controller.flagURI?.(controller.get('translationTarget','zh-Hans'))||''}" alt=""/></span><span class="pv-translation-audio-indicator" data-field="quickTranslationAudio" aria-hidden="true" hidden>${icon("headphones")}</span></button><div class="pv-choice-popover pv-language-popover" data-field="audioPopover" role="group" aria-label="译文语言" hidden>${['zh-Hans','zh-Hant','ja','ko','fr','en','de','es','ru'].map(code=>{const x=controller.translationLanguage(code);return `<button data-quick-language="${code}" aria-label="${x.label}" title="${x.label}"><img class="pl-flag" src="${controller.flagURI?.(code)||''}" alt=""/></button>`;}).join('')}</div></div></div><button class="pv-orb" data-action="orb" aria-label="展开 Paper Loom 朗读面板" title="Paper Loom · 点击展开听读"><img class="pv-mascot" src="${controller.assetURI}mascot.png" alt="Paper Loom 书页精灵"/><img class="pv-mascot pv-mascot-reading" src="${controller.assetURI}mascot-reading.png" alt=""/><span class="pv-mascot-interaction" data-field="mascotInteraction" aria-hidden="true"></span><span class="pv-waves" aria-hidden="true"><i></i><i></i><i></i></span><span class="pv-dot"></span></button><button class="pv-update-badge" data-action="updateNotice" aria-label="发现新版本" aria-expanded="false" hidden>${icon('arrow-up')}</button><div class="pv-update-notice" data-field="updateNotice" hidden><div class="pv-update-notice-heading"><span>发现新版本</span><strong data-field="updateNoticeVersion"></strong><button data-action="closeUpdateNotice" aria-label="关闭">${icon('x')}</button></div><div class="pv-update-feedback" data-field="updateFeedback" hidden><div class="pv-update-progress-label"><span class="pv-update-spinner" aria-hidden="true"></span><span data-field="updatePhase" role="status" aria-live="polite"></span><span data-field="updatePercent" aria-hidden="true"></span></div><div class="pv-update-meter" data-field="updateMeter" role="progressbar" aria-label="更新进度" aria-valuemin="0" aria-valuemax="100"><span data-field="updateFill"></span></div></div><div class="pv-update-notice-actions" data-field="updateNoticeActions"><button data-action="ignoreUpdate">忽略此版本</button><button data-action="installNotice">安装更新</button></div></div></div>`);
  const visible=(el,show)=>PaperVoiceUI.visibility(el,show);
  const find=name=>root.querySelector(`[data-field="${name}"]`),action=name=>root.querySelector(`[data-action="${name}"]`),panel=root.querySelector('.pv-panel');
  if(controller.version)find('aboutVersion').textContent='v'+controller.version+' · Junyan Kang';
  for(const v of PaperVoiceCore.voices){const o=doc.createElementNS('http://www.w3.org/1999/xhtml','option');o.value=v.id;o.textContent=v.label;find('voice').append(o);}
  const settings=(open)=>{root._pvCloseThemePicker?.();cancelShortcutRecording?.();if(!open)find('llmKey').value='';find('home').hidden=open;find('settingsPage').hidden=!open;action('settings').querySelector('img').src=controller.assetURI+'icons/'+(open?'chevron-left':'settings')+'.svg';action('settings').setAttribute('aria-label',open?'返回播放控制':'声音与翻译设置');controller.localize?.(root);};
  action('settings').onclick=()=>{settings(find('settingsPage').hidden);controller.loadUpdateSettings();fit();};
  const fit=()=>{const right=parseFloat(root.style.right)||18,bottom=parseFloat(root.style.bottom)||18;panel.style.transform=`translate(${Math.max(0,right+panel.offsetWidth+8-win.innerWidth)}px,${Math.max(0,bottom+root.offsetHeight+8-win.innerHeight)}px)`;};
  action('orb').onclick=()=>controller.showPanel(reader,true);action('close').onclick=()=>{root._pvCloseThemePicker?.();cancelShortcutRecording();find('llmKey').value='';visible(panel,false);};
  const dockMotion=PaperVoiceDockMotion.create(panel,action('orb'),fit);
  const selectSettingsTab=name=>{
   root._pvCloseThemePicker?.();cancelShortcutRecording();
   find('llmPage').hidden=true;find('llmKey').value='';find('llmResult').textContent=controller.t('密钥仅存本机 · 费用由服务商收取');
   for(const button of root.querySelectorAll('[data-settings-tab]')){const active=button.dataset.settingsTab===name;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
   for(const pane of root.querySelectorAll('[data-settings-pane]'))pane.hidden=pane.dataset.settingsPane!==name;
   if(name==='appearance')root._pvRevealTheme?.();
  };
  for(const button of root.querySelectorAll('[data-settings-tab]')){
   button.onclick=()=>selectSettingsTab(button.dataset.settingsTab);
   button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const tabs=Array.from(root.querySelectorAll('[data-settings-tab]')),i=tabs.indexOf(button),next=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];selectSettingsTab(next.dataset.settingsTab);next.focus();};
  }
  let recordingShortcut=null;
  const shortcutMessage=message=>{find('shortcutStatus').textContent=controller.t(message);};
  const syncShortcutBindings=()=>{
   const bindings=controller.shortcutBindings();
   for(const a of PaperVoiceShortcuts.actions){
    const button=root.querySelector(`[data-shortcut="${a.id}"]`),recording=recordingShortcut===a.id;
    button.textContent=recording?controller.t('按下新按键…'):controller.shortcutLabel(a.id);
    button.setAttribute('aria-pressed',String(recording));
    button.setAttribute('aria-label',controller.t(a.label)+' · '+button.textContent);
    button.closest('.pv-shortcut-row').dataset.recording=String(recording);
    root.querySelector(`[data-shortcut-clear="${a.id}"]`).hidden=!recording;
   }
  };
  const cancelShortcutRecording=()=>{
   if(!recordingShortcut)return;recordingShortcut=null;syncShortcutBindings();shortcutMessage('');
  };
  const assignShortcut=(id,key)=>{
   recordingShortcut=null;
   const result=controller.setShortcut(id,key);syncShortcutBindings();
   if(!result.ok){shortcutMessage('此按键无法使用');return;}
   const conflict=result.conflict;
   let message=controller.t(key?'快捷键已保存':'快捷键已清除');
   if(conflict){const label=controller.t(PaperVoiceShortcuts.actions.find(a=>a.id===conflict.id).label);message=label+' → '+controller.shortcutLabel(conflict.id);}
   if(key&&PaperVoiceShortcuts.systemKey(key,Zotero.isMac))message+=' · '+controller.t('系统可能占用此组合');
   find('shortcutStatus').textContent=message;
  };
  for(const button of root.querySelectorAll('[data-shortcut]'))button.onclick=()=>{
   if(recordingShortcut===button.dataset.shortcut){cancelShortcutRecording();return;}
   recordingShortcut=button.dataset.shortcut;syncShortcutBindings();shortcutMessage('按下组合键 · 点击别处取消');
  };
  for(const button of root.querySelectorAll('[data-shortcut-clear]'))button.onclick=()=>assignShortcut(button.dataset.shortcutClear,null);
  action('resetShortcuts').onclick=()=>{cancelShortcutRecording();controller.resetShortcuts();syncShortcutBindings();shortcutMessage('已恢复默认快捷键');};
  const recordShortcut=e=>{
   if(!recordingShortcut)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(e.repeat||e.isComposing)return;
   const key=PaperVoiceShortcuts.eventKey(e,Zotero.isMac);if(key)assignShortcut(recordingShortcut,key);
  };
  const cancelOutside=e=>{if(recordingShortcut&&!e.target.closest?.('[data-shortcut],[data-shortcut-clear]'))cancelShortcutRecording();};
  win.addEventListener('keydown',recordShortcut,true);doc.addEventListener('pointerdown',cancelOutside,true);
  syncShortcutBindings();
  const themeChoices=find('themeChoices'),themeButtons=[...themeChoices.querySelectorAll('[data-theme-choice]')];
  root._pvRevealTheme=()=>{};root._pvCloseThemePicker=()=>{};
  const themeKeyboard=buttons=>{for(const b of buttons)b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const i=buttons.indexOf(b),delta=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:e.key==='ArrowDown'?5:-5,j=e.key==='Home'?0:e.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,i+delta));buttons.forEach((x,k)=>x.tabIndex=k===j?0:-1);buttons[j].focus();};};
  themeKeyboard(themeButtons);for(const b of themeButtons)b.onclick=()=>controller.setTheme(b.dataset.themeChoice);
  const backgrounds=[...root.querySelectorAll('[data-global-background]')];themeKeyboard([...backgrounds,action('customBackground')]);for(const b of backgrounds)b.onclick=()=>controller.setGlobalBackground(b.dataset.globalBackground);
  action('customBackground').onclick=async()=>{const b=action('customBackground');if(b.disabled)return;b.disabled=true;find('themeHint').textContent='';try{if(controller.customThemeImage)await controller.removeThemeImage();else await controller.chooseThemeImage();}catch(e){find('themeHint').textContent=String(e.message||e);}finally{b.disabled=false;controller.syncSettings();}};
  find('companionInterval').onchange=e=>controller.setCompanionInterval(e.target.value);
  find('companion').onchange=e=>{controller.set('companionInteractions',e.target.checked);if(!e.target.checked)finishInteraction();};
  find('language').onchange=e=>{controller.setLanguage(e.target.value);fit();};
  find('speechLanguage').onchange=e=>{controller.setSpeechLanguage(e.target.value);fit();};
  find('captionFont').onchange=e=>controller.setCaptionStyle('captionFont',e.target.value);find('captionSize').onchange=e=>controller.setCaptionStyle('captionSize',e.target.value);
  find('captionPlacement').onchange=e=>controller.setCaptionPlacement(e.target.value);
  find('transparency').oninput=e=>controller.setSurfaceTransparency(e.target.value);
  find('transparency').onchange=()=>Services.prefs.savePrefFile(null);
  const disposeTransparency=this.bindRangePointer(find('transparency'));
  find('readTranslation').onchange=e=>controller.setReadTranslation(e.target.checked);
  find('selectionTranslation').onchange=e=>{controller.set('selectionTranslation',e.target.checked);controller.syncSettings();};
  find('translation').onchange=e=>controller.toggleTranslation(e.target.checked);
  action('quickTranslate').onclick=e=>controller.quickTranslationClick(e);
  action('quickTranslate').ondblclick=e=>{e.preventDefault();controller.quickTranslationDoubleClick();};
  find('target').onchange=e=>controller.setTranslationTarget(e.target.value);
  find('provider').onchange=e=>{if(e.target.value==='llm'){openLLM();return;}controller.set('translationProvider',e.target.value);if(e.target.value==='tencenttransmart'&&controller.get('translationTarget','zh-Hans')==='zh-Hant')controller.set('translationTarget','zh-Hans');controller.translationTicket++;controller.hideTranslation();controller.syncSettings();if(controller.get('translation',false))controller.toggleTranslation(true);};
  let llmLoad=0;
  const loadLLM=async id=>{
   const ticket=++llmLoad;
   const config=controller.llmConfig(id);find('llmProvider').value=config.id;find('llmEndpoint').value=config.endpoint;find('llmModel').value=config.model;find('llmKey').value='';
   let saved=false;try{saved=!!config.endpoint&&!!await controller.llmKey(config);}catch(_){}
   if(ticket!==llmLoad)return;
   find('llmKey').placeholder=controller.t(saved?'已保存 · 留空保留':'API Key');action('llmRemoveKey').disabled=!saved;PaperVoiceUI.syncSelects(root);
  };
  const openLLM=()=>{selectSettingsTab('translation');root.querySelector('[data-settings-pane=translation]').hidden=true;find('llmPage').hidden=false;loadLLM(controller.get('llmProvider','minimax'));};
  const draftLLM=()=>({...controller.llmConfig(find('llmProvider').value),endpoint:find('llmEndpoint').value.trim(),model:find('llmModel').value.trim()});
  const saveLLM=async test=>{
   action('llmSave').disabled=action('llmTest').disabled=true;find('llmResult').dataset.state='loading';find('llmResult').textContent=controller.t(test?'正在测试…':'正在保存…');
   try{
    await controller.saveLLM(draftLLM(),find('llmKey').value);find('llmKey').value='';find('llmKey').placeholder=controller.t('已保存 · 留空保留');action('llmRemoveKey').disabled=false;
    if(test){const result=await controller.translate('Light is converted into neural signals in the retina.','en',{provider:'llm',target:'zh-Hans',noCache:true});find('llmResult').textContent=controller.t('连接成功')+' · '+(result.totalMs/1000).toFixed(2)+' s';find('llmResult').title=result.text;}
    else find('llmResult').textContent=controller.t('已保存');
    find('llmResult').dataset.state='ready';
   }catch(error){find('llmResult').textContent=controller.t(error.message);find('llmResult').title=controller.t(error.message);find('llmResult').dataset.state='error';}
   finally{action('llmSave').disabled=action('llmTest').disabled=false;}
  };
  action('configureLLM').onclick=openLLM;action('llmBack').onclick=()=>{selectSettingsTab('translation');controller.syncSettings();};
  find('llmProvider').onchange=e=>{loadLLM(e.target.value);find('llmResult').textContent=controller.t('密钥仅存本机 · 费用由服务商收取');};
  action('llmSave').onclick=()=>saveLLM(false);action('llmTest').onclick=()=>saveLLM(true);
  action('llmRemoveKey').onclick=async()=>{try{await controller.removeLLMKey(controller.validateLLM(draftLLM()));await loadLLM(find('llmProvider').value);find('llmResult').textContent=controller.t('密钥已移除');}catch(error){find('llmResult').textContent=controller.t(error.message);}};
  action('llmHelp').onclick=e=>{e.preventDefault();Zotero.launchURL('https://github.com/JunyanKang/paper-loom/blob/main/docs/'+(controller.language()==='zh'?'SETTINGS.md':'SETTINGS.en.md'));};
  find('voice').onchange=e=>{controller.set('voiceFor_'+controller.settingsVoiceLanguage(),e.target.value);if(!controller.get('readTranslation',false))controller.set('voice',e.target.value);controller.syncSettings();controller.setStatus('声音已保存，下次开始朗读生效');};
  find('rate').oninput=e=>{controller.set('rate',PaperVoiceCore.rate(e.target.value));controller.syncSettings();};
  find('rate').onchange=()=>{controller.setStatus('语速已更新，下次开始朗读生效');};
  find('repeat').onchange=e=>{controller.set(controller.get('mode','selection')==='selection'?'selectionRepeat':'repeat',Number(e.target.value));controller.syncSettings();};
  find('documentStart').onchange=e=>{controller.set('documentStart',e.target.value);controller.syncSettings();};
  find('auto').onchange=e=>{controller.set('auto',e.target.checked);controller.clearSelectionTimers();if(!e.target.checked&&controller.playbackMode!=='document')controller.stop();controller.syncSettings();};
  for(const button of root.querySelectorAll('[data-mode]'))button.onclick=()=>controller.setMode(button.dataset.mode);
  for(const [name,delta] of [['Previous',-1],['Replay',0],['Next',1]]){
   action('quick'+name).onclick=()=>controller.navigateScope(delta,reader,'paragraph');
   action('quickSentence'+name).onclick=()=>controller.navigateScope(delta,reader,'sentence');
  }
  const quickBar=find('quick'),quickSurface=doc.createElementNS('http://www.w3.org/1999/xhtml','div'),quickFill=doc.createElementNS('http://www.w3.org/1999/xhtml','div');quickSurface.className='pv-quick-surface';quickFill.className='pv-quick-fill';quickSurface.append(quickFill);quickBar.append(quickSurface);quickSurface.hidden=true;
  const joinQuickSurface=(popup,lower=null)=>{
   if(!popup){delete quickBar.dataset.connected;quickSurface.hidden=true;return;}
   const bar=quickBar.getBoundingClientRect(),part=popup.getBoundingClientRect(),low=lower?.getBoundingClientRect(),left=Math.min(bar.left,part.left),top=Math.min(bar.top,part.top),right=Math.max(bar.right,part.right),bottom=Math.max(bar.bottom,part.bottom,low?.bottom||0),down=popup.dataset.side==='below';
   let points=down?[[bar.left,bar.top],[bar.right,bar.top],[bar.right,bar.bottom],[part.right,bar.bottom],[part.right,part.bottom],[part.left,part.bottom],[part.left,bar.bottom],[bar.left,bar.bottom]]:[[part.left,part.top],[part.right,part.top],[part.right,bar.top],[bar.right,bar.top],[bar.right,bar.bottom],[bar.left,bar.bottom],[bar.left,bar.top],[part.left,bar.top]];
   if(low)points=[[part.left,part.top],[part.right,part.top],[part.right,bar.top],[bar.right,bar.top],[bar.right,bar.bottom],[low.right,bar.bottom],[low.right,low.bottom],[low.left,low.bottom],[low.left,bar.bottom],[bar.left,bar.bottom],[bar.left,bar.top],[part.left,bar.top]];
   points=points.map(([x,y])=>[x-left,y-top]).filter((p,i,a)=>i===0||Math.hypot(p[0]-a[i-1][0],p[1]-a[i-1][1])>.5);
   if(Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<.5)points.pop();
   // Remove collinear edges before rounding both outer and inner corners.
   points=points.filter((p,i,a)=>{const prev=a[(i+a.length-1)%a.length],next=a[(i+1)%a.length];return Math.abs((p[0]-prev[0])*(next[1]-p[1])-(p[1]-prev[1])*(next[0]-p[0]))>.5;});
   const corners=points.map((p,i,a)=>{const prev=a[(i+a.length-1)%a.length],next=a[(i+1)%a.length],before=Math.hypot(p[0]-prev[0],p[1]-prev[1]),after=Math.hypot(next[0]-p[0],next[1]-p[1]),radius=Math.min(12,before/2,after/2);return {p,start:[p[0]+(prev[0]-p[0])*radius/before,p[1]+(prev[1]-p[1])*radius/before],end:[p[0]+(next[0]-p[0])*radius/after,p[1]+(next[1]-p[1])*radius/after]};});
   if(!corners.length)return;const path=corners.map((c,i)=>(i?'L':'M')+c.start.join(' ')+' Q'+c.p.join(' ')+' '+c.end.join(' ')).join(' ')+' Z';
   quickSurface.style.cssText=`left:${left-bar.left}px;top:${top-bar.top}px;width:${right-left}px;height:${bottom-top}px`;quickFill.style.clipPath='path("'+path+'")';quickSurface.hidden=false;quickBar.dataset.connected='true';
  };
  const tools=find('playbackTools'),navigation=find('navigation');let closeTimer=null,hovering=false;
  const closeNavigation=()=>{win.clearTimeout(closeTimer);visible(navigation,false);if(quickBar.dataset.connectedOwner==='navigation')joinQuickSurface(null);action('quickPause').setAttribute('aria-expanded','false');};
  const openNavigation=()=>{
   win.clearTimeout(closeTimer);
   if(!['playing','paused','loading'].includes(controller.state))return;
   closeAudioPopover();closeModePopover();const alreadyOpen=!navigation.hidden&&navigation.dataset.pvVisible==='true';if(alreadyOpen)return;
   if(!alreadyOpen){navigation._pvFade?.cancel();navigation._pvFade=null;}
   // Complete geometry before creating the first composited animation frame.
   navigation.style.visibility='hidden';navigation.hidden=false;
   action('quickPause').setAttribute('aria-expanded','true');
   navigation.style.cssText='position:absolute;left:0;top:0;width:31px;height:31px;visibility:hidden';
   const upper=find('navigationScopes'),lower=find('stopNavigation'),anchor=tools.getBoundingClientRect();
   upper.style.maxHeight=Math.max(40,anchor.top-13)+'px';
   // Reserve space below the pause anchor; compact controls remain reachable at the bottom edge.
   lower.style.maxHeight=Math.max(25,win.innerHeight-anchor.bottom-5)+'px';
   navigation.style.visibility='';if(!alreadyOpen){navigation.hidden=true;visible(navigation,true);}quickBar.dataset.connectedOwner='navigation';joinQuickSurface(upper,lower);

  };
  const leaveNavigation=()=>{win.clearTimeout(closeTimer);closeTimer=win.setTimeout(()=>{if(!hovering&&!(tools.contains(doc.activeElement)&&doc.activeElement.matches(':focus-visible')))closeNavigation();},300);};
  tools.addEventListener('pointerenter',()=>{hovering=true;openNavigation();});tools.addEventListener('pointerleave',()=>{hovering=false;leaveNavigation();});
  tools.addEventListener('focusin',openNavigation);tools.addEventListener('focusout',e=>{if(!tools.contains(e.relatedTarget))leaveNavigation();});
  tools.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();action('quickPause').focus();closeNavigation();return;}
   if(e.key==='ArrowUp'||e.key==='ArrowDown'){
    e.preventDefault();e.stopPropagation();openNavigation();
    const buttons=Array.from(navigation.querySelectorAll('button')).filter(b=>!b.disabled&&!b.parentElement.hidden);
    const at=buttons.indexOf(doc.activeElement),step=e.key==='ArrowDown'?1:-1;
    buttons[(at<0?0:(at+step+buttons.length)%buttons.length)]?.focus();
   }
  });
  // Keep the current choice in its original hit target; alternatives grow above it.
  const choiceMenus=[];
  const bindChoiceMenu=(host,popup,trigger)=>{
   let timer=null;
   const close=()=>{win.clearTimeout(timer);visible(popup,false);if(quickBar.dataset.connectedOwner===popup.dataset.field)joinQuickSurface(null);trigger.setAttribute('aria-expanded','false');};
   const open=()=>{
    win.clearTimeout(timer);if(popup.dataset.pvVisible==='true'&&!popup.hidden)return;closeNavigation();for(const menu of choiceMenus)if(menu.popup!==popup)menu.close();
    popup.style.visibility='hidden';popup.hidden=false;popup.style.maxHeight='';popup.dataset.side='above';popup.style.right='-5px';
    const anchor=trigger.getBoundingClientRect(),box=popup.getBoundingClientRect(),above=anchor.top-8,below=win.innerHeight-anchor.bottom-8;
    const side=box.height>above&&below>above?'below':'above';popup.dataset.side=side;
    popup.style.maxHeight=Math.max(40,(side==='above'?above:below))+'px';
    if(box.left<8)popup.style.right=(box.left-8)+'px';
    popup.style.visibility='';visible(popup,true);trigger.setAttribute('aria-expanded','true');quickBar.dataset.connectedOwner=popup.dataset.field;joinQuickSurface(popup);
   };
   const leave=()=>{win.clearTimeout(timer);timer=win.setTimeout(()=>{if(!host.matches(':hover')&&!(host.contains(doc.activeElement)&&doc.activeElement.matches(':focus-visible')))close();},260);};
   host.addEventListener('pointerenter',open);host.addEventListener('pointerleave',leave);host.addEventListener('focusin',e=>{if(e.target.matches(':focus-visible'))open();});host.addEventListener('focusout',e=>{if(!host.contains(e.relatedTarget))leave();});
   host.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();trigger.focus();close();return;}
    if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
    e.preventDefault();e.stopPropagation();open();const buttons=[...popup.querySelectorAll('button:not([hidden]):not(:disabled)'),trigger],i=buttons.indexOf(doc.activeElement);
    buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length]?.focus();
   });
   const menu={popup,close,open,dispose(){win.clearTimeout(timer);popup._pvFade?.cancel();}};choiceMenus.push(menu);return menu;
  };
  const translationTools=find('translationTools'),audioPopover=find('audioPopover'),modeTools=find('modeTools'),modePopover=find('modePopover');
  const audioMenu=bindChoiceMenu(translationTools,audioPopover,action('quickTranslate')),modeMenu=bindChoiceMenu(modeTools,modePopover,action('quickMode'));
  const closeAudioPopover=()=>audioMenu.close(),closeModePopover=()=>modeMenu.close();
  for(const b of modePopover.querySelectorAll('button'))b.onclick=()=>{controller.setMode(b.dataset.quickMode);closeModePopover();};
  for(const b of audioPopover.querySelectorAll('button'))b.onclick=()=>{controller.setTranslationTarget(b.dataset.quickLanguage);closeAudioPopover();};
  const quickReveal=this.bindQuickReveal(root,find('quick'),action('orb'),()=>{closeNavigation();closeAudioPopover();closeModePopover();});
  action('orb').addEventListener('pointerenter',()=>controller.scheduleWarmup());
  action('orb').addEventListener('pointerleave',()=>{if(panel.hidden){controller.host.clearTimeout(controller.warmupTimer);controller.warmupTimer=null;}});
  root.addEventListener('pointerdown',e=>{if(!tools.contains(e.target))closeNavigation();if(!translationTools.contains(e.target))closeAudioPopover();if(!modeTools.contains(e.target))closeModePopover();});
  action('quickMode').onclick=()=>modeMenu.open();
  action('chooseEngineFolder').onclick=()=>controller.chooseEngineFolder();action('resetEngineFolder').onclick=()=>controller.setEngineFolder('');
  action('checkUpdate').onclick=()=>controller.availableUpdateVersion()?controller.installUpdate():controller.checkForUpdates();
  find('autoUpdate').onchange=e=>controller.setAutoUpdate(e.target.checked);
  find('updateInterval').onchange=e=>controller.setUpdateInterval(e.target.value);
  const closeUpdateNotice=()=>{visible(find('updateNotice'),false);action('updateNotice').setAttribute('aria-expanded','false');};
  action('updateNotice').onclick=()=>{const open=find('updateNotice').hidden||find('updateNotice').dataset.pvVisible==='false';visible(find('updateNotice'),open);action('updateNotice').setAttribute('aria-expanded',String(open));};
  action('closeUpdateNotice').onclick=closeUpdateNotice;
  action('ignoreUpdate').onclick=()=>{controller.ignoreUpdate();closeUpdateNotice();};
  action('installNotice').onclick=()=>controller.installUpdate();
  const outsideUpdateNotice=e=>{if(!find('updateNotice').contains(e.target)&&!action('updateNotice').contains(e.target))closeUpdateNotice();};
  doc.addEventListener('pointerdown',outsideUpdateNotice,true);
  action('primary').onclick=()=>controller.primary(reader);action('previous').onclick=()=>controller.stepSentence(-1,reader);action('next').onclick=()=>controller.stepSentence(1,reader);
  action('quickStop').onclick=()=>controller.stop();action('quickPause').onclick=()=>controller.primary(reader);
  for(const [name,path] of Object.entries({help:'/blob/main/docs/GUIDE.md',feedback:'/issues',privacy:'/blob/main/docs/PRIVACY.md'}))action(name).onclick=()=>Zotero.launchURL('https://github.com/JunyanKang/paper-loom'+(name==='help'&&controller.language?.()!=='zh'?'/blob/main/docs/GUIDE.en.md':path));
  action('sample').onclick=()=>controller.speak(PaperVoiceCore.speechLanguages.find(x=>x.id===controller.settingsVoiceLanguage()).sample,reader,true);
  let drag=null,moved=false;
  action('orb').addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,right:parseFloat(root.style.right)||18,bottom:parseFloat(root.style.bottom)||18};moved=false;action('orb').setPointerCapture(e.pointerId);});
  action('orb').addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)moved=true;if(moved){dockMotion.finish();quickReveal.hide();closeNavigation();root.style.right=Math.max(8,Math.min(win.innerWidth-root.querySelector('.pv-mini').offsetWidth-8,drag.right-dx))+'px';root.style.bottom=Math.max(8,Math.min(win.innerHeight-70,drag.bottom-dy))+'px';if(!panel.hidden)fit();}});
  action('orb').addEventListener('pointerup',()=>{drag=null;});
  action('orb').addEventListener('click',e=>{if(moved){e.stopImmediatePropagation();e.preventDefault();moved=false;}},true);
  let nextInteraction=Date.now()+controller.companionIntervalMs(),readingSince=null,readingElapsed=0,lastBreakAt=0;
  let companionContext='ready';
  const gestureQueues=Object.fromEntries(Object.keys(PaperVoiceCompanion.sets).map(k=>[k,[]])),lastGestures={},sprite=find('mascotInteraction');
  const player=PaperVoiceCompanion.player(sprite,controller.assetURI,()=>{root.dataset.resting='true';});
  let dockGesture=false,dockPose=false;
  player.preload('dock-present');
  const finishInteraction=()=>{if(dockGesture||dockPose)return;player.finish();if(root.hasAttribute('data-interaction')){root.dataset.resting='true';if(!sprite.style.backgroundImage)root.removeAttribute('data-interaction');}};
  const companionState=()=>companionContext==='listening'?'reading':companionContext!=='ready'?companionContext:['playing','paused'].includes(controller.state)?'reading':'ready';
  const syncCompanionPose=()=>{
   const now=Date.now();if(controller.state==='playing'){if(readingSince===null)readingSince=now;}else{if(readingSince!==null)readingElapsed+=now-readingSince;readingSince=null;if(!['paused','loading'].includes(controller.state)){readingElapsed=0;lastBreakAt=0;}}
   const state=companionState();if(dockGesture||root.dataset.interactionSet===state)return;dockPose=false;root.dataset.interactionSet=state;root.dataset.interaction='listening';root.dataset.resting='true';player.still('listening');
  };
  const resetCompanionSchedule=()=>{nextInteraction=Date.now()+controller.companionIntervalMs();};
  const playCompanion=forced=>{
   if(disposed||!root.isConnected)return;
   if(dockGesture)return;dockPose=false;finishInteraction();
   if(win.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const state=companionState();
   if(!gestureQueues[state].length){
    gestureQueues[state]=PaperVoiceCompanion.shuffled(PaperVoiceCompanion.sets[state],lastGestures[state]);
   }
   const index=forced||gestureQueues[state].shift();lastGestures[state]=index;
   root.dataset.interactionSet=state;root.dataset.interaction=index;root.removeAttribute('data-resting');player.play(index);
  };
  const dockCompanion=(progress,moving)=>{
   if(disposed||!root.isConnected)return;
   const enabled=controller.get('companionInteractions',true)&&!win.matchMedia('(prefers-reduced-motion: reduce)').matches;
   if(!enabled){if(dockGesture||dockPose){dockGesture=dockPose=false;root.removeAttribute('data-interaction');root.removeAttribute('data-resting');}return;}
   if(!moving&&!dockGesture)return;
   if(!player.seek('dock-present',progress)){dockGesture=false;return;}
   dockGesture=moving;dockPose=true;root.dataset.interactionSet=companionState();root.dataset.interaction='dock-present';
   if(moving)root.removeAttribute('data-resting');else{root.dataset.resting='true';resetCompanionSchedule();}
   if(!moving){dockPose=false;player.still('listening');}
   const hand=PaperVoiceCompanion.hand(progress),bounds=sprite.getBoundingClientRect();return {x:bounds.left+bounds.width*hand.x,y:bounds.top+bounds.height*hand.y};
  };
  dockMotion.setCompanion(dockCompanion);
  const setContext=context=>{companionContext=PaperVoiceCompanion.sets[context]?context:context==='listening'?'listening':'ready';root.dataset.companionContext=companionContext;resetCompanionSchedule();};
  const performContext=()=>{if(controller.get('companionInteractions',true))playCompanion(companionContext==='listening'?'listening':undefined);};
  player.still('listening');root.dataset.interaction='listening';root.dataset.resting='true';
  let pageEvents=null,lastPage=null,pageAnimationTimer=null;
  const onPageChanged=({pageNumber})=>{
   if(!Number.isInteger(pageNumber)||pageNumber===lastPage)return;
   const gesture=PaperVoiceCompanion.pageGesture(lastPage,pageNumber);lastPage=pageNumber;
   if(!gesture||!controller.get('companionInteractions',true)||doc.hidden)return;
   if(pageAnimationTimer!==null)win.clearTimeout(pageAnimationTimer);
   pageAnimationTimer=win.setTimeout(()=>{pageAnimationTimer=null;if(!controller.get('companionInteractions',true)||doc.hidden||!root.isConnected)return;resetCompanionSchedule();playCompanion(gesture);},120);
  };
  const bindPageEvents=()=>{
   const app=reader._internalReader?._primaryView?._iframeWindow?.PDFViewerApplication,bus=app?.eventBus;
   if(!bus||bus===pageEvents)return;
   pageEvents?.off('pagechanging',onPageChanged);if(pageAnimationTimer!==null)win.clearTimeout(pageAnimationTimer);pageAnimationTimer=null;
   pageEvents=bus;lastPage=app.pdfViewer?.currentPageNumber;pageEvents.on('pagechanging',onPageChanged);
  };
  bindPageEvents();
  action('orb').addEventListener('pointerenter',()=>{if(!controller.get('companionInteractions',true))return;resetCompanionSchedule();playCompanion();});
  action('orb').addEventListener('pointerdown',finishInteraction);
  let previewIndex=0;const previewCompanion=()=>{resetCompanionSchedule();const gestures=['greeting','listening','references','network','settings','page-forward','page-backward','dock-present'];playCompanion(gestures[previewIndex++%gestures.length]);};
  action('previewCompanion').onclick=previewCompanion;
  action('previewCompanion').disabled=win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(action('previewCompanion').disabled)action('previewCompanion').title=controller.t('系统已开启减少动态效果');
  const tickCompanion=(now=Date.now())=>{
   bindPageEvents();
   if(!controller.get('companionInteractions',true)){nextInteraction=now+controller.companionIntervalMs();return;}
   if(now<nextInteraction)return;
   if(doc.hidden||!root.isConnected||root.matches(':hover,:focus-within'))return;
   const activeReader=Zotero.Reader.getByTabID(Zotero.getMainWindow().Zotero_Tabs?.selectedID);
   if(activeReader!==reader&&!reader._window?.document?.hasFocus())return;
   const elapsed=readingElapsed+(readingSince===null?0:now-readingSince),takeBreak=controller.state==='playing'&&elapsed-lastBreakAt>=PaperVoiceCompanion.breakInterval;
   if(takeBreak)lastBreakAt=elapsed;
   nextInteraction=now+controller.companionIntervalMs();playCompanion(takeBreak?'rest':undefined);
  };
  const dispose=()=>{if(disposed)return;disposed=true;quickReveal.dispose();disposeTransparency();doc.removeEventListener('pointerdown',outsideUpdateNotice,true);find('updateNotice')._pvFade?.cancel();dockMotion.dispose();pageEvents?.off('pagechanging',onPageChanged);if(pageAnimationTimer!==null)win.clearTimeout(pageAnimationTimer);win.removeEventListener('keydown',recordShortcut,true);doc.removeEventListener('pointerdown',cancelOutside,true);recordingShortcut=null;root._pvSelects?.dispose();root._pvTooltips?.dispose();win.clearTimeout(closeTimer);for(const menu of choiceMenus)menu.dispose();player.dispose();for(const el of [panel,navigation,audioPopover])el._pvFade?.cancel();root.remove();};
  (doc.body||doc.documentElement).append(root);this.installSelects(root,controller);root._pvTooltips=this.installTooltips(root,controller);return {root,panel,dockMotion,find,action,previewCompanion,setContext,performContext,dockCompanion,finishMotion:()=>dockMotion.finish(),waitMotion:()=>dockMotion.whenSettled(),settings,selectSettingsTab,syncShortcutBindings,cancelShortcutRecording,closeNavigation,closeAudioPopover,tickCompanion,finishInteraction,syncCompanionPose,resetCompanionSchedule,dispose};
 }
};
