const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../../addon/voice/panel.js'),'utf8'),c);
const area=p=>{const pts=[...p.matchAll(/Q([-\d.]+) ([-\d.]+)/g)].map(m=>[+m[1],+m[2]]);return Math.abs(pts.reduce((sum,p,i)=>{const q=pts[(i+1)%pts.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2);};
test('connected translucent surface preserves the toolbar rectangle and both menu branches',()=>{
 const rects=[{left:0,top:180,right:252,bottom:254},{left:180,top:0,right:218,bottom:180},{left:-10,top:80,right:180,bottom:120}];const p=c.PaperVoiceUI.connectedSurfacePath(rects);assert.equal((p.match(/ M/g)||[]).length,1);assert.equal(area(p),252*74+38*180+190*40);assert.doesNotMatch(p,/NaN/);
});
test('subpixel edge differences do not tear the connected background into diagonal shapes',()=>{
 const rects=[{left:0,top:180.00003,right:252,bottom:254},{left:180,top:0,right:218,bottom:179.99997},{left:-10,top:80,right:180.00001,bottom:120}];const p=c.PaperVoiceUI.connectedSurfacePath(rects);assert.equal((p.match(/ M/g)||[]).length,1);assert.equal(area(p),252*74+38*180+190*40);
});
