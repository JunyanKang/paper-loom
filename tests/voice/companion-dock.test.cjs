process.chdir(require('node:path').resolve(__dirname,'../..'));
const test=require('node:test'),assert=require('node:assert/strict'),companion=require('../../addon/voice/companion.js');
test('palm follows all articulated frames and stays continuous on reversal',()=>{
 for(let i=0;i<24;i++){const h=companion.hand(i/23);assert.equal(h.x,companion.dockHands[i][0]/256);assert.equal(h.y,companion.dockHands[i][1]/256);}
 for(let p=0;p<1;p+=.001){const a=companion.hand(p),b=companion.hand(p+.00001);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)*64<.01);}
});
test('panel seeking cancels free-running gestures and supports reverse frame order',async()=>{
 const callbacks=new Map();let id=0;
 class Image{constructor(){this.complete=true;this.naturalWidth=768;}async decode(){}}
 const win={Image,requestAnimationFrame:f=>{callbacks.set(++id,f);return id;},cancelAnimationFrame:i=>callbacks.delete(i)},sprite={ownerDocument:{defaultView:win},style:{},dataset:{},isConnected:true};
 const player=companion.player(sprite,'asset:/',()=>{});assert.equal(await player.preload('dock-present'),true);
 await player.play('roll');assert.equal(callbacks.size,1);player.seek('dock-present',.6);assert.equal(callbacks.size,0);assert.equal(sprite.dataset.frame,'14');
 player.seek('dock-present',.2);assert.equal(sprite.dataset.frame,'5');player.seek('dock-present',0);assert.equal(sprite.dataset.frame,'0');assert.equal(sprite.dataset.gesture,'dock-present');player.dispose();assert.equal(callbacks.size,0);
});
