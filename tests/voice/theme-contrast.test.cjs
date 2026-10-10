process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('addon/voice/themes.js','utf8'),c);const themes=c.PaperVoiceThemes.themes;
const rgb=s=>s.match(/\w\w/g).map(x=>parseInt(x,16)/255),lum=c=>c.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
for(const t of themes)test(t.id+' text palette and controls maintain contrast over opaque masked custom images',()=>{
 for(const extreme of [0,1]){
  const bg=rgb(t.paper).map(x=>x*.98*.92+extreme*(1-.98*.92));
  for(const role of ['ink','muted','accent'])assert.ok(ratio(rgb(t[role]),bg)>=4.5,role+': '+ratio(rgb(t[role]),bg));
 }
 assert.ok(ratio(rgb(t.accent),rgb(t.dark?'#202937':'#ffffff'))>=4.5);
 assert.ok(ratio(rgb(t.accent),rgb(t.soft))>=4.5);
});

test('Horizon preserves the existing default preference and explicit theme choices survive',()=>{const p=c.PaperVoiceThemes;p.get=(_,fallback)=>fallback;assert.equal(p.theme().id,'tidal');p.get=()=> 'amber';assert.equal(p.theme().id,'amber');});
