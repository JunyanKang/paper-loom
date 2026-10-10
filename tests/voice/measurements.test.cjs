process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),c=require('../../addon/voice/core.js');
const say=(x,l='en')=>c.measurementSpeech(c.speechText(x),l);
test('scientific lengths masses volumes and PDF-separated micro symbols expand for narration',()=>{
 for(const [input,expected] of [['10 μm','10 micrometers'],['10 µ m','10 micrometers'],['1 mm','1 millimeter'],['5 mm','5 millimeters'],['2 mg','2 milligrams'],['0.5 g','zero point five grams'],['25 μ g','25 micrograms'],['3 mL','3 milliliters'],['5 ml','5 milliliters'],['2 μ L','2 microliters'],['1 cm','1 centimeter'],['5 nm','5 nanometers'],['2 kg','2 kilograms'],['3 L','3 liters']])assert.equal(say(input),expected,input);
});
test('units retain magnitudes ranges uncertainty squares cubes and temperature signs',()=>{
 for(const [input,expected] of [['0.8–1.5 mm','zero point eight to 1 point five millimeters'],['10 ± 0.2 μm','10 plus or minus zero point two micrometers'],['−20 °C','minus 20 degrees Celsius'],['37℃','37 degrees Celsius'],['45°','45 degrees'],['1 °F','1 degree Fahrenheit'],['10 mm²','10 square millimeters'],['2 mm^3','2 cubic millimeters'],['2 kPa²','2 square kilopascals'],['5%','5 percent'],['500 × g','500 times gravity']])assert.equal(say(input),expected,input);
});
test('compound concentrations frequencies pressures and electrical measurements expand',()=>{
 for(const [input,expected] of [['5 mg/kg','5 milligrams per kilogram'],['2 μg/mL','2 micrograms per milliliter'],['3 mL/min','3 milliliters per minute'],['5 min','5 minutes'],['2 h','2 hours'],['5 mM','5 millimolar'],['5 μM','5 micromolar'],['10 mmol/L','10 millimoles per liter'],['50 Hz','50 hertz'],['2 kHz','2 kilohertz'],['120 mmHg','120 millimeters of mercury'],['−70 mV','minus 70 millivolts'],['10 pA','10 picoamperes']])assert.equal(say(input),expected,input);
});
test('measurement pronunciation follows speech language',()=>{
 assert.equal(say('厚度为10 μm，剂量为2 mg，角度为45°。','zh'),'厚度为十微米，剂量为二毫克，角度为四十五度。');
 assert.equal(say('浓度5%，温度37℃。','zh'),'浓度百分之五，温度三十七摄氏度。');
 assert.equal(say('厚さは10 μm、温度は37℃。','ja'),'厚さは10マイクロメートル、温度は摂氏37度。');
 assert.equal(say('10 μm, 2 mg et 37 °C.','fr'),'10 micromètres, 2 milligrammes et 37 degrés Celsius.');
});
test('unit recognition preserves scientific names values and original highlighting text',()=>{
 const text='SOX2, Vax1/2, 3 animals, 5 minimum values, 3 March, g protein, 2010, x[1].';assert.equal(say(text),text);
 const source='The layer is 10 μm thick (Smith et al., 2020).';const units=c.layoutUnits([{text:source,pageIndex:0}]);
 assert.equal(units[0].text,source);assert.equal(units[0].sentenceText,source);assert.equal(say(units[0].spokenText),'The layer is 10 micrometers thick.');
});

test('scientific notation and inverse SI factors preserve magnitude',()=>{
 for(const [input,expected] of [['1e-3 mg','1 times ten to the power of minus 3 milligrams'],['10 mm s⁻¹','10 millimeters per second'],['2 mg·kg⁻¹','2 milligrams per kilogram'],['10 mm 3 samples','10 millimeters 3 samples'],['5 mg/dL','5 milligrams per deciliter'],['2 hrs','2 hours'],['5 bp','5 base pairs'],['5 IU','5 international units'],['10 s⁻¹','10 per second']])assert.equal(say(input),expected,input);
});

test('density denominators and varied exponents are expanded without an adjacent quantity',()=>{
 for(const [input,expected] of [['50,000 per mm2','50,000 per square millimeter'],['50,000 per mm 2','50,000 per square millimeter'],['20 cells/mm²','20 cells per square millimeter'],['2 mg mL⁻¹','2 milligrams per milliliter'],['10 m^{−2}','10 per square meter'],['10 cm³','10 cubic centimeters'],['10 m⁴','10 meters to the power of 4'],['3 kg⋅m⋅s⁻²','3 kilograms times meter per square second'],['2 kΩ','2 kilohms'],['5 mGy','5 milligrays']])assert.equal(say(input),expected,input);
});
test('coordinated decimals always say the point and preserve identifiers',()=>{
 assert.equal(say('between 0.5 and 1.2 mm, and between 0.5 and 0.8 mm'),'between zero point five and 1 point two millimeters, and between zero point five and zero point eight millimeters');
 for(const text of ['version 1.2','v1.3.2','10.1234/0.5','https://example.org/0.5','SOX2, Vax1/2','Fig. 1.2'])assert.equal(c.measurementSpeech(text),text,text);
 assert.equal(say('0.05 mm','zh'),'零点零五毫米');assert.equal(say('0.5 mm','ja'),'ゼロ点五ミリメートル');assert.equal(say('0.5 mm','fr'),'zéro virgule cinq millimètres');
});
test('real raised unit exponents survive PDF extraction; ordinary inline counts do not become powers',()=>{
 const item=(str,x,y,height,width)=>({str,transform:[height,0,0,height,x,y],height,width});
 const raised=c.pdfText([item('50,000 per mm',10,100,10,70),item('2',80,104,6,4),item('between 0.5 and 1.2 mm',90,100,10,100)]);
 assert.match(raised,/mm ²/);assert.match(say(raised),/per square millimeter/);assert.match(say(raised),/zero point five/);
 assert.equal(say(c.pdfText([item('10 mm',10,100,10,40),item('3 samples',55,100,10,50)])),'10 millimeters 3 samples');
});

test('chemical subscripts, ions and variable indices are distinct from unit powers',()=>{
 assert.equal(say('CO₂, H₂O, O₂, H₂O₂ and Ca²⁺; r₀ and Vₘ.'),'carbon dioxide, water, oxygen, hydrogen peroxide and calcium two plus; r subscript zero and V subscript m.');
 assert.equal(say('CO2 and Mg2+'),'carbon dioxide and magnesium two plus');
 assert.equal(say('SOX2 and Vax1/2'),'SOX2 and Vax1/2');
 assert.equal(say('CO₂ 和 Ca²⁺','zh'),'二氧化碳和钙二正');
});

test('scientific powers of ten retain their sign and decimal mantissa',()=>{assert.equal(say('1.2 × 10⁻³ mol/L'),'1 point two times ten to the power of minus 3 moles per liter');assert.equal(say('10^6 cells'),'ten to the power of 6 cells');});

test('temperature ranges stay measurements and typographic negative powers expand',()=>{assert.equal(say('5 K - 10 K'),'5 kelvins - 10 kelvins');assert.equal(say('2 mm s^{−1}'),'2 millimeters per second');});
