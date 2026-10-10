const checks=[],check=(name,ok,detail)=>checks.push({name,ok:!!ok,detail});
const result=L.qaRuntimeTask?await L.qaRuntimeTask:{passed:await Runtime.diagnose()};check('installed engine performs real synthesis',result?.passed,result);
if(!result?.passed)return {passed:false,checks};
const V=L.voice,reader=L.qaReader||L.currentReader();
if(!reader)throw Error('Run native-reader.js first');
L.qaFixtureDialog?.close();await Zotero.Promise.delay(300);
await V.ensureWorker();check('worker running',!!V.process);
const saved={mode:V.get('mode','selection'),voice:V.get('voice','af_heart'),readTranslation:V.get('readTranslation',false)};
V.set('readTranslation',false);V.set('voice','af_heart');V.set('mode','selection');
const sample='This is an integration test of Paper Loom. Reading, listening and citation discovery now work together in one Zotero extension. We can pause the voice, continue listening, and stop when we are ready.';
const task=V.speak(sample,reader,true);
for(let i=0;i<200&&!['playing','error'].includes(V.state);i++)await Zotero.Promise.delay(100);
check('actual audio playback starts',V.state==='playing',{state:V.state,status:V.status});
if(V.state==='playing'){V.togglePause();await Zotero.Promise.delay(200);check('pause works',V.state==='paused');V.togglePause();await Zotero.Promise.delay(150);check('resume works',V.state==='playing');}
V.stop();await task;check('stop completes',!['playing','paused','loading'].includes(V.state));
for(const [key,value] of Object.entries(saved))V.set(key,value);
return {passed:checks.every(c=>c.ok),checks};
