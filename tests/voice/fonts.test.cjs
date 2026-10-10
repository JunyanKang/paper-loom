process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),fonts=require('../../addon/voice/fonts.js');
const installed=[{family:'Zulu',chinese:false},{family:'Songti SC',chinese:true},{family:'Arial',chinese:false},{family:'PingFang SC',chinese:true}];
test('Chinese families precede other fonts, then usage and alphabetical order apply',()=>{
 assert.deepEqual(fonts.sorted(installed,'zh',{}).map(f=>f.family),['PingFang SC','Songti SC','Arial','Zulu']);
 assert.deepEqual(fonts.sorted(installed,'zh',{'Songti SC':3,Zulu:9}).map(f=>f.family),['Songti SC','PingFang SC','Zulu','Arial']);
 assert.deepEqual(fonts.sorted(installed,'en',{}).map(f=>f.family),['Arial','PingFang SC','Songti SC','Zulu']);
 assert.equal(fonts.sorted(installed,'en',{'Zulu':2})[0].family,'Zulu');
});
test('migration chooses an actually installed family and safely quotes custom names',()=>{
 assert.equal(fonts.defaultFamily(installed,'zh','serif'),'Songti SC');assert.equal(fonts.defaultFamily(installed,'zh'),'PingFang SC');assert.equal(fonts.defaultFamily([{family:'Only Font',chinese:false}],'en'),'Only Font');
 assert.equal(fonts.css('Font "A"'),'"Font \\"A\\"",system-ui,sans-serif');assert.deepEqual(fonts.history('{'),{});assert.deepEqual(fonts.history('[]'),{});
});
