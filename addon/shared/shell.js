var PaperLoom = {
  id:'paper-loom@local.research',name:'Paper Loom',windows:new Map(),dead:false,
  el(doc,tag,text,className){const node=doc.createElementNS('http://www.w3.org/1999/xhtml',tag);if(text!==undefined&&text!==null)node.textContent=text;if(className)node.className=className;return node;},
  button(doc,label,handler){const b=this.el(doc,'button',label);b.type='button';b.onclick=async()=>{try{await handler();}catch(e){this.message(e.message,doc);}};return b;},
  message(text,doc=Zotero.getMainWindow().document){let status=doc.querySelector('[data-loom-status]');if(status)status.textContent=text;else Zotero.getMainWindow().alert(text);},
  currentReader(doc){if(doc){const match=Zotero.Reader._readers.find(r=>r._iframeWindow?.document===doc||r._window?.document===doc);if(match)return match;}const win=doc?.defaultView||Zotero.getMainWindow();return Zotero.Reader.getByTabID(win.Zotero_Tabs?.selectedID)||null;},
  logo(doc,size=28){const image=this.el(doc,'img');image.src=this.assetURI+'loom.png';image.alt='';image.style.cssText='width:'+size+'px;height:'+size+'px;object-fit:contain';return image;},
  flagURI(code){const id=({'zh':'cn','zh-Hans':'cn','zh-Hant':'tw',en:'gb','en-US':'us',ja:'jp',ko:'kr',fr:'fr',de:'de',es:'es',ru:'ru',auto:'auto'})[code]||'auto';return this.assetURI+'flags/'+id+'.svg';},
  providerMeta(code){
    const presets=this.voice.llmPresets;let id=code;
    if(code==='llm'){try{const selected=this.voice.get('llmProvider','');const saved=JSON.parse(this.voice.get('llmConfigs','{}'));id=selected&&saved[selected]?selected:'llm';}catch(_){id='llm';}}
    const known=['tencenttransmart','bing','google','llm',...presets.map(p=>p.id)];if(!known.includes(id))id='custom';
    const label=({tencenttransmart:'Tencent',bing:'Microsoft',google:'Google',llm:'LLM',custom:'Custom API',qwen:'Qwen',doubao:'Doubao',glm:'GLM',hunyuan:'Hunyuan',qianfan:'Qianfan',anthropic:'Claude'})[id]||presets.find(p=>p.id===id)?.name||'LLM';
    return {id,label:code==='llm'&&id!=='llm'?'LLM · '+label:label,uri:this.assetURI+'providers/'+id+(id==='tencenttransmart'?'.png':'.svg')};
  },
  style(doc) {
    if(doc.getElementById('paper-loom-style'))return;
    const style=this.el(doc,'style');style.id='paper-loom-style';style.textContent=LoomShellStyle+'\n'+LoomDesignStyle;(doc.head||doc.documentElement).append(style);
  },
  addWindow(win) {
    if(this.dead||this.windows.has(win))return;
    this.style(win.document);const item=win.document.createXULElement('menuitem');item.id='paper-loom-tools';item.setAttribute('label',this.name);item.setAttribute('class','menuitem-iconic');item.setAttribute('image',this.assetURI+'loom.png');item.addEventListener('command',()=>this.showHome(this.currentReader(win.document),win.document));
    win.document.getElementById('menu_ToolsPopup')?.append(item);
    const host=win.document.getElementById('zotero-items-toolbar'),entry=this.button(win.document,'',()=>this.showHome(null,win.document));entry.className='cl-library-entry pl-library-entry';entry.setAttribute('aria-label',this.name);entry.append(this.logo(win.document,24));const spacer=host&&[...host.children].find(node=>node.localName==='spacer'||node.id==='zotero-tb-search-spinner'||node.id==='zotero-tb-search');host?.insertBefore(entry,spacer||null); this.windows.set(win,{item,entry});
    this.references?.windows.set(win,item);
  },
  removeWindow(win){const nodes=this.windows.get(win);nodes?.item.remove();nodes?.entry.remove();this.windows.delete(win);win.document.getElementById('paper-loom-style')?.remove();},
  installOutsideCollapse(ui,reader){
    const doc=ui.root.ownerDocument,U=this.referencesScope.CiteLensUI,surfaces=new Set();let disposed=false;
    const inside=node=>{
      for(let current=node;current;){
        if(current.closest?.('.pv-shell,.cl-root,.cl-overlay,.cl-summary,.cl-select-popover,.cl-tooltip,.pv-tooltip,.pv-select-popover,.cl-menu,.cl-citation-locations,.pv-selection-card,.pl-library-entry,#paper-loom-tools'))return true;
        try{current=current.ownerDocument?.defaultView?.frameElement;}catch(_){break;}
      }return false;
    };
    const outside=event=>{
      if(disposed||inside(event.target))return;
      for(const view of U.livePages(doc))if(!view.container.hidden&&view.frame.dataset.dockMotion!=='closing')view.dismiss();
    };
    const scan=surface=>{try{for(const frame of surface.querySelectorAll('iframe,browser'))if(frame.contentDocument)watch(frame.contentDocument,true);}catch(_){} };
    const loaded=event=>{try{const frame=event.target;if(frame.contentDocument)watch(frame.contentDocument,true);else if(frame.nodeType===9)watch(frame,true);}catch(_){} };
    const watch=(surface,deep=false)=>{if(!surface||surfaces.has(surface))return;surfaces.add(surface);surface.addEventListener('pointerdown',outside,true);if(deep){surface.addEventListener('load',loaded,true);scan(surface);}};
    watch(doc,true);try{for(let window=doc.defaultView;window?.frameElement;){window=window.frameElement.ownerDocument.defaultView;watch(window.document);}}catch(_){}
    if(reader._window?.document)watch(reader._window.document);
    ui._outside=outside;const dispose=ui.dispose;ui.dispose=()=>{disposed=true;for(const surface of surfaces)try{surface.removeEventListener('pointerdown',outside,true);surface.removeEventListener('load',loaded,true);}catch(_){}surfaces.clear();dispose();};
  },
  mainNavigation(doc,reader,active='listening'){
    const nav=this.el(doc,'nav',null,'pl-main-actions');nav.setAttribute('aria-label','Paper Loom');
    const entries=[['network','authors','朋友圈与学术履历',()=>this.references.showNetwork(reader,{doc})],['listening','headphones','听读',()=>this.voice.showPanel(reader)],['references','references','引文与稍后读',()=>this.references.showPanel(reader,this.references.panels.get(reader)?.isConnected?{}:{view:reader.itemID?'references':'queue'})],['settings','settings','设置',()=>this.showSettings(reader,doc)]];
    nav.style.setProperty('--pl-active-index',String(entries.findIndex(entry=>entry[0]===active)));
    for(const [id,icon,label,run] of entries){const button=this.referencesScope.CiteLensUI.iconButton(doc,label,icon,()=>{if(id!==active)return run();});button.dataset.loomPage=id;button.setAttribute('aria-current',id===active?'page':'false');nav.append(button);}return nav;
  },
  mountWorkspace(frame,reader,active){
    if(frame.querySelector(':scope>.pl-main-actions'))return;
    const doc=frame.ownerDocument,content=this.el(doc,'div',null,'pl-workspace-content');
    frame.classList.add('pl-workspace-page');frame.dataset.workspace=active;
    content.id='pl-workspace-'+active+'-'+(++this.referencesScope.CiteLensUI.sequence);content.setAttribute('role','region');
    while(frame.firstChild)content.append(frame.firstChild);
    const nav=this.mainNavigation(doc,reader,active);
    for(const b of nav.children){b.setAttribute('aria-controls',content.id);if(b.dataset.loomPage===active)content.setAttribute('aria-label',b.getAttribute('aria-label'));}
    frame.append(content,nav);
  },
  showHome(reader=this.currentReader(),doc=reader?._iframeWindow?.document||Zotero.getMainWindow().document) {
    if(!this.started){this.showConflicts(doc);return;}
    this.style(doc);
    if(!reader){this.workspaceReaders||=new WeakMap();reader=this.workspaceReaders.get(doc);if(!reader){reader={_iframeWindow:doc.defaultView,_window:doc.defaultView,itemID:null};this.workspaceReaders.set(doc,reader);}}
    this.voice.showPanel(reader);return this.voice.ensurePanel(reader);
  },
  showQueue(doc=Zotero.getMainWindow().document) {
    this.queueReaders||=new WeakMap();let reader=this.queueReaders.get(doc);if(!reader){reader={_iframeWindow:doc.defaultView,_window:doc.defaultView,itemID:null};this.queueReaders.set(doc,reader);}
    return this.references.showPanel(reader,{view:'queue'});
  },
  showInfo(key,doc=Zotero.getMainWindow().document) {
    const english=this.referencesScope.CiteLensI18n.language()==='en',repo='https://github.com/JunyanKang/paper-loom';
    const info={
      about:['Paper Loom',english?'Version '+this.version+'. Read, listen, and follow research connections in Zotero. Created by Junyan Kang.':'版本 '+this.version+'。在 Zotero 中听读论文、理解引文、收藏线索、探索作者。作者：Junyan Kang。',repo],
      guide:[english?'User guide':'使用指南',english?'Start from the left library toolbar or floating book in a PDF. Install offline voices in Settings → Voices & engine. Read selected text, a sentence, a paragraph, or the whole paper; explore references, save papers for later, and open author networks.':'从文献库左侧入口或 PDF 内的悬浮小书打开 Paper Loom。在「设置 → 声音与引擎」中下载离线声音，即可听读划选、单句、段落或全文；阅读时还可查阅引文摘要、收藏稍后读，或探索作者合作关系。',repo+'/blob/main/docs/'+(english?'GUIDE.en.md':'GUIDE.md')],
      privacy:[english?'Privacy & data':'隐私与数据',english?'Speech runs on your computer after the voice download. Translation sends text to your chosen provider. Online reference and career lookups contact public data services. API keys are stored in Zotero’s login manager. No telemetry or analytics are added.':'声音下载后在本机合成。翻译会将文本发送给所选服务商；在线文献和履历查询会访问相应公开数据源。API 密钥存入 Zotero 登录管理器。无新增遥测或使用统计。',repo+'/blob/main/docs/'+(english?'PRIVACY.en.md':'PRIVACY.md')],
      feedback:[english?'Feedback':'反馈',english?'Include your Paper Loom version, Zotero version, operating system and steps to reproduce. Remove API keys and private library information before sharing screenshots or logs.':'请附上 Paper Loom 版本、Zotero 版本、操作系统和复现步骤。分享截图和日志前请移除 API 密钥与私人文献内容。',repo+'/issues']
    }[key]||['Paper Loom','',repo];
    const dialog=this.referencesScope.CiteLensUI.dialog(doc,info[0]);dialog.root.append(this.el(doc,'p',info[1]),this.button(doc,english?'Open webpage':'打开网页',()=>Zotero.launchURL(info[2])));return dialog;
  },
  async showSettings(reader=this.currentReader(),doc=reader?._iframeWindow?.document||Zotero.getMainWindow().document,tab='general') {
    this.style(doc);const result=await this.referencesScope.CiteLensUI.settingsDialog(doc,{reader});
    const frame=result?.frame||doc.querySelector('.cl-settings');frame?._plSelect?.(tab);return result;
  },
  showConflicts(doc=Zotero.getMainWindow().document) {
    // Predecessors must stop before their Reader hooks and global aliases are reused.
    this.style(doc);doc.getElementById('paper-loom-conflicts')?.remove();
    const box=this.el(doc,'section',null,'pl-conflicts');box.id='paper-loom-conflicts';box.setAttribute('role','dialog');box.setAttribute('aria-label',this.name);box.append(this.logo(doc,72),this.el(doc,'h2',this.name),this.el(doc,'p','检测到旧版插件正在运行。'));
    box.append(this.el(doc,'p','导入设置后将停用旧插件，原有数据会保留。'));
    const actions=this.el(doc,'div',null,'pl-conflict-actions'),status=this.el(doc,'p',null,'pl-conflict-status');status.dataset.loomStatus='true';status.setAttribute('role','status');
    const enable=this.button(doc,'导入并启用',async()=>{enable.disabled=true;try{await LoomSettings.migrate();for(const addon of this.conflicts)await addon.disable();await this.startModules();box.remove();this.showHome(null,doc);}catch(e){status.textContent=e.message;}finally{enable.disabled=false;}});
    actions.append(enable,this.button(doc,'稍后',()=>box.remove()));box.append(actions,status);
    (doc.body||doc.documentElement).append(box);
  },
  async listen(text,reader=this.currentReader()) {
    if(!text?.trim())return;
    if(!reader){this.libraryReader||={_iframeWindow:Zotero.getMainWindow(),_window:Zotero.getMainWindow(),itemID:null};reader=this.libraryReader;}
    this.voice.ensurePanel(reader);this.voice.showPanel(reader);
    return this.voice.speak(text,reader,true);
  }
};
var LoomShellStyle = [
  '.pl-navigation{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:6px;margin:0 12px 10px;flex:none;border-radius:12px;background:var(--cl-soft,var(--pv-soft,#edf1e9));font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.pl-navigation>button{appearance:none;min-width:0;min-height:34px!important;height:auto!important;padding:6px 3px!important;margin:0;border:0;border-radius:8px;background:transparent!important;color:var(--cl-muted,var(--pv-muted,#526461));font:inherit!important;font-weight:500!important;line-height:1.4!important;white-space:nowrap!important;cursor:pointer}.pl-navigation>button[aria-current=page]{background:var(--cl-bg,var(--pv-paper,#fff))!important;color:var(--cl-accent,var(--pv-accent,#176956));box-shadow:0 1px 4px #0000000d;font-weight:650!important}.pv-panel>.pl-navigation{margin:0 0 16px}.pv-panel:has(>.pl-navigation)>.pv-header{margin-bottom:12px}.pl-navigation>button:focus-visible{outline:2px solid var(--cl-accent,var(--pv-accent,#176956));outline-offset:1px}',
  '.pl-main-actions{display:flex;gap:2px;align-items:center;flex:none;margin-left:auto}.pl-main-actions button{display:flex;align-items:center;justify-content:center;width:28px!important;height:30px!important;min-width:28px!important;min-height:30px!important;padding:5px!important;border-radius:8px!important}.pl-main-actions svg{width:18px;height:18px;flex:none}.pl-main-actions button[aria-current=page]{color:var(--pv-accent);background:var(--pv-soft)}.pv-header:has(.pl-main-actions){gap:8px;margin-bottom:16px}.pv-header:has(.pl-main-actions) .pv-brand{font-size:17px;white-space:nowrap}.pv-header:has(.pl-main-actions) .pv-brand-icon{width:27px;height:27px}.pv-header:has(.pl-main-actions) .pv-brand>span{display:none!important}.pv-header:has(.pl-main-actions)>[data-action=close],.pv-header:has(.pl-main-actions)>[data-action=settings]{display:none!important}',
  '.pl-entry-icon{width:25px;height:25px;flex:none;color:var(--cl-accent)}.pl-home-back{flex:none;display:inline-flex;align-items:center;justify-content:center;width:32px!important;height:32px!important;min-height:32px!important;padding:6px!important}.pl-home-back svg{width:20px;height:20px;flex:none}.pl-reader-workspace .cl-header-tools>[data-icon=settings],.pl-reader-workspace .cl-header-tools>[data-network-entry],.pl-reader-workspace .cl-header-tools>[data-list-entry]{display:none!important}.pl-reader-workspace .pv-header>[data-action=settings]{display:none!important}',
  '.pl-home{width:min(500px,calc(100vw - 32px))!important}.pl-intro{margin:0 0 18px;color:var(--cl-muted,#526461);font-size:14px}',
  '.pl-home .pl-entry-grid>button{height:auto!important;min-height:100px!important;white-space:normal!important;line-height:1.5!important;justify-content:flex-start!important;padding:16px!important}.pl-home .pl-entry-grid>button>strong,.pl-home .pl-entry-grid>button>span{display:block;height:auto;white-space:normal}.pl-entry-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pl-entry-grid>button{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:18px;border:1px solid var(--cl-line,#d9e3dc);border-radius:12px;background:var(--cl-paper,#f4f6f0);color:var(--cl-ink,#263b35);text-align:left;cursor:pointer}.pl-entry-grid>button:hover{background:var(--cl-soft,#dbe9e2)}.pl-entry-grid strong{font-size:15px}.pl-entry-grid span{font-size:12px;line-height:1.6;color:var(--cl-muted,#56675f)}',
  '.pl-navigation>button{display:flex!important;align-items:center;justify-content:center;gap:6px}.pl-navigation svg{width:19px;height:19px;flex:none}.pl-nav-label{display:inline}.cl-summary-tools [data-loom-action=listen-abstract]{width:32px!important;min-width:32px!important;height:32px!important;padding:6px!important;flex:none}',
  '.pl-reader-workspace .cl-root{z-index:100000;bottom:120px}.pl-reader-workspace .pv-shell{z-index:100050}.pl-reader-workspace .cl-overlay:has(>.pl-home),.pl-reader-workspace .cl-overlay:has(>.pn-map-window){z-index:100000;pointer-events:none;background:transparent;padding-bottom:120px}.pl-reader-workspace .cl-overlay:has(>.pl-home)>.cl-dialog,.pl-reader-workspace .cl-overlay:has(>.pn-map-window)>.cl-dialog{pointer-events:auto;max-height:calc(100vh - 140px)}.pl-reader-workspace .pn-map-window{height:min(760px,calc(100vh - 140px))}.pl-reader-workspace .cl-context-page{z-index:100000}.pl-reader-workspace .cl-context-page .cl-dialog{max-height:calc(100vh - var(--cl-context-top) - 120px)}',
  '.pl-reader-workspace{--pl-dock-right:18px;--pl-dock-bottom:114px}.pl-reader-workspace .cl-root,.pl-reader-workspace .cl-overlay>.cl-settings,.pl-reader-workspace .cl-overlay>.pn-map-window,.pl-reader-workspace .cl-overlay>.pl-home{position:fixed!important;inset:auto!important;right:var(--pl-dock-right)!important;bottom:var(--pl-dock-bottom)!important;margin:0!important;max-width:calc(100vw - 32px)!important;max-height:calc(100vh - var(--pl-dock-bottom) - 48px)!important;transform:none}.pl-reader-workspace .pv-panel{position:fixed!important;right:var(--pl-dock-right)!important;bottom:var(--pl-dock-bottom)!important;margin:0!important;height:auto;max-height:calc(100vh - var(--pl-dock-bottom) - 48px)!important}.pl-reader-workspace .cl-overlay:has(>.pn-map-window),.pl-reader-workspace .cl-overlay:has(>.pl-home){background:transparent;pointer-events:none}.pl-reader-workspace .cl-overlay>.pn-map-window,.pl-reader-workspace .cl-overlay>.pl-home{pointer-events:auto}',
  '.pl-library-entry{border:0;background:transparent;padding:3px;cursor:pointer}.pl-runtime-summary{font-size:12px;color:var(--cl-muted,#56675f);margin-bottom:0}',
  '.cl-settings.pl-settings{width:var(--pl-panel-width,360px);max-height:calc(100vh - 40px)}.pl-settings .cl-settings-tabs{flex-wrap:wrap;gap:4px}.pl-settings .cl-dialog-body{overflow:auto}.pl-settings .cl-dialog-footer{flex-wrap:wrap;gap:6px}.pl-settings .pl-update-schedule{width:100%;margin:3px 0}.pl-settings [hidden]{display:none!important}',
  '.pl-embedded.pv-shell{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;z-index:auto!important}.pl-embedded .pv-panel{display:block;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;max-width:none!important;max-height:none!important;box-shadow:none!important;outline:0!important;border:0!important;background:transparent!important;padding:0!important;opacity:1!important;visibility:visible!important;overflow:visible!important}.pl-embedded .pv-panel::before,.pl-embedded .pv-panel::after{display:none!important}.pl-embedded .pv-header,.pl-embedded .pv-mini,.pl-embedded .pv-settings-tabs,.pl-embedded .pv-updater,.pl-embedded .pv-about{display:none!important}.pl-embedded .pv-settings-content{padding:0;overflow:visible;max-height:none}.pl-embedded [data-action=configureLLM]{display:none!important}',
  '.pl-engine{padding:15px;margin:16px 0;border:1px solid var(--cl-line,#c9ddd5);border-radius:10px;background:var(--cl-paper,#f4f6f0)}.pl-engine h3{font-size:14px;margin:0 0 8px}.pl-engine p{font-size:12px;line-height:1.6;overflow-wrap:anywhere}.pl-engine progress{width:100%;height:6px;accent-color:var(--cl-accent,#176956)}.pl-engine-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.pl-engine-actions button{border:1px solid var(--cl-line,#bdcfc6);border-radius:7px;background:var(--cl-bg,#fff);color:var(--cl-ink,#284038);padding:7px 10px;cursor:pointer}.pl-engine-actions button:first-child{background:var(--cl-accent,#176956);color:var(--cl-on-accent,#fff)}.pl-engine-actions button:disabled{opacity:.55;cursor:default}',
  '.pl-update-schedule{display:flex;gap:12px;align-items:center;font-size:12px;margin:8px 0}.pl-update-schedule label{display:flex;align-items:center;gap:5px}.pl-settings .cl-settings-tabs.cl-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.pl-settings .cl-settings-tabs.cl-tabs>button{width:auto;flex:initial;min-width:0;padding:8px 5px;font-size:12px}.pl-migration{font-size:12px;margin-top:14px}.pl-migration summary{cursor:pointer}.pl-migration button{margin:8px 8px 0 0}.pl-conflicts{box-sizing:border-box;position:fixed;z-index:2147483646;top:15vh;left:50%;transform:translateX(-50%);width:min(480px,calc(100vw - 32px));max-height:80vh;overflow:auto;padding:24px;background:#f8f6ed;color:#25463e;border:1px solid #acc5ba;border-radius:16px;box-shadow:0 12px 48px #0003;font:14px/1.7 system-ui}.pl-conflicts h2{font-size:18px;line-height:1.4;margin:12px 0}.pl-conflicts p{margin:8px 0;text-wrap:pretty;overflow-wrap:anywhere}.pl-conflict-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.pl-conflicts button{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:38px;height:auto;line-height:1.4;white-space:nowrap;margin:0;padding:8px 16px}.pl-conflict-status:empty{display:none}',
  '@media(max-width:460px){.pl-entry-grid{grid-template-columns:1fr}.pl-conflicts{padding:20px}}@media(prefers-reduced-motion:reduce){.pl-home *,.pl-settings *{scroll-behavior:auto}}'
].join('\n');
