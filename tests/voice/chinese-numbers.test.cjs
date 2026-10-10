process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),c=require('../../addon/voice/core.js'),say=x=>c.measurementSpeech(x,'zh');
test('screenshot density sentence reads quantities and ranges by their actual value',()=>{
 const input='已有报道，在食蟹猴中央凹中心以外500 μm处，双极细胞的密度为每mm²78,000～89,000个，无长突细胞为每mm²10,000～14,000个，水平细胞为每mm²19,000～25,000个。';
 assert.equal(say(input),'已有报道，在食蟹猴中央凹中心以外五百微米处，双极细胞的密度为每平方毫米七万八千至八万九千个，无长突细胞为每平方毫米一万至一万四千个，水平细胞为每平方毫米一万九千至二万五千个。');
});
test('Chinese positional integers cover zero bridges, thousands, millions and exact large values',()=>{
 for(const [n,s] of [['78000','七万八千'],['89000','八万九千'],['10001','一万零一'],['101000','十万一千'],['100010000','一亿零一万'],['100000001','一亿零一'],['100010001','一亿零一万零一'],['1000000000001','一万亿零一'],['9007199254740993','九千零七万亿一千九百九十二亿五千四百七十四万零九百九十三']])assert.equal(say(n+'个'),s+'个',n);
});
test('thousands separators and scientific notation retain all significant digits',()=>{
 for(const [s,t] of [['1,234.05 μm','一千二百三十四点零五微米'],['78,000.50个','七万八千点五零个'],['78，000个','七万八千个'],['７８，０００个','七万八千个'],['78,000 ‒ 89,000个','七万八千至八万九千个'],['５％','百分之五'],['78 000个','七万八千个'],['78,000，89,000个','七万八千，八万九千个'],['1.25e-3','一点二五乘十的负三次方'],['2.5 × 10⁵ 个','二点五乘十的五次方个'],['-78000个','负七万八千个'],['-0.05 mm','负零点零五毫米'],['10 ± 0.2 μm','十正负零点二微米'],['5%','百分之五'],['0.05‰','千分之零点零五']])assert.equal(say(s),t,s);
});
test('years, dates, version identifiers, leading-zero codes, URLs and DOIs are protected',()=>{
 for(const s of ['2026年','编号78000','ID78,000','版本1.3.3','版本1.2','编号1e5','001234个','2026-10-03','时间13:30','SOX2','https://example.org/1e3','10.1234/78000','78000.123.456','电话13800138000'])assert.equal(say(s),s,s);
});
test('English originals remain unchanged by Chinese numeric expansion',()=>{
 const s='The density is 78,000 to 89,000 cells, with 19,000 to 25,000 horizontal cells.';
 assert.equal(c.measurementSpeech(s,'en'),s);
});
test('uppercase ordinary words are spoken naturally without flattening scientific acronyms',()=>{
 assert.equal(c.measurementSpeech('ON and OFF cells in THE RETINA; DNA RNA IPL ONL RPE OCT SOX2.'),'on and off cells in the retina; DNA RNA IPL ONL RPE OCT SOX2.');
 assert.equal(c.measurementSpeech('OFF通路与ON通路，DNA保持。','zh'),'off通路与on通路，DNA保持。');
});
