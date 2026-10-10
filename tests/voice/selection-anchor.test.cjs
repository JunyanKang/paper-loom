process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../../addon/voice/core.js');
const item=(str,x,y)=>({str,width:str.length*5,height:10,transform:[10,0,0,10,x,y],hasEOL:true});
const items=[item('First repeated word.',10,200),item('Second repeated word.',200,100)];
const at=core.anchorText(items[0].str).length+core.anchorText('Second repeated ').length;
const selection={text:'word',pageIndex:0,position:{rects:[[280,98,302,110]]}};
const glyphs=items.flatMap(it=>[...it.str].map((c,i)=>({c,rect:[it.transform[4]+i*5,it.transform[5]-2,it.transform[4]+i*5+5,it.transform[5]+8]})));
test('PDF coordinates disambiguate a repeated word when DOM selection is unavailable',()=>assert.equal(core.selectionOffset(items,selection,glyphs),at));
test('PDF item rectangles resolve repeated words when glyph data is unavailable',()=>assert.equal(core.selectionOffset(items,selection),at));
test('glyph geometry wins over a stale matching DOM anchor',()=>assert.equal(core.selectionOffset(items,{...selection,anchorOffset:core.anchorText('First repeated ').length},glyphs),at));
test('an ambiguous word without a location does not jump to its first occurrence',()=>assert.equal(core.selectionOffset(items,{text:'word'}),-1));
test('source offsets preserve excluded caption and footer text',()=>{const list=[item('Fig. 1. A caption.',10,200),item('A unique sentence.',10,100)];assert.equal(core.selectionOffset(list,{text:'unique'}),core.anchorText('Fig. 1. A caption.A ').length);});
test('ligatures and Unicode selections use the same normalized source coordinates',()=>assert.equal(core.selectionOffset([item('The ﬁbers lie here. 中文位于此。',0,0)],{text:'中文'}),core.anchorText('The fibers lie here.').length));
test('repeated letters on one line need glyph precision',()=>{const list=[item('e e e',10,100)],chars=[...list[0].str].map((c,i)=>({c,rect:[10+i*5,98,15+i*5,108]})),s={text:'e',position:{rects:[[30,98,35,108]]}};assert.equal(core.selectionOffset(list,s,chars),2);assert.equal(core.selectionOffset(list,s),-1);});
test('invalid or missing selection text never creates a location',()=>{assert.equal(core.selectionOffset(items,{}),-1);assert.equal(core.selectionOffset(items,{text:'missing',anchorOffset:1}),-1);});
test('a narrow selection may overlap an adjacent glyph with different font metrics',()=>{
 const it=[item('fovea',343.1,634.4)],chars=[{c:'f',rect:[343.1,632.6,345.7,639.8]},{c:'o',rect:[345.7,632.6,350,639.8]},{c:'v',rect:[350,632.6,354.2,639.8]}];
 // Full glyph stream is needed to validate source coordinates.
 chars.push({c:'e',rect:[354.2,632.6,358.1,639.8]},{c:'a',rect:[358.1,632.6,362,639.8]});
 assert.equal(core.selectionOffset(it,{text:'o',position:{rects:[[344.96,632.4,349.47,640.4]]}},chars),1);
});
