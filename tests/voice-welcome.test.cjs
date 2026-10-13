const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup({migration=0,legacy=false,state,installed=false,supported=true}={}){
 const prefs=new Map(state?[['extensions.paperLoom.voiceWelcome',state]]:[]),timers=new Map();let id=0,shown=0;
 const win={document:{},setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id)},owner={dead:false,voice:{language:()=> 'en'}};
 const ctx={Services:{prefs:{prefHasUserValue:k=>prefs.has(k),getIntPref:()=>migration,getChildList:()=>legacy?['old']:[],setStringPref:(k,v)=>prefs.set(k,v),getStringPref:(k,f)=>prefs.get(k)??f,savePrefFile(){}}},LoomRuntime:{installed,catalog:supported?{}:null},Zotero:{getMainWindow:()=>win}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('addon/shared/voice-welcome.js','utf8'),ctx);const W=ctx.LoomVoiceWelcome;W.show=()=>shown++;W.prepare(owner);return {W,ctx,owner,prefs,timers,get shown(){return shown;},fire(){for(const [id,fn] of timers){timers.delete(id);fn();}}};
}
test('fresh install missing voices invites once after startup, without downloading',async()=>{const h=setup();assert.equal(h.prefs.get(h.W.key),'pending');await h.W.start();assert.equal(h.shown,0);h.fire();assert.equal(h.shown,1);h.W.save('ignored');await h.W.start();assert.equal(h.timers.size,0);});
test('existing users, predecessor migration and installed voices are not interrupted',async()=>{for(const options of [{migration:2},{legacy:true},{installed:true},{state:'ignored'},{state:'accepted'},{supported:false}]){const h=setup(options);await h.W.start();h.fire();assert.equal(h.shown,0,JSON.stringify(options));}});
test('shutdown and intervening install cannot show a stale welcome',async()=>{const h=setup();await h.W.start();h.ctx.LoomRuntime.installed=true;h.fire();assert.equal(h.shown,0);h.ctx.LoomRuntime.installed=false;await h.W.start();h.W.stop();assert.equal(h.timers.size,0);});
test('welcome copy covers all five interface languages and uses bounded size text',()=>{const h=setup();for(const lang of ['en','zh','ja','fr','de']){h.owner.voice.language=()=>lang;const words=h.W.words();assert.ok(words.install&&words.guide&&words.settings);assert.match(words.size,/\{size\}/);}});
test('voice detection requires nonempty model and voice bank, not Python alone',async()=>{
 const files=new Map(),ctx={Zotero:{isWin:false},PathUtils:{join:(...x)=>x.join('/')},IOUtils:{stat:async p=>{if(!files.has(p))throw Error('missing');return files.get(p);}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('addon/shared/runtime.js','utf8'),ctx);const R=ctx.LoomRuntime;
 files.set('/engine/python/bin/python3',{type:'regular',size:100});assert.equal(await R.detectInstalled('/engine'),false);
 files.set('/engine/models/kokoro-v1.0.onnx',{type:'regular',size:100});files.set('/engine/models/voices-v1.0.bin',{type:'regular',size:0});assert.equal(await R.detectInstalled('/engine'),false);
 files.set('/engine/models/voices-v1.0.bin',{type:'regular',size:100});assert.equal(await R.detectInstalled('/engine'),true);
 ctx.Zotero.isWin=true;assert.equal(await R.detectInstalled('/engine'),false);files.set('/engine/python/python.exe',{type:'regular',size:100});assert.equal(await R.detectInstalled('/engine'),true);
});
