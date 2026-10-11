process.chdir(require('node:path').resolve(__dirname,'../..'));
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const context=vm.createContext({});vm.runInContext(fs.readFileSync('addon/voice/dock-motion.js','utf8'),context);const motion=context.PaperVoiceDockMotion;
test('mesh unfolds exactly to the panel with no residual distortion',()=>{
 for(const a of [{x:280,y:460},{x:20,y:-30},{x:180,y:200}])for(let i=0;i<=96;i++){
  const v=i/96,r=motion.row(1,v,324,432,a);assert.ok(Math.abs(r.center-162)<1e-8);assert.ok(Math.abs(r.y-v*432)<1e-8);assert.equal(r.scale,1);
 }
});
test('closed mesh converges to the icon independent of panel position',()=>{
 for(const a of [{x:280,y:460},{x:20,y:-30},{x:180,y:200}])for(let i=0;i<=96;i++){
  const r=motion.row(0,i/96,324,432,a);assert.equal(r.center,a.x);assert.equal(r.y,a.y);
 }
});
test('mesh has finite, continuous geometry and no inverted strips for an icon above or below',()=>{
 for(const a of [{x:280,y:460},{x:20,y:-30},{x:180,y:200},{x:300,y:436}])for(let p=0;p<=1;p+=.002){
  let previous=-Infinity;for(let i=0;i<=96;i++){const v=i/96,r=motion.row(p,v,324,432,a);assert.ok(Number.isFinite(r.center+r.y+r.scale));assert.ok(r.scale>0&&r.scale<=1);assert.ok(r.y>=previous-1e-8);previous=r.y;const next=motion.row(p+.00001,v,324,432,a);assert.ok(Math.abs(next.y-r.y)<.1);}
 }
});

test('outer shadows preserve multi-layer colors, offsets and spread without inset borders',()=>{
 const shadows=motion.outerShadows('rgba(20, 40, 60, 0.2) 0px 8px 40px 0px, color(srgb 0.1 0.2 0.3 / 0.1) -2px 1px 3px -1px, rgb(255, 255, 255) 0px 0px 0px 1px inset');
 assert.equal(shadows.length,2);assert.equal(shadows[0].color,'rgba(20, 40, 60, 0.2)');assert.equal(shadows[0].blur,40);assert.equal(shadows[1].x,-2);assert.equal(shadows[1].spread,-1);assert.equal(motion.shadowPadding(shadows),70);assert.equal(motion.outerShadows('none').length,0);
});
