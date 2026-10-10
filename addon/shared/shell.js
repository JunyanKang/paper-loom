var PaperLoom = {
  id:'paper-loom@local.research',name:'Paper Loom · 文织',windows:new Map(),dead:false,
  el(doc,tag,text,className){const node=doc.createElementNS('http://www.w3.org/1999/xhtml',tag);if(text!==undefined&&text!==null)node.textContent=text;if(className)node.className=className;return node;},
  button(doc,label,handler){const b=this.el(doc,'button',label);b.type='button';b.onclick=async()=>{try{await handler();}catch(e){this.message(e.message,doc);}};return b;},
  message(text,doc=Zotero.getMainWindow().document){let status=doc.querySelector('[data-loom-status]');if(status)status.textContent=text;else Zotero.getMainWindow().alert(text);},
  currentReader(){const win=Zotero.getMainWindow();return Zotero.Reader.getByTabID(win.Zotero_Tabs?.selectedID)||null;},
  logo(doc,size=28){const image=this.el(doc,'img');image.src=this.assetURI+'loom.png';image.alt='';image.style.cssText='width:'+size+'px;height:'+size+'px;object-fit:contain';return image;},
  style(doc) {
    if(doc.getElementById('paper-loom-style'))return;
    const style=this.el(doc,'style');style.id='paper-loom-style';style.textContent=LoomShellStyle;(doc.head||doc.documentElement).append(style);
  },
  addWindow(win) {
    if(this.dead||this.windows.has(win))return;
    this.style(win.document);const item=win.document.createXULElement('menuitem');item.id='paper-loom-tools';item.setAttribute('label',this.name);item.setAttribute('class','menuitem-iconic');item.setAttribute('image',this.assetURI+'loom.png');item.addEventListener('command',()=>this.showHome(this.currentReader()));
    win.document.getElementById('menu_ToolsPopup')?.append(item);
    const host=win.document.getElementById('zotero-items-toolbar'),entry=this.button(win.document,'',()=>this.showHome(null));entry.className='cl-library-entry pl-library-entry';entry.setAttribute('aria-label',this.name);entry.append(this.logo(win.document,24));const spacer=host&&[...host.children].find(node=>node.localName==='spacer'||node.id==='zotero-tb-search-spinner'||node.id==='zotero-tb-search');host?.insertBefore(entry,spacer||null); this.windows.set(win,{item,entry});
    this.references?.windows.set(win,item);
  },
  removeWindow(win){const nodes=this.windows.get(win);nodes?.item.remove();nodes?.entry.remove();this.windows.delete(win);win.document.getElementById('paper-loom-style')?.remove();},
  showHome(reader=this.currentReader(),doc=reader?._iframeWindow?.document||Zotero.getMainWindow().document) {
    if(!this.started){this.showConflicts(doc);return;}
    this.style(doc);doc.querySelector('.pl-home')?._plClose?.();
    const U=this.referencesScope.CiteLensUI,dialog=U.dialog(doc,'Paper Loom · 文织',{className:'pl-home',reader}),{root,frame,close}=dialog;frame._plClose=close;
    root.append(this.el(doc,'p','从眼前的论文，读、听、发现。','pl-intro'));
    const grid=this.el(doc,'div',null,'pl-entry-grid');root.append(grid);
    const entry=(title,detail,action)=>{const b=this.button(doc,'',async()=>{close();await action();});b.append(this.el(doc,'strong',title),this.el(doc,'span',detail));grid.append(b);};
    entry('听读','划选 · 单句 · 段落 · 全文',()=>{if(reader)this.voice.showPanel(reader,true);else this.message('打开一篇 PDF，即可从划选或全文开始听读。',doc);});
    entry('引文与稍后读','查阅摘要，保存和追踪研究线索',()=>{if(reader)this.references.showPanel(reader);else this.showQueue(doc);});
    entry('朋友圈与学术履历','探索作者、合作论文与公开经历',()=>this.references.showNetwork(reader,{doc:Zotero.getMainWindow().document}));
    entry('设置','声音下载 · 翻译 · 外观 · 快捷键',()=>this.showSettings(reader,doc));
    const status=this.el(doc,'p',LoomRuntime.state.message,'pl-runtime-summary');status.dataset.loomStatus='true';root.append(status);
    return dialog;
  },
  showQueue(doc=Zotero.getMainWindow().document) {
    this.queueReader||={_iframeWindow:Zotero.getMainWindow(),_window:Zotero.getMainWindow(),itemID:null};
    return this.references.showPanel(this.queueReader,{view:'queue'});
  },
  showInfo(key,doc=Zotero.getMainWindow().document) {
    const english=this.referencesScope.CiteLensI18n.language()==='en',repo='https://github.com/JunyanKang/paper-loom';
    const info={
      about:['Paper Loom · 文织',english?'Version '+this.version+'. Read, listen, and follow research connections in Zotero. Created by Junyan Kang.':'版本 '+this.version+'。在 Zotero 中听读论文、理解引文、收藏线索、探索作者。作者：Junyan Kang。',repo],
      guide:[english?'User guide':'使用指南',english?'Start from the book icon in your library or PDF toolbar. Install offline voices in Settings → Voices & engine. Read selected text, a sentence, a paragraph, or the whole paper; explore references, save papers for later, and open author networks.':'从文献库或 PDF 工具栏的小书打开 Paper Loom。在「设置 → 声音与引擎」中下载离线声音，即可听读划选、单句、段落或全文；阅读时还可查阅引文摘要、收藏稍后读，或探索作者合作关系。',repo+'/blob/main/docs/'+(english?'GUIDE.en.md':'GUIDE.md')],
      privacy:[english?'Privacy & data':'隐私与数据',english?'Speech runs on your computer after the voice download. Translation sends text to your chosen provider. Online reference and career lookups contact public data services. API keys are stored in Zotero’s login manager. No telemetry or analytics are added.':'声音下载后在本机合成。翻译会将文本发送给所选服务商；在线文献和履历查询会访问相应公开数据源。API 密钥存入 Zotero 登录管理器。无新增遥测或使用统计。',repo+'/blob/main/docs/'+(english?'PRIVACY.en.md':'PRIVACY.md')],
      feedback:[english?'Feedback':'反馈',english?'Include your Paper Loom version, Zotero version, operating system and steps to reproduce. Remove API keys and private library information before sharing screenshots or logs.':'请附上 Paper Loom 版本、Zotero 版本、操作系统和复现步骤。分享截图和日志前请移除 API 密钥与私人文献内容。',repo+'/issues']
    }[key]||['Paper Loom','',repo];
    const dialog=this.referencesScope.CiteLensUI.dialog(doc,info[0]);dialog.root.append(this.el(doc,'p',info[1]),this.button(doc,english?'Open webpage':'打开网页',()=>Zotero.launchURL(info[2])));return dialog;
  },
  async showSettings(reader=this.currentReader(),doc=reader?._iframeWindow?.document||Zotero.getMainWindow().document,tab='general') {
    this.style(doc);const result=await this.referencesScope.CiteLensUI.settingsDialog(doc,{reader});
    const frame=doc.querySelector('.cl-settings');frame?._plSelect?.(tab);return result;
  },
  showConflicts(doc=Zotero.getMainWindow().document) {
    // Predecessors must stop before their Reader hooks and global aliases are reused.
    this.style(doc);doc.getElementById('paper-loom-conflicts')?.remove();
    const box=this.el(doc,'section',null,'pl-conflicts');box.id='paper-loom-conflicts';box.setAttribute('role','dialog');box.setAttribute('aria-label',this.name);box.append(this.logo(doc,72),this.el(doc,'h2',this.name),this.el(doc,'p','检测到旧版插件仍在运行。迁移会保留旧数据，并停用旧插件，避免重复的阅读按钮与声音。'));
    box.append(this.button(doc,'导入并启用 Paper Loom',async()=>{for(const addon of this.conflicts)await addon.disable();box.remove();await this.startModules();this.showHome(null,doc);}),this.button(doc,'稍后',()=>box.remove()));
    (doc.body||doc.documentElement).append(box);
  },
  async listen(text,reader=this.currentReader()) {
    if(!text?.trim())return;
    if(!reader){this.libraryReader||={_iframeWindow:Zotero.getMainWindow(),_window:Zotero.getMainWindow(),itemID:null};reader=this.libraryReader;}
    this.voice.ensurePanel(reader);this.voice.showPanel(reader,true);
    return this.voice.speak(text,reader,true);
  }
};
var LoomShellStyle = [
  '.pl-home{width:min(500px,calc(100vw - 32px))!important}.pl-intro{margin:0 0 18px;color:var(--cl-muted,#526461);font-size:14px}',
  '.pl-home .pl-entry-grid>button{height:auto!important;min-height:100px!important;white-space:normal!important;line-height:1.5!important;justify-content:flex-start!important;padding:16px!important}.pl-home .pl-entry-grid>button>strong,.pl-home .pl-entry-grid>button>span{display:block;height:auto;white-space:normal}.pl-entry-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pl-entry-grid>button{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:18px;border:1px solid var(--cl-line,#d9e3dc);border-radius:12px;background:var(--cl-paper,#f4f6f0);color:var(--cl-ink,#263b35);text-align:left;cursor:pointer}.pl-entry-grid>button:hover{background:var(--cl-soft,#dbe9e2)}.pl-entry-grid strong{font-size:15px}.pl-entry-grid span{font-size:12px;line-height:1.6;color:var(--cl-muted,#56675f)}',
  '.pl-library-entry{border:0;background:transparent;padding:3px;cursor:pointer}.pl-runtime-summary{font-size:12px;color:var(--cl-muted,#56675f);margin-bottom:0}',
  '.cl-settings.pl-settings{width:min(570px,calc(100vw - 24px))!important;max-height:calc(100vh - 40px)}.pl-settings .cl-settings-tabs{flex-wrap:wrap;gap:4px}.pl-settings .cl-dialog-body{overflow:auto}.pl-settings .cl-dialog-footer{flex-wrap:wrap;gap:6px}.pl-settings .pl-update-schedule{width:100%;margin:3px 0}.pl-settings [hidden]{display:none!important}',
  '.pl-embedded.pv-shell{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;z-index:auto!important}.pl-embedded .pv-panel{display:block;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;max-width:none!important;max-height:none!important;box-shadow:none!important;outline:0!important;border:0!important;background:transparent!important;padding:0!important;opacity:1!important;visibility:visible!important;overflow:visible!important}.pl-embedded .pv-panel::before,.pl-embedded .pv-panel::after{display:none!important}.pl-embedded .pv-header,.pl-embedded .pv-mini,.pl-embedded .pv-settings-tabs,.pl-embedded .pv-updater,.pl-embedded .pv-about{display:none!important}.pl-embedded .pv-settings-content{padding:0;overflow:visible;max-height:none}.pl-embedded [data-action=configureLLM]{display:none!important}.pl-embedded [data-settings-pane=appearance]>:not(.pv-companion-row){display:none!important}',
  '.pl-engine{padding:15px;margin:16px 0;border:1px solid var(--cl-line,#c9ddd5);border-radius:10px;background:var(--cl-paper,#f4f6f0)}.pl-engine h3{font-size:14px;margin:0 0 8px}.pl-engine p{font-size:12px;line-height:1.6;overflow-wrap:anywhere}.pl-engine progress{width:100%;height:6px;accent-color:var(--cl-accent,#176956)}.pl-engine-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.pl-engine-actions button{border:1px solid var(--cl-line,#bdcfc6);border-radius:7px;background:var(--cl-bg,#fff);color:var(--cl-ink,#284038);padding:7px 10px;cursor:pointer}.pl-engine-actions button:first-child{background:var(--cl-accent,#176956);color:var(--cl-on-accent,#fff)}.pl-engine-actions button:disabled{opacity:.55;cursor:default}',
  '.pl-update-schedule{display:flex;gap:12px;align-items:center;font-size:12px;margin:8px 0}.pl-update-schedule label{display:flex;align-items:center;gap:5px}.pl-settings .cl-settings-tabs.cl-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.pl-settings .cl-settings-tabs.cl-tabs>button{width:auto;flex:initial;min-width:0;padding:8px 5px;font-size:12px}.pl-migration{font-size:12px;margin-top:14px}.pl-migration summary{cursor:pointer}.pl-migration button{margin:8px 8px 0 0}.pl-conflicts{position:fixed;z-index:2147483646;top:15vh;left:calc(50% - 240px);width:440px;padding:24px;background:#f8f6ed;color:#25463e;border:1px solid #acc5ba;border-radius:16px;box-shadow:0 12px 48px #0003;font:14px/1.7 system-ui}.pl-conflicts button{margin:10px 10px 0 0;padding:8px 14px}',
  '@media(max-width:460px){.pl-entry-grid{grid-template-columns:1fr}.pl-conflicts{left:12px;width:calc(100vw - 72px)}}@media(prefers-reduced-motion:reduce){.pl-home *,.pl-settings *{scroll-behavior:auto}}'
].join('\n');
