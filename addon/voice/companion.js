/* Paper Loom performances share a registered headband centre and foot baseline.
 * Only the illustrated limbs/pages/props move; the hit target never transforms. */
var PaperVoiceCompanion = {
 sets:{ready:['greeting'],reading:['listening'],references:['references'],network:['network'],settings:['settings']},
 gestures:{listening:['features-v2',0],references:['features-v2',1],network:['features-v2',2],settings:['features-v2',3],'page-forward':['motions-v2',0],'page-backward':['motions-v2',1],'dock-present':['motions-v2',2],greeting:['motions-v2',3],rest:['motions-v2',3]},
 // Per-cell headband centre, crown and sole, measured on the original 256px art.
 registration:{
  'features-v2':[[[143,18,244],[146.5,17,244],[149,17,244],[140.5,15,244],[136.5,15,244],[126,16,244]],[[140.5,13,244],[138,13,245],[138,13,245],[146,12,245],[135.5,13,245],[129,14,245]],[[140.5,12,242],[136.5,13,243],[135,13,243],[131.5,12,243],[135,13,242],[133,13,243]],[[141,8,238],[139,8,238],[137,8,238],[131,6,238],[132,8,238],[127.5,8,238]]],
  'motions-v2':[[[136,11,245],[137,11,245],[136.5,11,245],[136.5,11,245],[136.5,11,245],[135.5,11,245]],[[136.5,11,245],[137.5,9,245],[136.5,11,245],[136,11,246],[136.5,11,245],[135.5,11,245]],[[137,10,245],[134,10,245],[134.5,10,245],[133,10,245],[133.5,10,245],[132.5,10,245]],[[137.5,10,244],[136.5,10,244],[136.5,10,244],[136.5,10,244],[137,10,244],[135,10,244]]]
 },
 frameCount:6,frameMs:170,breakInterval:30*60*1000,
 // Window motion has a fixed grip; extending a hand must not pull its anchor around.
 hand(){return {x:143/256,y:128/256};},
 placement(id,frame){frame=Number.isFinite(frame)?Math.max(0,Math.min(this.frameCount-1,Math.round(frame))):0;const [sheet,row]=this.gestures[id]||this.gestures.greeting,[x,top,foot]=this.registration[sheet][row][frame],scale=226/(foot-top);return {sheet,row,frame,x:143-x*scale,y:244-foot*scale,size:256*scale};},
 pageGesture(previous,next){return Number.isInteger(previous)&&Number.isInteger(next)&&previous!==next?(next>previous?'page-forward':'page-backward'):null;},
 shuffled(ids,last,random=Math.random){const queue=ids.slice();for(let i=queue.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}if(queue.length>1&&queue[0]===last)[queue[0],queue[1]]=[queue[1],queue[0]];return queue;},
 player(sprite,assetURI,onFinish) {
  const C=PaperVoiceCompanion,win=sprite.ownerDocument.defaultView,images=new Map(),canvas=sprite.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml','canvas');
  canvas.width=canvas.height=256;canvas.style.cssText='display:block;width:100%;height:100%';sprite.append(canvas);const ctx=canvas.getContext('2d');
  let ticket=0,request=null,current='listening',disposed=false;
  const load=id=>{const [sheet]=C.gestures[id]||C.gestures.greeting;if(!images.has(sheet)){const image=new win.Image();image.src=assetURI+'animations/'+sheet+'.png';images.set(sheet,image);}return images.get(sheet);};
  const draw=(id,frame)=>{const image=load(id);if(!image.complete||!image.naturalWidth)return false;const p=C.placement(id,frame);ctx.clearRect(0,0,256,256);ctx.drawImage(image,p.frame*256,p.row*256,256,256,p.x,p.y,p.size,p.size);sprite.dataset.gesture=id;sprite.dataset.frame=String(p.frame);sprite.dataset.ready='true';return true;};
  const cancel=()=>{ticket++;if(request!==null)win.cancelAnimationFrame(request);request=null;};
  const still=async(id='listening')=>{cancel();current=id;const token=ticket;try{await load(id).decode();}catch(_){return;}if(!disposed&&token===ticket)draw(id,0);};
  const finish=()=>{cancel();draw('listening',0);onFinish?.();};
  const play=async id=>{
   cancel();const token=ticket,image=load(id);try{await image.decode();}catch(_){if(token===ticket)onFinish?.();return;}
   if(disposed||token!==ticket||!sprite.isConnected)return;
   current=id;draw(id,0);let start=null;
   const step=now=>{if(token!==ticket)return;if(start===null)start=now;const frame=Math.min(C.frameCount-1,Math.floor((now-start)/C.frameMs));draw(id,frame);if(now-start<C.frameCount*C.frameMs)request=win.requestAnimationFrame(step);else{request=null;draw('listening',0);onFinish?.();}};
   request=win.requestAnimationFrame(step);
  };
  const preload=async id=>{try{await load(id).decode();return true;}catch(_){return false;}};
  const seek=(id,progress)=>{const image=load(id);if(!image.complete||!image.naturalWidth)return false;cancel();current=id;return draw(id,Math.round(Math.max(0,Math.min(1,progress))*(C.frameCount-1)));};
  return {play,still,finish,preload,seek,dispose(){disposed=true;cancel();images.clear();canvas.remove();}};
 }
};
if(typeof module!=='undefined')module.exports=PaperVoiceCompanion;
