/* Product UI scale; reading captions keep their user-selected font and size. */
var LoomDesignStyle = `
:root{--pl-panel-width:360px;--pl-title-size:17px;--pl-body-size:13px;--pl-meta-size:12px;--pl-row-height:38px;--pl-page-padding:20px;--pl-content-inset:12px;--pl-font:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei","Hiragino Sans","Yu Gothic UI",sans-serif;--cl-ui-size:13px;--cl-control-height:32px;--cl-leading-ui:1.5;--cl-leading-title:1.4;--cl-leading-copy:1.65;--cl-space-tight:4px;--cl-space-row:8px;--cl-control-radius:8px;--cl-dialog-padding:18px}
.pl-home,.pl-settings,.pl-conflicts,.pl-navigation,.pv-shell{font-family:var(--pl-font)}
.pl-home .pl-intro{font-size:14px;line-height:1.65}.pl-home .pl-entry-grid{gap:12px}.pl-home .pl-entry-grid>button{min-height:112px!important}.pl-home .pl-entry-grid strong{font-size:15px;line-height:1.5}.pl-home .pl-entry-grid span{font-size:13px;line-height:1.6}
.cl-dialog-header,.cl-header{padding:16px 18px}.cl-dialog-header h2,.cl-brand{font-size:17px;line-height:1.4;font-weight:650}.cl-dialog-body{padding:18px}.cl-dialog-footer{padding:12px 18px;gap:8px}.cl-header-tools{gap:6px}.cl-header-tools>button{min-width:30px;min-height:30px}
.cl-settings .cl-setting-row{min-height:40px;gap:12px;align-items:center}.cl-settings .cl-setting-row>label{line-height:1.5}.cl-settings .cl-setting-row :is(input:not([type=checkbox]),select,.cl-select-trigger){font-size:13px;min-height:32px}.cl-settings .cl-note,.cl-settings .cl-status,.pl-runtime-summary,.pl-migration{font-size:12px;line-height:1.65}.cl-settings .cl-settings-tabs.cl-tabs>button{font-size:13px;min-height:36px;line-height:1.4;white-space:normal}
.cl-root .cl-row-title,.cl-card .cl-title{font-size:15px;line-height:1.5}.cl-root .cl-search{font-size:13px;min-height:34px}.cl-byline,.cl-journal,.cl-authors,.cl-muted,.cl-summary-meta{font-size:12px;line-height:1.55}.cl-row{gap:8px}.cl-card{padding:14px 16px}.cl-root .cl-tabs{margin:10px 0 8px}
.pn-map-controls{gap:8px;padding:10px 14px}.pn-map-controls :is(input,.cl-select-trigger){font-size:13px;min-height:32px}.pn-map-inspector{padding:12px 16px}.pn-map-inspector .cl-title{font-size:16px;line-height:1.5}.pn-node-meta,.pn-node-connections,.pn-node-link{font-size:12px;line-height:1.6}.pn-node-abstract{font-size:14px;line-height:1.7}
.pn-career-identity h2{font-size:22px;line-height:1.35}.pn-career-affiliation,.pn-career-bio{font-size:13px;line-height:1.7}.pn-career-event{padding:12px 14px;line-height:1.6}.pn-career-event h3{font-size:14px;line-height:1.5}.pn-career-event p,.pn-career-event-meta,.pn-career-year-mark{font-size:12px;line-height:1.6}.pn-career-filters{gap:6px;flex-wrap:wrap}
.pv-shell .pv-panel{width:var(--pl-panel-width);max-width:calc(100vw - 32px);max-height:calc(100vh - 112px);overflow-y:auto;scrollbar-width:none;padding:20px}.pv-shell .pv-brand{font-size:17px;line-height:1.4}.pv-shell .pv-brand span{font-size:12px;letter-spacing:0}.pv-shell .pv-header .pv-icon-button{width:30px;height:30px}.pv-shell .pv-mode-note,.pv-shell .pv-status,.pv-shell .pv-context-row,.pv-shell .pv-context-row select,.pv-shell .pv-footer,.pv-shell .pv-privacy{font-size:12px;line-height:1.5}.pv-shell .pv-mode-options button{font-size:13px;min-height:36px}.pv-shell .pv-preview{font-family:var(--pl-font);font-size:14px;line-height:1.65;height:47px;margin:16px 0}.pv-shell .pv-setting-row{min-height:36px;font-size:13px;line-height:1.5;gap:8px}.pv-shell .pv-setting-row :is(select,input:not([type=range]):not([type=checkbox])){font-size:13px;min-height:32px}.pv-shell .pv-shortcut-row{font-size:13px;min-height:36px}.pv-shell .pv-shortcut-key{font-size:12px;min-height:30px}.pv-shell .pv-primary{font-size:14px!important}.pv-shell .pv-status{white-space:normal;overflow-wrap:anywhere}.pv-shell .pv-settings-content{height:auto;min-height:211px}
.pl-engine{padding:16px;margin:16px 0}.pl-engine h3{font-size:15px;line-height:1.5;margin-bottom:8px}.pl-engine p{font-size:13px;line-height:1.65}.pl-engine-actions{gap:8px}.pl-engine-actions button{min-height:36px;line-height:1.4;font-size:13px}.pl-embedded .pv-panel{max-height:none!important;overflow:visible!important}
:is(.cl-root,.cl-dialog,.pl-conflicts) :is(button,input,select):focus-visible{outline:2px solid var(--cl-accent);outline-offset:2px;box-shadow:none}
@media(max-width:600px){.cl-dialog-header,.cl-header{padding:12px 14px}.cl-dialog-body{padding:14px}.pn-map-controls{display:flex;flex-wrap:wrap}.pn-map-controls>select,.pn-map-controls>.cl-select-trigger{flex:1;min-width:100px}.pn-map-search{flex:1 1 100%;min-width:0}.pn-map-inspector{width:44%;max-width:44%;padding:10px}.pl-navigation{margin-left:8px;margin-right:8px}.pn-career-identity h2{font-size:19px}}
@media(max-height:560px){.pv-shell .pv-panel{padding:14px;max-height:calc(100vh - 96px)}.pv-shell .pv-preview{margin:10px 0}.pv-shell .pv-transport{margin:10px 0}.pl-navigation>button{min-height:30px!important}.pl-reader-workspace .cl-root{top:12px}}

/* One persistent header vocabulary across the four workspaces. */
.pl-workspace-page>header .cl-header-tools,.pl-workspace-page>header .cl-dismiss,.pl-workspace-page>header .pl-home-back{display:none!important}
.pl-workspace-page>header .cl-brand,.pl-workspace-page>header h2{flex:1;justify-content:flex-start;text-align:left;min-width:0;white-space:nowrap}
.pl-workspace-page>header .cl-row,.pl-workspace-page>.cl-dialog-header{display:flex;align-items:center;gap:8px}
.pl-main-actions button[aria-current=page]{background:color-mix(in srgb,var(--cl-accent,var(--pv-accent)) 10%,var(--cl-bg,var(--pv-surface)))!important;color:var(--cl-accent,var(--pv-accent))!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cl-accent,var(--pv-accent)) 18%,transparent)}
/* Selection stays distinct from both idle and hover, including icon-only tabs. */
:is(.cl-root,.cl-dialog,.cl-card,.cl-summary) :is(.cl-tabs,.pn-task-tabs,.pn-map-views,.pn-career-filters,.pn-ref-filters,.pn-topic-chips,.cl-summary-modes)>button:is([aria-selected=true],[aria-pressed=true]){background:color-mix(in srgb,var(--cl-accent) 10%,var(--cl-bg))!important;color:var(--cl-accent)!important;border-color:transparent;box-shadow:0 2px 5px #00000012;font-weight:650}
.pv-shell :is(.pv-mode-options,.pv-settings-tabs)>button:is([aria-pressed=true],[aria-selected=true]){background:color-mix(in srgb,var(--pv-accent) 10%,var(--pv-surface))!important;color:var(--pv-accent)!important;box-shadow:0 2px 5px #00000012}
.pv-shell .pv-mode-options>button[aria-pressed=true] .pv-icon{filter:var(--pv-icon-filter);opacity:1}
.pv-shell .pv-mode-options>button[aria-pressed=true]::after{display:none}
/* Quiet action surfaces use the same tint as the selected tabs. */
.pv-shell[data-theme] .pv-panel .pv-primary,.pv-shell .pv-llm-actions button:last-child,.pv-shell .pv-update-notice-actions button:last-child{background:color-mix(in srgb,var(--pv-accent) 10%,var(--pv-surface))!important;color:var(--pv-accent)!important;box-shadow:0 2px 6px #00000012}
.pv-shell[data-theme] .pv-panel .pv-primary .pv-icon{filter:var(--pv-icon-filter);width:24px;height:24px}
.pv-shell .pv-panel .pv-primary{min-width:46px;width:46px;height:42px;padding:9px;border-radius:13px}
.pv-primary [data-field=primaryLabel]{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
:is(.cl-root,.cl-dialog,.cl-card,.cl-floating) button.cl-primary,.pl-engine-actions button:first-child{background:color-mix(in srgb,var(--cl-accent) 10%,var(--cl-bg))!important;color:var(--cl-accent)!important}
.pv-shell .pv-panel .pv-mode-options>button{height:auto!important;min-height:62px;line-height:1.35;justify-content:center;gap:6px;padding:9px 4px;white-space:normal}
.pv-shell .pv-mode-options>button>span{display:block;line-height:1.35}

/* Hide scroll chrome without disabling wheel, touchpad, or keyboard scrolling. */
:is(.pv-shell,.pv-caption,.cl-root,.cl-dialog,.cl-card,.cl-native-host,.cl-floating,.cl-summary,.cl-menu,.cl-select-popover,.pn-career,.pl-settings),:is(.pv-shell,.pv-caption,.cl-root,.cl-dialog,.cl-card,.cl-native-host,.cl-floating,.cl-summary,.cl-menu,.cl-select-popover,.pn-career,.pl-settings) *{scrollbar-width:none!important}
:is(.pv-shell,.pv-caption,.cl-root,.cl-dialog,.cl-native-host,.cl-floating,.cl-summary,.cl-menu,.pl-settings)::-webkit-scrollbar,:is(.pv-shell,.pv-caption,.cl-root,.cl-dialog,.cl-native-host,.cl-floating,.cl-summary,.cl-menu,.pl-settings) *::-webkit-scrollbar{display:none!important;width:0;height:0}
/* Equal tab cells and content-driven rows keep translated labels aligned. */
.cl-settings .cl-settings-tabs.cl-tabs,.pv-shell .pv-settings-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:stretch;gap:4px}
.cl-settings .cl-settings-tabs.cl-tabs>button,.pv-shell .pv-settings-tabs>button{height:auto!important;min-width:0;min-height:42px;display:flex;justify-content:center;align-items:center;padding:7px 6px;text-align:center;line-height:1.35;white-space:normal;overflow-wrap:normal;word-break:normal}
.pv-shell .pv-setting-row,.cl-settings .cl-setting-row{height:auto!important;min-height:38px;display:flex;align-items:center;gap:12px;padding-block:4px}
.pv-shell .pv-setting-row>:is(label,span):first-child,.cl-settings .cl-setting-row>label{flex:1 1 42%;min-width:0;white-space:normal;overflow-wrap:break-word;line-height:1.45}
.pv-shell .pv-setting-row>:is(select,.pv-select),.cl-settings .cl-setting-row>:is(select,.cl-select-trigger){flex:0 1 56%;min-width:0;max-width:56%}
.pv-shell .pv-setting-row>input[type=checkbox],.cl-settings .cl-setting-row>input[type=checkbox]{flex:none;margin:0;width:28px;height:16px}
.pv-shell .pv-shortcut-row{height:auto;min-height:38px;gap:12px;align-items:center;padding-block:4px}.pv-shell .pv-shortcut-row>span:first-child{min-width:0;white-space:normal;line-height:1.45}.pv-shell .pv-shortcut-key{flex:none}
.pv-shell .pv-mode-note,.pv-shell .pv-status{height:auto;min-height:18px;overflow:visible;display:block;white-space:normal;overflow-wrap:break-word;line-height:1.5}.pv-shell .pv-mode-note{min-height:36px}
.pv-shell .pv-context-row{height:auto;min-height:30px;align-items:center;gap:8px}.pv-shell .pv-footer{height:auto;min-height:20px;gap:12px}.pv-shell .pv-footer>*{min-width:0;line-height:1.45}.pv-shell .pv-footer>span{white-space:normal;text-align:right}
.pl-engine-actions{display:flex;flex-wrap:wrap;align-items:stretch}.pl-engine-actions>button{height:auto;min-width:0;white-space:normal;text-align:center;flex:1 1 160px;padding:9px 12px}
.pv-shell .pv-panel .pv-mode-options{gap:3px}.pv-shell .pv-panel .pv-mode-options>button{font-size:12px;min-width:0}.pv-shell .pv-mode-options>button>span{white-space:nowrap}
@media(max-width:380px){.pv-shell .pv-panel .pv-mode-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}}

/* Compact settings controls and platform-independent language flags. */
.pl-flag{display:inline-block!important;width:24px!important;height:16px!important;object-fit:contain;filter:none!important;vertical-align:middle;border-radius:2px;flex:none;opacity:1!important}
.pl-language-select{min-width:48px!important;width:auto!important;flex:0 0 auto!important;justify-content:flex-end!important}.pl-language-select .cl-select-value,.pl-language-select .pv-select-value{flex:none;display:flex;align-items:center;overflow:visible}
.pl-language-option{min-height:32px;justify-content:center!important;gap:8px!important}.pl-language-option>span:first-child{flex:none!important;display:flex;align-items:center}
.cl-settings .cl-settings-tabs.cl-tabs{display:flex;justify-content:center;background:transparent!important;padding:2px 0;gap:10px;margin:2px 18px 10px}
.cl-settings .cl-settings-tabs.cl-tabs>button{flex:none;width:44px;min-height:38px;padding:8px;background:transparent;border-radius:10px}
.pl-settings-icon{display:block;width:21px;height:21px;background:currentColor;mask:var(--pl-settings-icon) center/contain no-repeat;pointer-events:none}
.pl-settings .cl-dialog-footer{gap:10px;padding-top:10px}.pl-settings .cl-update-links{display:flex;align-items:center;gap:16px;width:100%;margin-top:4px}
.pl-settings .cl-update-links button{background:transparent!important;border:0!important;box-shadow:none!important;padding:4px 0!important;min-height:24px;color:var(--cl-muted);font-size:12px}.pl-settings .cl-update-links button:hover{color:var(--cl-accent);text-decoration:underline}
.pl-settings .pl-update-schedule{justify-content:space-between;gap:12px}.pl-settings .pl-update-schedule .cl-select-trigger{background:transparent!important;box-shadow:none;border:0;padding:4px 0;min-height:28px;flex:none}
.pl-embedded .pv-panel,.pl-embedded .pv-settings-content{height:auto!important;min-height:0!important}.pl-embedded [data-settings-pane]{height:auto!important;min-height:0!important}
.pl-engine{margin:10px 0 0;padding:12px;border:0!important;border-radius:12px}.pl-engine h3{font-size:14px;margin:0 0 5px}.pl-engine p{margin:5px 0;font-size:12px;line-height:1.45}.pl-engine-actions{margin-top:8px;gap:8px}.pl-engine-actions>button{flex:1 1 100px;min-height:32px;padding:6px 10px;font-size:12px}.pl-engine details{margin-top:8px;font-size:12px;line-height:1.5}.pl-engine details p{overflow-wrap:anywhere}
/* Product typography: title 17/600, interface 13/400, supporting text 12/400.
   Reading content retains its separately selected font and size. */
:is(.pv-shell,.cl-root,.cl-dialog,.cl-card,.cl-floating,.cl-summary,.cl-menu,.cl-select-popover,.cl-tooltip,.pv-tooltip,.pl-conflicts){font-family:var(--pl-font)!important;font-size:var(--pl-body-size);line-height:1.5}
:is(.pv-shell,.cl-root,.cl-dialog,.cl-card,.cl-floating,.cl-summary,.cl-menu,.cl-select-popover,.pl-conflicts) :is(button,input,select,textarea,label,summary,kbd),.pv-panel,.pv-select-popover{font-family:var(--pl-font)!important;letter-spacing:0}
:is(.pv-panel,.cl-root,.cl-dialog) :is(.pv-brand,.cl-brand,.cl-dialog-header h2){font-family:var(--pl-font)!important;font-size:var(--pl-title-size)!important;line-height:1.4;font-weight:600}
:is(.pv-panel,.pl-settings) :is(.pv-setting-row,.cl-setting-row,.pv-shortcut-row,.cl-llm-heading,.pv-llm-heading){font-family:var(--pl-font)!important;font-size:var(--pl-body-size)!important;font-weight:400;line-height:1.5!important}
:is(.pv-panel,.pl-settings) :is(.pv-setting-row,.cl-setting-row,.pv-shortcut-row) :is(label,span,button,input,select,output){font-size:var(--pl-body-size)!important;line-height:1.5!important}
:is(.pv-panel,.cl-root,.cl-dialog) :is(.cl-note,.cl-status,.cl-muted,.cl-byline,.cl-authors,.cl-journal,.pv-mode-note,.pv-status,.pv-footer,.pv-shortcut-key,.pl-engine p,.cl-dialog-footer,.cl-dialog-footer button){font-size:var(--pl-meta-size)!important;line-height:1.5}
:is(.cl-menu,.cl-select-popover,.pv-select-popover){font-size:var(--pl-body-size)!important;line-height:1.5}
/* Listening, references and settings share outer width and content gutters. */
.cl-root.pl-workspace-page,.cl-settings.pl-settings{width:var(--pl-panel-width);max-width:calc(100vw - 32px)!important}
.cl-root .cl-header,.cl-settings .cl-dialog-header{padding:20px 20px 12px}
.cl-settings .cl-dialog-body{padding:4px 20px 12px;min-width:0}
.cl-settings .cl-dialog-footer{padding:8px 20px 16px}
.cl-root.pl-workspace-page .cl-listbar,.cl-root.pl-workspace-page .cl-panel-footer{padding:8px var(--pl-content-inset)}
.cl-root.pl-workspace-page .cl-list-row{padding:10px var(--pl-content-inset)}
.cl-root .cl-list-row .cl-byline{gap:3px 6px;margin-top:5px}
.cl-root .cl-list-meta{gap:4px 6px;margin-top:6px}
.cl-root .cl-search{margin-top:10px}
.cl-root .cl-listbar>.cl-muted{min-width:0}.cl-root .cl-listbar>.cl-actions{flex:none}
.cl-settings .cl-setting-row>div:first-child:not(.cl-model-combo){flex:1 1 42%;min-width:0}
.cl-settings .cl-setting-row label{white-space:normal;overflow-wrap:break-word}
.cl-settings .cl-setting-row>input[type=range]{flex:1;min-width:0;width:0}
.cl-settings .cl-setting-row>output{flex:none;min-width:32px;text-align:right}
.cl-settings .cl-setting-row{min-height:var(--pl-row-height);gap:10px}
.cl-settings.pl-settings .cl-setting-row>.cl-select-trigger:not(.pl-language-select){padding-inline-end:0}
.pl-embedded .pv-shortcut-row>.pv-shortcut-key{width:96px;min-width:96px;max-width:96px}
.pl-embedded .pv-setting-row{min-height:var(--pl-row-height);gap:10px}
.pl-embedded .pv-caption-style-row{display:grid;grid-template-columns:max-content minmax(0,1fr) 54px;gap:8px}
.pl-embedded .pv-caption-style-row>label{grid-column:auto;max-width:100px;white-space:nowrap}
.pl-embedded .pv-caption-style-row>.pv-select{max-width:100%;width:100%}
.pl-embedded .pv-caption-style-row>.pv-select .pv-select-trigger{width:100%}
.pl-embedded .pv-caption-style-row>[data-select-field=captionFont] .pv-select-trigger{justify-content:flex-end;text-align:right}
.pl-embedded .pv-companion-row{flex-wrap:wrap}
.pl-embedded .pv-companion-row>label{flex:1 1 100%}
.pl-embedded .pv-companion-row>.pv-select{margin-left:auto;flex:0 1 auto;max-width:100px}
.pl-settings .pl-update-schedule{align-items:center;font-size:var(--pl-meta-size)}
.pl-settings .pl-update-schedule>label{min-width:0;flex:1;gap:6px}
.pl-settings .cl-update-row{display:flex;flex-wrap:wrap;gap:6px 10px}
.pl-settings .cl-update-row>[data-update-status]{order:2;flex:1 1 100%;white-space:normal;overflow:visible;line-height:1.5}
.pl-settings .cl-update-links{justify-content:space-between;gap:10px}
/* Flags carry selection through tint alone; all rows share one centre. */
.pl-language-option :is(.cl-select-check,.pv-select-check){display:none!important}
.pl-language-option{padding:6px!important;justify-content:center!important}
.pl-language-option[aria-selected=true]{background:color-mix(in srgb,var(--cl-accent,var(--pv-accent)) 10%,var(--cl-bg,var(--pv-surface)))!important}
:is(.cl-select-popover,.pv-select-popover).pl-language-menu{min-width:48px!important;width:48px!important;box-sizing:border-box}
.pl-provider-icon{display:block;width:24px;height:24px;object-fit:contain;filter:none!important;flex:none}
.cl-settings.pl-settings .cl-dialog-body{padding:4px var(--pl-page-padding) 12px!important}
.pl-embedded .pv-caption-style-row>.pv-select{max-width:100%!important}
.cl-settings.pl-settings .cl-setting-row input[type=range]{min-height:4px;height:4px;padding:0;background:var(--cl-line)}
.cl-settings .cl-llm-settings .cl-setting-row{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:10px}
.cl-settings .cl-llm-settings .cl-setting-row>div:first-child{min-width:0}
.cl-settings .cl-llm-settings .cl-setting-row>:is(input,.cl-model-combo){width:100%;max-width:100%;min-width:0}
.cl-settings .cl-llm-settings .cl-setting-row>.pl-language-select{justify-self:end;grid-column:2/-1}
.cl-settings .cl-llm-heading strong{font-size:var(--pl-body-size);font-weight:600}
.cl-settings .cl-llm-summary{font:400 var(--pl-body-size)/1.5 var(--pl-font);gap:8px}
/* Connected page tabs: primary workspaces below, settings categories above. */
.pl-workspace-page{--pl-page-surface:color-mix(in srgb,var(--cl-accent,var(--pv-accent)) 12%,var(--cl-bg,var(--pv-surface)));--pl-tab-surface:color-mix(in srgb,var(--cl-accent,var(--pv-accent)) 17%,var(--cl-bg,var(--pv-surface)));--pl-tab-line:color-mix(in srgb,var(--cl-accent,var(--pv-accent)) 28%,transparent);display:flex!important;flex-direction:column;padding:8px!important;overflow:hidden!important;gap:0}
.pl-workspace-content{position:relative;display:flex;flex-direction:column;min-width:0;min-height:0;flex:1 1 auto;background:var(--pl-page-surface);border-radius:12px;box-shadow:inset 0 0 0 1px var(--pl-tab-line);overflow:hidden}
.pl-workspace-content>.pv-header,.pl-workspace-content>.cl-dialog-header{display:none!important}
.pl-workspace-content>.cl-header>.cl-row{display:none!important}
.pl-workspace-content>[data-field=home],.pl-workspace-content>[data-field=settingsPage]{padding:16px var(--pl-content-inset);overflow:auto;min-height:0;display:flex;flex-direction:column;flex:1}
.pl-workspace-content>[hidden]{display:none!important}
.pl-workspace-page>.pl-main-actions{display:flex;justify-content:center;gap:12px;flex:none;width:100%;height:46px;margin:0;padding:0 8px 4px;isolation:isolate}
.pl-workspace-page>.pl-main-actions>button{position:relative;margin:0;flex:none;align-self:flex-start;width:48px!important;height:42px!important;min-width:48px!important;min-height:42px!important;padding:10px!important;border-radius:0 0 12px 12px!important;background:transparent!important;color:var(--cl-muted,var(--pv-muted));box-shadow:none!important}
.pl-workspace-page>.pl-main-actions>button>svg{width:21px;height:21px}
.pl-workspace-page>.pl-main-actions>button[aria-current=page]{background:transparent!important;color:var(--cl-accent,var(--pv-accent))!important;box-shadow:inset 1px 0 var(--pl-tab-line),inset -1px 0 var(--pl-tab-line),inset 0 -1px var(--pl-tab-line)!important}
.pl-workspace-page>.pl-main-actions>button[aria-current=page]::before{content:'';position:absolute;left:1px;right:1px;top:-2px;height:4px;background:var(--pl-page-surface);pointer-events:none}
.pl-workspace-page>.pl-main-actions>button[aria-current=page]::after{display:none}
.cl-settings.pl-settings .cl-settings-tabs.cl-tabs{position:relative;display:flex;flex:none;justify-content:flex-end;align-items:flex-end;flex-wrap:nowrap;margin:0;padding:2px var(--pl-nav-right,58px) 0 0;gap:12px;height:38px;min-height:38px;border-radius:0}
.cl-settings.pl-settings .cl-settings-tabs.cl-tabs>button{position:relative;flex:none;width:48px;min-width:48px;height:36px!important;min-height:36px;padding:7px 10px;border-radius:12px 12px 0 0;margin:0}
.cl-settings.pl-settings .cl-settings-tabs.cl-tabs>button[aria-selected=true]{background:transparent!important;color:var(--cl-accent)!important;box-shadow:inset 1px 0 var(--pl-tab-line),inset -1px 0 var(--pl-tab-line),inset 0 1px var(--pl-tab-line)!important}
.cl-settings.pl-settings .cl-settings-tabs.cl-tabs>button[aria-selected=true]::after{content:'';position:absolute;left:1px;right:1px;bottom:-2px;height:4px;z-index:2;background:var(--pl-tab-surface);pointer-events:none}
.cl-settings.pl-settings .cl-dialog-body{margin:0 0 8px;padding:8px var(--pl-content-inset) 12px!important;border-radius:10px;background:var(--pl-tab-surface);box-shadow:inset 0 0 0 1px var(--pl-tab-line)}
.cl-settings.pl-settings .cl-dialog-footer{padding:4px 20px 12px}
.cl-root.pl-workspace-page .cl-header{padding:12px var(--pl-content-inset) 4px}.cl-root.pl-workspace-page .cl-header>.cl-tabs{margin-top:0}
.pn-map-window.pl-workspace-page .pn-map-workspace{gap:8px;padding:8px;box-sizing:border-box}
.pn-map-window.pl-workspace-page .pn-map-stage{margin:0;border-radius:10px;overflow:hidden}
.pn-map-window.pl-workspace-page .pn-map-inspector{margin:0;border-radius:10px}
.pn-map-window.pl-workspace-page .pn-map-tools{bottom:12px;left:12px}
/* The entire value is the dropdown target; no redundant chevron. */
.cl-select-arrow,.pv-select-arrow{display:none!important}
.pl-language-select{min-width:32px!important;justify-content:flex-end!important;padding-inline:8px 0!important;margin-right:0}
.cl-settings .cl-setting-row>.pl-provider-settings{flex:none;width:30px;height:32px;min-height:32px;padding:6px;background:transparent}
.cl-settings .cl-setting-row:has(>.pl-provider-settings)>div:first-child{flex:1}
.cl-settings .cl-setting-row:has(>.pl-provider-settings){gap:4px}
/* Editable model fields keep an icon for opening their provider model list. */
.cl-model-toggle::after{content:'';width:15px;height:15px;display:block;background:currentColor;clip-path:polygon(0 10%,20% 10%,20% 25%,0 25%,0 10%,35% 10%,100% 10%,100% 25%,35% 25%,35% 10%,0 43%,20% 43%,20% 58%,0 58%,0 43%,35% 43%,100% 43%,100% 58%,35% 58%,35% 43%,0 76%,20% 76%,20% 91%,0 91%,0 76%,35% 76%,100% 76%,100% 91%,35% 91%)}
/* Fixed right-side tab coordinates, independent of workspace width. */
.pv-shell .pv-panel.pl-workspace-page{width:var(--pl-panel-width)}
.pl-workspace-page{padding-bottom:4px!important}
/* A shared art canvas crops from the top as compact pages change height. */
.pl-workspace-page{--pl-art-size:auto max(480px,calc(100vh - 112px))}
.pv-shell[data-theme] .pv-panel.pl-workspace-page::before{background-position:left bottom;background-size:100% 100%,var(--pl-art-size);background-repeat:no-repeat}
:is(.cl-root,.cl-settings).pl-workspace-page::before{background-position:left bottom;background-size:100% 100%,100% 100%,var(--pl-art-size);background-repeat:no-repeat}
.pl-workspace-page>.pl-main-actions{justify-content:flex-end;height:38px;padding:0 var(--pl-nav-right,58px) 2px 0;gap:12px}
.pl-workspace-page>.pl-main-actions>button{height:36px!important;min-height:36px!important;padding:7px 10px!important}
@media(max-width:350px){.pl-workspace-page{--pl-nav-right:12px}}
:is(.cl-select-popover,.pv-select-popover) [role=option]:not(.pl-language-option){justify-content:flex-end;text-align:right;white-space:normal}
:is(.cl-select-popover,.pv-select-popover) [role=option]:not(.pl-language-option)>span:first-child{flex:1;min-width:0;text-align:right;overflow-wrap:break-word}
/* Settings categories retain one outer height and a common row rhythm. */
.cl-settings.pl-settings{height:540px;max-height:calc(100vh - var(--pl-dock-bottom,24px) - 16px)}
.pl-settings .cl-dialog-body{flex:1;min-height:0;overflow:auto;padding-top:8px;padding-bottom:16px}
.pl-settings .cl-setting-row,.pl-embedded.pv-shell .pv-setting-row,.pl-embedded.pv-shell .pv-shortcut-row{height:auto!important;min-height:var(--pl-row-height)!important;margin:0!important;padding:0!important;align-items:center}
.pl-embedded.pv-shell .pv-caption-style-row{gap:0 8px}
.pl-embedded .pv-caption-style-row>label{min-height:var(--pl-row-height);display:flex;align-items:center}
.pl-settings .cl-general-data{margin:0}
.cl-settings.pl-settings .cl-settings-pane{animation:none;transform:none}
.cl-settings.pl-settings .cl-dialog-footer.cl-update-footer{padding:0;margin-top:16px;gap:0;min-height:0;flex:none}
.pl-settings .cl-update-footer>.pl-update-schedule,.pl-settings .cl-update-footer>.cl-update-row{min-height:var(--pl-row-height);margin:0;width:100%}
.pl-settings .cl-update-footer>.cl-update-links{min-height:var(--pl-row-height);margin:12px 0 0;justify-content:space-between}
.pl-embedded .pl-engine{margin:16px 0 0;padding:12px}
.pl-embedded .pv-shortcuts-actions{margin-top:16px}
/* The model editor unfolds below its gear, without replacing the settings page. */
.cl-settings .cl-llm-popover{position:absolute;z-index:20;left:16px;right:16px;margin:0;padding:0;isolation:isolate}
.cl-settings .cl-llm-content{max-height:inherit;overflow:auto;scrollbar-width:none;padding:12px;border-radius:12px;background:var(--cl-bg);box-shadow:0 8px 28px #172c3d26,inset 0 0 0 1px var(--pl-tab-line)}
.cl-settings .cl-llm-popover::before{content:'';position:absolute;left:clamp(18px,calc(var(--pl-model-anchor) - 7px),calc(100% - 30px));top:-7px;width:14px;height:14px;background:var(--cl-bg);transform:rotate(45deg);box-shadow:-1px -1px var(--pl-tab-line);z-index:1;pointer-events:none}
.cl-settings .cl-llm-heading{display:flex;align-items:center;gap:8px;margin:0 0 8px}
.cl-settings .cl-llm-heading strong{flex:1}.cl-settings .cl-llm-heading>.cl-icon-button{width:28px;min-width:28px;height:28px;min-height:28px;padding:5px}
.cl-settings .cl-llm-content .cl-setting-row{grid-template-columns:80px minmax(0,1fr) auto;min-height:38px;gap:8px}
.cl-settings .cl-llm-content .cl-llm-actions{display:flex;gap:8px;margin-top:12px}.cl-settings .cl-llm-content .cl-llm-actions>button{flex:1;min-height:32px}
.cl-settings .cl-llm-content .cl-translation-status{font-size:12px;line-height:1.5;margin-top:8px;overflow-wrap:anywhere}.cl-settings .cl-llm-content .cl-translation-status:empty{display:none}
.pl-provider-settings[aria-expanded=true]{background:var(--cl-bg)!important;box-shadow:inset 0 0 0 1px var(--pl-tab-line);border-radius:8px}
.cl-model-toggle::after{clip-path:none;background:linear-gradient(currentColor,currentColor) 0 2px/3px 2px no-repeat,linear-gradient(currentColor,currentColor) 6px 2px/9px 2px no-repeat,linear-gradient(currentColor,currentColor) 0 7px/3px 2px no-repeat,linear-gradient(currentColor,currentColor) 6px 7px/9px 2px no-repeat,linear-gradient(currentColor,currentColor) 0 12px/3px 2px no-repeat,linear-gradient(currentColor,currentColor) 6px 12px/9px 2px no-repeat}
/* Embedded settings inherit the parent surface without glass tint or saturation. */
html.pl-settings-document,html.pl-settings-document body,.pl-embedded.pv-shell,.pl-embedded.pv-shell .pv-panel,.pl-embedded .pv-settings-content,.pl-embedded [data-settings-pane]{background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important}
.pl-embedded .pv-panel::before,.pl-embedded .pv-panel::after{display:none!important}
/* Equal top/bottom margins and mirrored category/navigation tab geometry. */
.cl-settings.pl-settings{padding-top:4px!important}
.cl-settings.pl-settings .cl-settings-tabs .pl-settings-icon{width:21px;height:21px}
.cl-settings.pl-settings .cl-settings-tabs{--pl-category-right:calc(var(--pl-nav-right,58px) + (3 - var(--pl-category-index,0))*60px)}
.cl-settings.pl-settings .cl-settings-tabs::before,.cl-settings.pl-settings .cl-settings-tabs::after{content:'';position:absolute;bottom:0;height:1px;background:var(--pl-tab-line);pointer-events:none}
.cl-settings.pl-settings .cl-settings-tabs::before{left:12px;right:calc(var(--pl-category-right) + 48px)}
.cl-settings.pl-settings .cl-settings-tabs::after{left:calc(100% - var(--pl-category-right));right:12px}
.cl-select-check,.pv-select-check{display:none!important}
.pv-shell[data-background-mode=global] .pv-panel.pl-workspace-page::before{background-position:center;background-size:100% 100%,cover}
html[data-cl-background-mode=global] :is(.cl-root,.cl-settings).pl-workspace-page::before{background-position:center;background-size:100% 100%,100% 100%,cover}
/* Open content surface; only the lower edge flows into the active tab. */
.pl-workspace-content{background:transparent;box-shadow:none;border-radius:0}
.cl-settings.pl-settings .cl-dialog-body{background:transparent;box-shadow:none}
.cl-settings.pl-settings .cl-settings-tabs.cl-tabs>button[aria-selected=true]::after{display:none}
.pl-workspace-page>.pl-main-actions{position:relative;--pl-selected-right:calc(var(--pl-nav-right,58px) + (var(--pl-page-count,3) - 1 - var(--pl-active-index,0))*60px)}
.pl-workspace-page>.pl-main-actions::before,.pl-workspace-page>.pl-main-actions::after{content:'';position:absolute;top:0;height:1px;background:var(--pl-tab-line);pointer-events:none}
.pl-workspace-page>.pl-main-actions::before{left:12px;right:calc(var(--pl-selected-right) + 48px)}
.pl-workspace-page>.pl-main-actions::after{left:calc(100% - var(--pl-selected-right));right:12px}
.pl-workspace-page>.pl-main-actions>button[aria-current=page]::before{display:none}

.pl-engine .pl-engine-heading{font:400 var(--pl-meta-size,12px)/1.5 var(--pl-font);display:flex;justify-content:center;align-items:center;gap:8px}
.pl-engine-badge{font:400 var(--pl-meta-size,12px)/1.5 var(--pl-font);color:var(--pv-muted)}
.pl-engine .pl-engine-status{text-align:center;margin:8px 0;min-height:18px}
.pl-engine-progress{display:flex;align-items:center;gap:10px;margin:8px 0}
.pl-engine-progress[hidden]{display:none}
.pl-engine-progress progress{flex:1;min-width:0;width:auto}
.pl-engine-progress button{display:flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;padding:5px;background:transparent!important;border:0;white-space:nowrap;font:inherit;color:var(--pv-muted)}

.cl-select-popover,.pv-select-popover{box-sizing:border-box}

.pl-engine-actions{justify-content:center;gap:12px}
.pl-engine .pl-engine-actions>button{flex:0 0 48px;height:32px;min-height:32px;display:flex;align-items:center;justify-content:center;padding:6px;border:1px solid var(--pv-glass-line)!important;border-radius:8px;background:var(--pv-soft)!important;color:var(--pv-accent)!important}
.pl-engine-actions .pv-icon{width:19px;height:19px}
.pl-voice-symbol{position:relative;display:inline-block!important;width:26px;height:26px;flex:none}
.pl-voice-symbol>.pl-flag{position:absolute;left:0;top:2px;width:24px!important;height:16px!important;object-fit:cover;border-radius:2px}.pl-voice-avatar{position:absolute;z-index:1;right:0;bottom:0;display:block!important;width:17px;height:17px;background-repeat:no-repeat;filter:none!important;border-radius:50%;flex:none}
:is(.cl-select-popover,.pv-select-popover).pl-language-menu.pl-voice-menu{width:max-content!important;min-width:0!important}
.pl-voice-menu .pl-language-option{height:36px;min-height:36px;padding:5px!important}
.pl-voice-select .pv-select-value{overflow:visible;flex:none;transform:translateX(2px)}
/* Move only the tint. Text keeps the same right edge as menu option text. */
:is(.pl-settings .cl-select-trigger,.pv-shell .pv-select-trigger):not(.pl-language-select):not(.cl-model-toggle){position:relative;isolation:isolate;overflow:visible;background:transparent!important}
:is(.pl-settings .cl-select-trigger,.pv-shell .pv-select-trigger):not(.pl-language-select):not(.cl-model-toggle)::before{content:'';position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;transform:translateX(var(--pl-select-fill-shift,9px));background:transparent;transition:background .18s ease}
:is(.pl-settings .cl-select-trigger,.pv-shell .pv-select-trigger):not(.pl-language-select):not(.cl-model-toggle):focus-visible:not([aria-expanded=true])::before{background:transparent}
/* Menus retain their complete surface while their content scrolls. */
:is(.cl-select-popover,.pv-select-popover,.cl-menu,.cl-citation-locations){mask-image:none!important;scroll-padding-block:5px}
:is(.cl-select-trigger,.pv-select-trigger,.pl-settings [role=combobox])[aria-expanded=true],
:is(.cl-select-trigger,.pv-select-trigger)[aria-expanded=true]::before{background:transparent!important;box-shadow:none!important;transition:none!important}

.pl-embedded .pv-reading-modes .pv-mode-options{display:flex!important;grid-template-columns:none!important;gap:2px!important;margin:0!important;padding:0!important;background:transparent!important;border-radius:0!important}
.pl-embedded .pv-reading-modes .pv-mode-options button{flex:none!important;width:28px!important;height:28px!important;min-height:28px!important;min-width:28px!important;padding:5px!important;margin:0!important}
.pl-embedded .pv-reading-modes .pv-mode-options button span{display:none!important}

.pl-embedded .pv-reading-modes{gap:4px!important}
.pl-embedded .pv-reading-modes>span{margin-right:auto}
.pl-embedded .pv-reading-modes>[data-action=primary]{flex:none!important;width:28px!important;height:28px!important;min-width:28px!important;padding:5px!important}
.pl-embedded .pv-reading-modes [data-field=primaryLabel]{display:none!important}

/* Main workspaces keep stable surfaces; hover changes ink, never the fill. */
.pl-workspace-page.pl-workspace-page>.pl-main-actions>button.cl-icon-button:hover{background:transparent!important}
.pl-embedded .pv-shortcut-key{background:transparent!important}
.pl-embedded .pv-shortcut-row[data-recording=true] .pv-shortcut-key{background:var(--pv-soft)!important}
.cl-root .cl-group-stack>.cl-card:hover{--cl-card-hover:transparent!important}

:is(.cl-settings,.cl-root,.pn-network,.pl-embedded) button:hover:not([aria-pressed=true]):not([aria-selected=true]):not([aria-current=page]):not(.cl-primary):not(.pv-primary):not(.pv-theme-choice):not(.cl-theme-choice):not(.pl-engine-actions>button){background-color:transparent!important}
:is(.cl-settings,.pl-embedded) :is(.cl-select-trigger,.pv-select-trigger):hover::before{background:transparent!important}
:is(.cl-root,.pn-network) :is(.cl-list-row,.pn-member-paper,.cl-card):hover{background-color:transparent!important}
:is(.cl-settings,.cl-root,.pn-network,.pl-embedded) button:hover{color:var(--cl-accent,var(--pv-accent))}

.cl-dialog.pl-about{position:relative;width:min(460px,calc(100vw - 40px));padding:26px;border-radius:20px;font:13px/1.6 var(--pl-font)}
.cl-dialog.pl-about>.cl-dialog-body{padding:0}.cl-dialog.pl-about>.pl-about-close{position:absolute;right:12px;top:12px;padding:0;min-height:0;border:0;background:transparent}
.pl-about-hero{display:flex;align-items:center;gap:18px;padding-right:18px}.pl-about-hero>img{flex:none}
.pl-about-identity{min-width:0}.pl-about-identity h2{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;font:600 18px/1.3 var(--pl-font);margin:0 0 7px;letter-spacing:-.3px}.pl-about-version{font:400 12px/1.4 var(--pl-font);color:var(--cl-muted);letter-spacing:0}
.pl-about-identity p{font:400 13px/1.6 var(--pl-font);margin:0;color:var(--cl-muted)}
.pl-about-meta{display:flex;justify-content:space-between;gap:16px;margin:20px 0 24px;color:var(--cl-muted);font-size:12px}
.pl-about-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:18px}.cl-dialog.pl-about .pl-about-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:36px;border-radius:9px;background:transparent;font:400 13px/1.4 var(--pl-font)}
.pl-about-tab-icon{width:17px;height:17px;flex:none;background:currentColor;mask:var(--pl-info-icon) center/contain no-repeat}.cl-dialog.pl-about .pl-about-tabs button[aria-selected=true]{background:var(--cl-soft);color:var(--cl-accent)}
.pl-about-content{min-height:132px}.pl-about-content h3{font:600 14px/1.5 var(--pl-font);margin:0 0 8px}.pl-about-content p{font:400 13px/1.65 var(--pl-font);margin:0 0 14px;color:var(--cl-muted);overflow-wrap:anywhere}.cl-dialog.pl-about .pl-about-content button{background:transparent;padding:0;color:var(--cl-accent);font-size:13px;min-height:28px}
.pl-about .cl-dialog-footer{display:flex;justify-content:flex-end;margin:16px 0 0;padding:0;border:0}.pl-about .cl-dialog-footer button{background:transparent;padding:0;color:var(--cl-muted);font-size:12px}
.cl-dialog.pl-about button:not([aria-selected=true]){background:transparent!important}.cl-dialog.pl-about button:hover:not([aria-selected=true]){color:var(--cl-accent)}.pl-settings .cl-update-links{justify-content:center!important}
`;
