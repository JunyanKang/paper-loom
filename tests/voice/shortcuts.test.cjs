process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),s=require('../../addon/voice/shortcuts.js');
test('ten defaults serialize and match physical Option and Alt keys',()=>{
 assert.equal(s.actions.length,10);assert.deepEqual(s.read(s.encode(s.defaults())),s.defaults());
 assert.equal(s.eventKey({key:'†',code:'KeyT',altKey:true}),'Alt+KeyT');assert.equal(s.match(null,{key:' ',code:'Space'}),'pause');
 assert.equal(s.format('Alt+ArrowUp',true),'Option + ↑');assert.equal(s.format('Alt+ArrowUp',false),'Alt + ↑');assert.equal(s.aria('Ctrl+KeyP'),'Control+P');
});
test('latest edit exchanges the conflicting action without duplicate bindings',()=>{
 let a=s.assign(null,'nextSentence','ArrowUp');assert.equal(a.conflict.id,'previousSentence');assert.equal(a.bindings.previousSentence,'ArrowDown');assert.equal(a.bindings.nextSentence,'ArrowUp');
 let b=s.assign(a.value,'replaySentence','ArrowUp');assert.equal(b.bindings.nextSentence,'ArrowLeft');assert.equal(b.bindings.replaySentence,'ArrowUp');
 assert.equal(new Set(Object.values(b.bindings)).size,10);assert.deepEqual(s.read(b.value),b.bindings);
});
test('an action without a released key unassigns the conflict and survives restoration',()=>{
 const a=s.assign(null,'nextSentence',null),b=s.assign(a.value,'nextSentence','Space');
 assert.equal(b.conflict.kind,'unset');assert.equal(b.bindings.pause,null);assert.equal(s.read(b.value).pause,null);assert.equal(s.read(b.value).nextSentence,'Space');
});
test('malformed preferences fall back and explicit custom choices own default keys',()=>{
 assert.deepEqual(s.read('{'),s.defaults());assert.deepEqual(s.read({version:99,bindings:{}}),s.defaults());
 const a=s.read({version:1,bindings:{nextSentence:'Space',stop:'invalid',noSuchAction:'KeyX'}});assert.equal(a.nextSentence,'Space');assert.equal(a.pause,null);assert.equal(a.stop,'Escape');
 assert.equal(s.assign(null,'missing','Space').ok,false);assert.equal(s.normalize('Alt+Ctrl+KeyT'),'Ctrl+Alt+KeyT');assert.equal(s.normalize('Ctrl+Ctrl+KeyT'),null);
});
test('recording ignores IME, AltGraph and modifier-only keys, including Windows combinations',()=>{
 for(const e of [{isComposing:true,key:'a',code:'KeyA'},{key:'Alt',code:'AltLeft',altKey:true},{key:'a',code:'KeyA',getModifierState:()=>true}])assert.equal(s.eventKey(e),null);
 assert.equal(s.eventKey({key:'a',code:'KeyA',ctrlKey:true,shiftKey:true}),'Ctrl+Shift+KeyA');assert.equal(s.eventKey({key:'x',code:'KeyX',metaKey:true}),'Meta+KeyX');
 assert.equal(s.systemKey('Meta+KeyQ',true),true);assert.equal(s.systemKey('Alt+F4',false),true);assert.equal(s.systemKey('Ctrl+KeyJ',false),false);
});
test('Gecko macOS Option AltGraph events match defaults and custom physical keys',()=>{
 const e={key:'ArrowUp',code:'ArrowUp',altKey:true,getModifierState:k=>k==='AltGraph'};
 assert.equal(s.eventKey(e,true),'Alt+ArrowUp');assert.equal(s.match(null,e,true),'previousParagraph');
 assert.equal(s.match(null,{...e,key:'ArrowDown',code:'ArrowDown'},true),'nextParagraph');
 const letter={...e,key:'†',code:'KeyT'};assert.equal(s.match(null,letter,true),'translation');
 const custom=s.assign(null,'nextParagraph','Alt+KeyJ');assert.equal(s.match(custom.value,{...e,key:'∆',code:'KeyJ'},true),'nextParagraph');
 for(const event of [e,letter,{...letter,ctrlKey:true}])assert.equal(s.eventKey(event,false),null);
});

test('translated audio key joins old preferences without overriding user choices',()=>{
 const old={version:1,bindings:{translation:'Alt+KeyR'}};const b=s.read(old);assert.equal(b.translation,'Alt+KeyR');assert.equal(b.readTranslation,null);
 const moved=s.assign(JSON.stringify(old),'readTranslation','Alt+KeyR');assert.equal(moved.bindings.readTranslation,'Alt+KeyR');assert.equal(moved.bindings.translation,null);
 for(const mac of [true,false])assert.equal(s.match(null,{key:'r',code:'KeyR',altKey:true},mac),'readTranslation');
});
