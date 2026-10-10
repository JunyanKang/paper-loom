process.chdir(require('node:path').resolve(__dirname,'../..'));
const test=require('node:test'),assert=require('node:assert/strict'),c=require('../../addon/voice/companion.js');
test('Companion shuffle covers all state gestures before repeating',()=>{
 for(const ids of Object.values(c.sets))for(let i=0;i<50;i++){const queue=c.shuffled(ids,ids[0]);assert.equal(queue.length,ids.length);assert.equal(new Set(queue).size,ids.length);assert.notEqual(queue[0],ids[0]);assert.deepEqual(queue.slice().sort(),ids.slice().sort());}
});
test('Frame playback changes frame content, preserves final pose and cancels stale loads',async()=>{
 let pending=[],next=0,frames=new Map(),done=0;
 const win={Image:class{decode(){return new Promise(resolve=>pending.push(resolve));}},requestAnimationFrame(fn){frames.set(++next,fn);return next;},cancelAnimationFrame(id){frames.delete(id);}};
 const sprite={ownerDocument:{defaultView:win},style:{},dataset:{},isConnected:true},player=c.player(sprite,'resource://test/',()=>done++);
 const advance=now=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));};
 const first=player.play('pages');player.finish();pending.shift()();await first;assert.equal(frames.size,0);
 const play=player.play('thumbsup');pending.shift()();await play;
 advance(0);assert.equal(sprite.dataset.frame,'0');advance(62.5);assert.equal(sprite.dataset.frame,'1');advance(1437.5);assert.equal(sprite.dataset.frame,'23');advance(1500);assert.equal(done,1);assert.equal(frames.size,0);assert.equal(sprite.dataset.frame,'23');assert.match(sprite.style.backgroundImage,/thumbsup.png/);
 player.still('crossleg');assert.equal(sprite.dataset.frame,'23');assert.equal(sprite.dataset.gesture,'crossleg');player.dispose();assert.equal(frames.size,0);
});

test('page turning is never selected as a random hover or timed gesture',()=>{for(const ids of Object.values(c.sets)){assert.ok(!ids.includes('pages'));for(const id of ['magnify','notes','plane','tea','bow'])assert.ok(ids.includes(id));}assert.equal(c.frameCount,24);assert.equal(1000/c.frameMs,16);});
