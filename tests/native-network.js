const checks=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)throw Error(name);};
const Q=L.referencesScope,{CiteLensCareerUI:CU,CiteLensCareer:C,CiteLensServices:S,CiteLensUI:U}=Q,doc=Zotero.getMainWindow().document;
const until=async(fn,label)=>{for(let n=0;n<600;n++){if(fn())return;await Zotero.Promise.delay(150);}throw Error('Timed out: '+label);};
let frame;
try{
 frame=L.references.showNetwork();await U.pageQueue;await until(()=>frame._pnModel&&frame.querySelector('.pn-map-stage')?.getAttribute('aria-busy')==='false','author network');
 const author=frame._pnModel.nodes.find(n=>n.kind==='author'&&n.title==='Ada Example')||frame._pnModel.nodes.find(n=>n.kind==='author');
 check('local coauthor graph builds',!!author,{nodes:frame._pnModel.nodes.length});await frame._pnSelect(author.id);await Zotero.Promise.delay(700);
 check('author inspector retains associated papers',frame.querySelectorAll('.pn-member-paper').length>0);
 const row=frame.querySelector('.pn-member-paper');check('paper actions preserved',!!row.querySelector('[data-icon=open]')&&!!row.querySelector('[data-icon=copy]')&&!!row.querySelector('[data-icon=retry]'));
 const camera=JSON.stringify(frame._pnCamera),job=frame._pnJob;
 // Read-only public ORCID retrieval. This record is a separate live-data test, not the synthetic local author's identity.
 const career=CU.open(doc,{orcid:'0000-0002-9053-5249',name:'Dawang Zhou',host:frame});
 await until(()=>career.querySelector('.pn-career-event'),'public ORCID career');
 check('live public career loaded',career.querySelectorAll('.pn-career-event').length>0,{events:career.querySelectorAll('.pn-career-event').length});
 check('career stays within graph and preserves inspector',career.parentElement===frame.querySelector('.pn-map-stage')&&!frame.querySelector('.pn-map-inspector').inert);
 check('career publication tools preserved',!!career.querySelector('.pn-career-paper-tools [data-icon=doi]')&&!!career.querySelector('.pn-career-paper-tools [data-icon=copy]'));
 career._clClose();check('return preserves graph job and camera',job===frame._pnJob&&camera===JSON.stringify(frame._pnCamera));
 L.qaNetwork=frame;return {passed:true,checks};
}catch(e){return {passed:false,checks,error:String(e),detail:frame?.querySelector('.pn-career-status')?.textContent};}
