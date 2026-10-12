// Export real UI surfaces, with transparent space outside their rounded borders.
// Coordinates stay in CSS pixels; the PNG is exactly 2x its documented width.
async function captureDocs(elements,name,out){
 const surfaces=Array.isArray(elements)?elements:[elements],doc=surfaces[0].ownerDocument,win=doc.defaultView;
 const boxes=surfaces.map(el=>({el,rect:el.getBoundingClientRect(),css:win.getComputedStyle(el)})).filter(x=>x.rect.width&&x.rect.height);
 if(!boxes.length)throw Error('No visible surface: '+name);
 const pad=12,x=Math.floor(Math.min(...boxes.map(x=>x.rect.x))-pad),y=Math.floor(Math.min(...boxes.map(x=>x.rect.y))-pad),width=Math.ceil(Math.max(...boxes.map(x=>x.rect.right))+pad-x),height=Math.ceil(Math.max(...boxes.map(x=>x.rect.bottom))+pad-y);
 const canvas=doc.createElementNS('http://www.w3.org/1999/xhtml','canvas');canvas.width=width*2;canvas.height=height*2;
 const ctx=canvas.getContext('2d'),mask=new win.Path2D();ctx.scale(2,2);
 for(const {el,rect:r,css} of boxes){
  const outline=el.querySelector(':scope>.pv-caption-connected-rim>path')?.getAttribute('d');
  if(outline){mask.addPath(new win.Path2D(outline),new win.DOMMatrix().translate(r.x-x,r.y-y));continue;}
  const radii=['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius'].map(key=>Math.max(0,parseFloat(css[key])||0));mask.roundRect(r.x-x,r.y-y,r.width,r.height,radii);
 }
 ctx.clip(mask);ctx.drawWindow(win,x,y,width,height,'rgba(0,0,0,0)');
 const bytes=Uint8Array.from(win.atob(canvas.toDataURL('image/png').split(',')[1]),v=>v.charCodeAt(0));await IOUtils.write(PathUtils.join(out,name+'.png'),bytes);
 return {name,width,height,scale:2,surfaces:boxes.map(({rect:r})=>({x:r.x-x,y:r.y-y,width:r.width,height:r.height}))};
}
