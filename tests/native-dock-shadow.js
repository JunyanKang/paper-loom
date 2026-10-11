const M=L.voiceScope.PaperVoiceDockMotion,doc=Zotero.getMainWindow().document,w=doc.defaultView,checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const fixture=doc.createElementNS('http://www.w3.org/1999/xhtml','div'),panel=doc.createElementNS('http://www.w3.org/1999/xhtml','section'),orb=doc.createElementNS('http://www.w3.org/1999/xhtml','button');
fixture.style.cssText='position:fixed;inset:0;background:white;z-index:99999';panel.style.cssText='position:absolute;left:120px;top:100px;width:240px;height:260px;background:white;border-radius:22px;box-shadow:0 12px 40px rgba(20,40,60,.24),0 2px 4px rgba(20,40,60,.1);';orb.style.cssText='position:absolute;left:340px;top:450px;width:50px;height:50px';fixture.append(panel,orb);doc.documentElement.append(fixture);let mesh;
try{
 const b=panel.getBoundingClientRect(),ref=doc.createElementNS('http://www.w3.org/1999/xhtml','canvas');ref.width=w.innerWidth;ref.height=w.innerHeight;const ctx=ref.getContext('2d');ctx.drawWindow(w,0,0,w.innerWidth,w.innerHeight,'white');
 mesh=M.mesh(panel,orb);panel.style.visibility='hidden';const canvas=mesh.canvas,rect=canvas.getBoundingClientRect(),gl=canvas.getContext('webgl'),pixels=new Uint8Array(canvas.width*canvas.height*4),ratio=canvas.width/rect.width;
 mesh.draw(1);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
 const samples=[];for(const offset of [2,8,20,40])for(const [x,y] of [[b.left-offset,b.top+b.height/2],[b.right+offset,b.top+b.height/2],[b.left+b.width/2,b.top-offset],[b.left+b.width/2,b.bottom+offset]]){const sx=Math.floor(x),sy=Math.floor(y),ix=Math.floor((sx+.5-rect.left)*ratio),iy=canvas.height-1-Math.floor((sy+.5-rect.top)*ratio),k=(iy*canvas.width+ix)*4,native=ctx.getImageData(sx,sy,1,1).data,alpha=pixels[k+3],actual=[0,1,2].map(i=>pixels[k+i]+255-alpha),error=Math.max(...actual.map((v,i)=>Math.abs(v-native[i])));samples.push({offset,x:sx,y:sy,alpha,native:[...native].slice(0,3),actual,error});}
 check('shadow exists outside the fully opened mesh',samples.some(s=>s.alpha>15),samples);
 check('mesh-to-window shadow handoff is visually continuous',samples.every(s=>s.error<=9),{maxError:Math.max(...samples.map(s=>s.error))});
 let edge=0;for(let x=0;x<canvas.width;x++)edge=Math.max(edge,pixels[x*4+3],pixels[((canvas.height-1)*canvas.width+x)*4+3]);check('shadow texture has enough padding',edge<=1,{edge});
 mesh.draw(.85);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);check('partial opening retains translucent shadow pixels',pixels.some((v,i)=>i%4===3&&v>4&&v<60));
 mesh.destroy();mesh=null;check('temporary animation canvas is removed',!canvas.isConnected);
 return {passed:true,version:Zotero.version,checks};
}catch(e){return {passed:false,error:String(e),stack:e.stack,checks};}finally{mesh?.destroy();fixture.remove();}
