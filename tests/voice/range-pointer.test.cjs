process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const scope={};vm.createContext(scope);vm.runInContext(fs.readFileSync('addon/voice/panel.js','utf8'),scope);
function setup(direction='ltr'){
 const handlers=new Map(),events=[];let capture=null;
 const input={min:'0',max:'40',step:'1',value:'0',disabled:false,
 ownerDocument:{defaultView:{Event:class{constructor(type){this.type=type;}},getComputedStyle:()=>({direction})}},
 getBoundingClientRect:()=>({left:100,width:160}),focus(){this.focused=true;},setPointerCapture(id){capture=id;},hasPointerCapture:id=>capture===id,releasePointerCapture(){capture=null;},
 dispatchEvent(e){events.push([e.type,this.value]);},addEventListener:(n,f)=>handlers.set(n,f),removeEventListener:n=>handlers.delete(n)};
 const dispose=scope.PaperVoiceUI.bindRangePointer(input);
 const fire=(type,x,extra={})=>{const e={type,clientX:x,pointerId:1,button:0,isPrimary:true,preventDefault(){this.prevented=true;},stopPropagation(){},...extra};handlers.get(type)?.(e);return e;};
 return {input,events,fire,dispose,handlers,captured:()=>capture};
}
test('track click changes value immediately and commits once',()=>{const t=setup();assert.ok(t.fire('pointerdown',180).prevented);assert.equal(t.input.value,'20');t.fire('pointerup',180);assert.deepEqual(t.events,[['input','20'],['change','20']]);assert.equal(t.captured(),null);});
test('drag outside the track clamps to endpoints and ignores unrelated pointers',()=>{const t=setup();t.fire('pointerdown',180);t.fire('pointermove',500,{pointerId:2});assert.equal(t.input.value,'20');t.fire('pointermove',500);assert.equal(t.input.value,'40');t.fire('pointermove',0);assert.equal(t.input.value,'0');t.fire('pointerup',0);assert.equal(t.events.filter(e=>e[0]==='change').length,1);});
test('right click, disabled control and secondary touch keep current value',()=>{const t=setup();t.fire('pointerdown',200,{button:2});t.fire('pointerdown',200,{isPrimary:false});t.input.disabled=true;t.fire('pointerdown',200);assert.equal(t.events.length,0);assert.equal(t.captured(),null);});
test('cancel retains latest value and terminates the gesture',()=>{const t=setup();t.fire('pointerdown',180);t.fire('pointercancel',240);t.fire('pointermove',240);assert.equal(t.input.value,'20');assert.equal(t.captured(),null);assert.deepEqual(t.events.at(-1),['change','20']);});
test('RTL track uses the visual direction',()=>{const t=setup('rtl');t.fire('pointerdown',100);assert.equal(t.input.value,'40');t.fire('pointerup',260);assert.equal(t.input.value,'0');});
test('dispose removes handlers and releases a captured pointer',()=>{const t=setup();t.fire('pointerdown',180);t.dispose();assert.equal(t.handlers.size,0);assert.equal(t.captured(),null);});
