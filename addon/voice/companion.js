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
 // Sprite art extends across nominal tile edges. Follow transparent gaps between
 // neighbours instead of cutting every limb at an arbitrary 256px boundary.
 seams(alpha,width,row){
  const edges=[Array(256).fill(0)];
  for(let edge=1;edge<6;edge++){
   const left=edge*256-32,count=81,back=new Int16Array(256*count);let previous=new Float64Array(count);
   for(let y=0;y<256;y++){
    const next=new Float64Array(count);
    for(let x=0;x<count;x++){
     let best=Infinity,parent=x;
     for(let d=-2;d<=2;d++){const k=x+d;if(k<0||k>=count)continue;const score=(y?previous[k]:0)+Math.abs(d)*.08;if(score<best){best=score;parent=k;}}
     const a=alpha[((row*256+y)*width+left+x)*4+3]/255;
     next[x]=best+a*a*40+Math.abs(x-32)*.0005;back[y*count+x]=parent;
    }previous=next;
   }
   let x=previous.indexOf(Math.min(...previous));const path=Array(256);
   for(let y=255;y>=0;y--){path[y]=left+x;x=back[y*count+x];}edges.push(path);
  }
  edges.push(Array(256).fill(width));return edges;
 },
 frameCount:6,frameMs:170,breakInterval:30*60*1000,
 // Window motion has a fixed grip; extending a hand must not pull its anchor around.
 hand(){return {x:143/256,y:128/256};},
 placement(id,frame){frame=Number.isFinite(frame)?Math.max(0,Math.min(this.frameCount-1,Math.round(frame))):0;const [sheet,row]=this.gestures[id]||this.gestures.greeting,[x,top,foot]=this.registration[sheet][row][frame],scale=226/(foot-top);return {sheet,row,frame,x:143-x*scale,y:244-foot*scale,size:256*scale};},
 pageGesture(previous,next){return Number.isInteger(previous)&&Number.isInteger(next)&&previous!==next?(next>previous?'page-forward':'page-backward'):null;},
 shuffled(ids,last,random=Math.random){const queue=ids.slice();for(let i=queue.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}if(queue.length>1&&queue[0]===last)[queue[0],queue[1]]=[queue[1],queue[0]];return queue;},
 player(sprite,assetURI,onFinish) {
  const C=PaperVoiceCompanion,win=sprite.ownerDocument.defaultView,images=new Map(),textures=new Map(),canvas=sprite.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml','canvas');
  canvas.width=384;canvas.height=320;canvas.style.cssText='display:block;position:absolute;left:-25%;top:-12.5%;width:150%;height:125%;pointer-events:none';sprite.append(canvas);const ctx=canvas.getContext('2d');
  let ticket=0,request=null,current='listening',disposed=false;
  const load=id=>{const [sheet]=C.gestures[id]||C.gestures.greeting;if(!images.has(sheet)){const image=new win.Image();image.src=assetURI+'animations/'+sheet+'.png';images.set(sheet,image);}return images.get(sheet);};
  const texture=p=>{
   if(!textures.has(p.sheet)){
    if(!ctx.getImageData)return null;
    const image=images.get(p.sheet),source=sprite.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml','canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
    const sourceContext=source.getContext('2d');
    // Lightweight test doubles can draw the original cell; browsers build the atlas once.
    if(!sourceContext.getImageData)return null;
    sourceContext.drawImage(image,0,0);const pixels=sourceContext.getImageData(0,0,source.width,source.height).data,rows=[];
    for(let row=0;row<4;row++){
     const edges=C.seams(pixels,source.width,row),frames=[];
     for(let frame=0;frame<6;frame++){
      const tile=sprite.ownerDocument.createElementNS('http://www.w3.org/1999/xhtml','canvas');tile.width=384;tile.height=256;const tileContext=tile.getContext('2d');
      for(let y=0;y<256;y++){const left=edges[frame][y],right=edges[frame+1][y];tileContext.drawImage(image,left,row*256+y,right-left,1,64+left-frame*256,y,right-left,1);}
      frames.push(tile);
     }rows.push(frames);
    }textures.set(p.sheet,rows);
   }return textures.get(p.sheet)[p.row][p.frame];
  };
  const draw=(id,frame)=>{const image=load(id);if(!image.complete||!image.naturalWidth)return false;
   // The last raised-hand cell touches the outer edge of the source sheet;
   // hold the preceding complete pose at full extension instead of showing a cut hand.
   const p=C.placement(id,id==='dock-present'&&frame===5?4:frame),tile=texture(p);ctx.clearRect(0,0,384,320);
   if(tile)ctx.drawImage(tile,0,0,384,256,p.x+64-p.size/4,p.y+32,p.size*1.5,p.size);
   else ctx.drawImage(image,p.frame*256,p.row*256,256,256,p.x+64,p.y+32,p.size,p.size);
   sprite.dataset.gesture=id;sprite.dataset.frame=String(frame);sprite.dataset.ready='true';return true;};
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
  return {play,still,finish,preload,seek,dispose(){disposed=true;cancel();images.clear();textures.clear();canvas.remove();}};
 }
};
if(typeof module!=='undefined')module.exports=PaperVoiceCompanion;
