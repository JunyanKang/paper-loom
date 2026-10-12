const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function setup(){
 const timers=new Map();let serial=0,closed=0;
 function surface(){const listeners=new Map(),winListeners=new Map();return {listeners,addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:(n,f)=>{if(listeners.get(n)===f)listeners.delete(n);},querySelectorAll:()=>[],defaultView:{addEventListener:(n,f)=>winListeners.set(n,f),removeEventListener:(n,f)=>{if(winListeners.get(n)===f)winListeners.delete(n);},winListeners}};}
 const doc=surface(),child=surface();Object.assign(doc.defaultView,{setTimeout:f=>{timers.set(++serial,f);return serial;},clearTimeout:id=>timers.delete(id)});
 const frame={isConnected:true,dataset:{},matches:()=>false},page={frame,container:{hidden:false},dismiss:()=>{closed++;},activate:()=>Promise.resolve()};
 const orb={matches:()=>false,contains:n=>n===orb},ui={root:{ownerDocument:doc},action:()=>orb,dispose(){},_hoverWorkspace:true};
 const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../addon/shared/shell.js'),'utf8'),c);c.PaperLoom.referencesScope={CiteLensUI:{livePages:()=>[page]}};c.PaperLoom.installOutsideCollapse(ui,{});
 const run=()=>{const all=[...timers.values()];timers.clear();all.forEach(f=>f());};
 return{doc,child,ui,frame,run,get closed(){return closed;}};
}
test('late cross-frame leave cannot close a hovered panel',()=>{const s=setup();s.frame.matches=()=>true;s.doc.listeners.get('pointerout')({relatedTarget:null});s.run();assert.equal(s.closed,0);s.frame.matches=()=>false;s.doc.listeners.get('pointerout')({relatedTarget:null});s.run();assert.equal(s.closed,1);s.ui.dispose();});
test('iframe unload and panel disposal remove all captured listeners',()=>{const s=setup();s.doc.listeners.get('load')({target:{contentDocument:s.child}});assert.ok(s.child.listeners.has('pointermove'));s.child.defaultView.winListeners.get('pagehide')();assert.equal(s.child.listeners.size,0);s.ui.dispose();assert.equal(s.doc.listeners.size,0);assert.equal(s.doc.defaultView.winListeners.size,0);});
