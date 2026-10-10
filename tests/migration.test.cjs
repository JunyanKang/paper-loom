const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){
 const values=new Map(),files=new Map(),logins=[],writes=[];
 const prefs={PREF_BOOL:128,PREF_INT:64,PREF_STRING:32,getChildList:p=>[...values.keys()].filter(k=>k.startsWith(p)),prefHasUserValue:k=>values.has(k),getPrefType:k=>typeof values.get(k)==='boolean'?128:typeof values.get(k)==='number'?64:32,getIntPref:(k,d)=>values.get(k)??d,getBoolPref:k=>values.get(k),getStringPref:k=>values.get(k),setIntPref:(k,v)=>values.set(k,v),setBoolPref:(k,v)=>values.set(k,v),setStringPref:(k,v)=>values.set(k,v),savePrefFile(){}};
 const io={makeDirectory:async()=>{},exists:async p=>files.has(p)||[...files.keys()].some(k=>k.startsWith(p+'/')),getChildren:async p=>[...files.keys()].filter(k=>path.dirname(k)===p),copy:async(a,b)=>files.set(b,structuredClone(files.get(a))),writeJSON:async(p,v)=>{writes.push(p);files.set(p,structuredClone(v));}};
 class Login{init(hostname,_,httpRealm,username,password){Object.assign(this,{hostname,httpRealm,username,password});}}
 const ctx={Services:{prefs,logins:{getAllLogins:async()=>logins.slice(),searchLoginsAsync:async ({origin,httpRealm})=>logins.filter(l=>(l.origin||l.hostname)===origin&&l.httpRealm===httpRealm),modifyLoginAsync:async (old,l)=>logins.splice(logins.indexOf(old),1,l),addLoginAsync:async l=>logins.push(l)}},Zotero:{DataDirectory:{dir:'/library'},Prefs:{get:(k,raw)=>values.get(raw?k:'extensions.zotero.'+k),set:(k,v)=>values.set('extensions.zotero.'+k,v)}},IOUtils:io,PathUtils:{join:path.join,filename:path.basename,profileDir:'/profile'},ChromeUtils:{importESModule:()=>({nsLoginInfo:Login})}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../addon/shared/settings.js'),'utf8'),ctx);return {M:ctx.LoomSettings,values,files,logins,writes};
}
test('migration preserves originals, copies queue and keys, and is idempotent',async()=>{
 const h=setup();h.values.set('extensions.paperVoice.voice','bf_emma');h.values.set('extensions.paperVoice.captionSize',16);h.values.set('extensions.zotero.citeLens.translationTarget','fr');
 const old={schema:1,queue:[{key:'fixture'}],metrics:[],cache:{},settings:{theme:'sakura'}};h.files.set('/library/cite-lens/state.json',old);h.logins.push({hostname:'https://fixture.invalid',httpRealm:'Paper Voice API',username:'provider',password:'test-only'});
 const originalPrefs=[...h.values],originalState=JSON.stringify(old);await h.M.migrate();
 for(const [k,v] of originalPrefs)assert.equal(h.values.get(k),v);
 assert.equal(JSON.stringify(h.files.get('/library/cite-lens/state.json')),originalState);assert.deepEqual(h.files.get('/library/paper-loom/references-state.json'),old);assert.equal(h.logins.length,2);assert.equal(h.logins[0].httpRealm,'Paper Voice API');assert.equal(h.logins[1].httpRealm,'Paper Loom API');assert.equal(h.values.get('extensions.zotero.paperLoom.shared.translationSize'),'16');
 const n=h.writes.length;await h.M.migrate();assert.equal(h.writes.length,n);assert.equal(h.logins.length,2);assert.ok(!JSON.stringify(h.files.get('/library/paper-loom/migration.json')).includes('test-only'));
});
test('Voice-only migration retains appearance and custom background',async()=>{const h=setup();h.values.set('extensions.paperVoice.theme','aurora');h.values.set('extensions.paperVoice.interfaceLanguage','en');h.files.set('/profile/paper-voice-background.jpg','fixture-image');await h.M.migrate();assert.equal(h.files.get('/library/paper-loom/references-state.json').settings.theme,'aurora');assert.equal(h.files.get('/library/paper-loom/background.jpg'),'fixture-image');assert.equal(h.files.get('/profile/paper-voice-background.jpg'),'fixture-image');});
test('existing integrated preferences, state and credentials win on migration retry',async()=>{const h=setup();h.values.set('extensions.paperVoice.voice','af_heart');h.values.set('extensions.paperLoom.voice.voice','bf_emma');h.values.set('extensions.paperVoice.llmConfigs','{"p":{"model":"old"}}');h.values.set('extensions.zotero.paperLoom.shared.llmConfigs','{"p":{"model":"new"}}');h.files.set('/library/paper-loom/references-state.json',{custom:'kept'});await h.M.migrate();assert.equal(h.values.get('extensions.paperLoom.voice.voice'),'bf_emma');assert.equal(JSON.parse(h.values.get('extensions.zotero.paperLoom.shared.llmConfigs')).p.model,'new');assert.deepEqual(h.files.get('/library/paper-loom/references-state.json'),{custom:'kept'});});

test('matching predecessor keys prefer Nexus, retry preserves new keys, and explicit restore replaces one key',async()=>{
 const h=setup(),entry=(realm,password)=>({hostname:'https://fixture.invalid',httpRealm:realm,username:'provider',password});
 h.logins.push(entry('Paper Voice API','voice-fixture'),entry('Paper Nexus API','nexus-fixture'));
 await h.M.migrate();assert.equal(h.logins.find(l=>l.httpRealm==='Paper Loom API').password,'nexus-fixture');
 h.values.set('extensions.paperLoom.migrationVersion',0);await h.M.migrate();assert.equal(h.logins.length,3);
 h.M.owner={referencesScope:{CiteLensTranslation:{get:()=>JSON.stringify({voice:{},references:{}}),set(){},translationCache:new Map(),syncSettings(){}}}};
 await h.M.restoreTranslation('voice');assert.equal(h.logins.find(l=>l.httpRealm==='Paper Loom API').password,'voice-fixture');assert.equal(h.logins.length,3);
 assert.equal(h.logins.find(l=>l.httpRealm==='Paper Nexus API').password,'nexus-fixture');
});
