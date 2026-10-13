const {test}=require('node:test'),assert=require('node:assert/strict'),core=require('../../addon/voice/core.js');
const line=(str,x,y,{height=10,width=300,font='body'}={})=>({str,transform:[height,0,0,height,x,y],width,height,fontName:font,hasEOL:true});
const page=(items,index=0)=>core.pdfLayout(items,index,800,{skipCaptions:false});
const paragraphs=pages=>Object.values(Object.groupBy(core.layoutUnits(pages),u=>u.paragraphId)).map(group=>core.cleanText(group.map(u=>u.text).join(' ')));

test('an inset abstract is one paragraph despite left-aligned metadata and headings',()=>{
 const text=['Cells in the developing tissue depend on a network','of vessels. This network forms in distinct stages','and supports normal growth.'];
 const items=[line('Research institute',90,750),line('Abstract',90,720,{height:12,font:'bold'}),...text.map((t,i)=>line(t,108,700-i*14)),line('Keywords',90,638,{font:'bold'}),line('Vessels; growth',108,620)];
 const groups=paragraphs([page(items)]);
 assert.ok(groups.includes(text.join(' ')));assert.ok(groups.includes('Abstract'));assert.ok(groups.includes('Keywords'));assert.ok(!groups.find(x=>x.startsWith(text[0])).includes('Keywords'));
});

test('true first-line indents split adjacent paragraphs at normal line spacing',()=>{
 const items=[line('The first paragraph starts here and',108,700),line('continues to its conclusion.',90,686),line('The second paragraph begins with',108,672),line('another result and ends here.',90,658)];
 const layout=page(items);assert.equal(layout.startsParagraph,true);
 assert.deepEqual(paragraphs([layout]),['The first paragraph starts here and continues to its conclusion.','The second paragraph begins with another result and ends here.']);
});

test('hanging indentation does not split a wrapped paragraph after its first line',()=>{
 const items=[line('A label introduces this passage and',90,700),line('its indented continuation describes',108,686),line('the final result.',108,672)];
 assert.deepEqual(paragraphs([page(items)]),['A label introduces this passage and its indented continuation describes the final result.']);
});

test('extra vertical space still separates two paragraphs inside an inset block',()=>{
 const items=[line('Short heading',90,750,{font:'bold'}),line('The first block starts with a result',108,724),line('and ends here.',108,710),line('The next block starts with a method',108,686),line('and ends separately.',108,672)];
 const groups=paragraphs([page(items)]);assert.ok(groups.includes('The first block starts with a result and ends here.'));assert.ok(groups.includes('The next block starts with a method and ends separately.'));
});

test('aligned inset continuation at the top of a page retains its paragraph identity',()=>{
 const first=page([line('The inset paragraph begins and',108,100),line('continues onto the next page with',108,86)]);
 const second=page([line('more evidence before ending.',108,720),line('A separate heading',90,680,{height:12,font:'bold'})],1);
 assert.equal(second.startsParagraph,false);assert.equal(paragraphs([first,second])[0],'The inset paragraph begins and continues onto the next page with more evidence before ending.');
});

test('a real first-line indent at a page boundary begins a new paragraph',()=>{
 const first=page([line('A complete earlier paragraph.',90,100)]),second=page([line('A new paragraph begins here and',108,720),line('continues on this page.',90,706)],1);
 assert.equal(second.startsParagraph,true);assert.deepEqual(paragraphs([first,second]),['A complete earlier paragraph.','A new paragraph begins here and continues on this page.']);
});

test('a new column does not make the preceding inset line look like a first-line indent',()=>{
 const layout=page([line('The left column continues',48,100),line('with more evidence.',48,86),line('The right column begins',330,720),line('and ends here.',330,706)]);
 assert.equal(layout.startsParagraph,false);assert.equal(layout.paragraphStarts.length,0);assert.equal(layout.breaks.length,1);
});
