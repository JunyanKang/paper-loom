var LoomAssistantTools={
 async get(url,run,key='',protocol='openai'){return LoomAssistantTransport.request(Zotero.getMainWindow(),{url,method:'GET',signal:run.signal,key,protocol,limit:1500000,timeout:20000});},
 source(run,record){
  const doi=String(record.doi||record.record?.DOI||'').toLowerCase(),match=[...run.sources,...(run.priorSources||[])].find(s=>doi&&String(s.doi||s.record?.DOI||'').toLowerCase()===doi||record.url&&s.url===record.url||record.page!==undefined&&s.page===record.page&&s.itemID===record.itemID||record.page===undefined&&record.itemID&&s.page===undefined&&s.itemID===record.itemID);
  if(match){if(!run.sources.includes(match))run.sources.push(match);if(record.record){match.record={...record.record,...match.record};for(const [k,v]of Object.entries(record.record))if(!match.record[k]||Array.isArray(match.record[k])&&!match.record[k].length)match.record[k]=v;}return match;}
  const source={...record,id:record.page!==undefined?'P'+(record.page+1):'L'+(++run.sourceSequence)};run.sources.push(source);return source;
 },
 reference(x,kind){
  if(kind==='crossref'&&typeof PaperLoom!=='undefined')return PaperLoom.referencesScope.CiteLensCore.fromCrossref(x);
  const clean=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(kind==='library')return {title:x.getField('title'),DOI:x.getField('DOI'),year:x.getField('date').slice(0,4),date:x.getField('date'),volume:x.getField('volume'),issue:x.getField('issue'),pages:x.getField('pages'),creators:x.getCreators().map(c=>({firstName:c.firstName||'',lastName:c.lastName||c.name||'',creatorType:c.creatorType||'author'})),journal:x.getField('publicationTitle'),abstract:x.getField('abstractNote'),url:x.getField('url'),type:x.itemType||'journalArticle',verified:true,source:'Zotero'};
  const pmc=kind==='pmc',authors=pmc?(x.authorList?.author||[]):(x.author||[]);
  return {title:clean(pmc?x.title:x.title?.[0]),DOI:pmc?x.doi||'':x.DOI||'',year:String(pmc?x.pubYear||'':x.published?.['date-parts']?.[0]?.[0]||''),creators:authors.map(a=>({firstName:a.firstName||a.given||'',lastName:a.lastName||a.family||a.collectiveName||a.fullName||'',creatorType:'author'})),journal:pmc?x.journalInfo?.journal?.title||'':x['container-title']?.[0]||'',volume:pmc?x.journalInfo?.volume||'':x.volume||'',issue:pmc?x.journalInfo?.issue||'':x.issue||'',pages:pmc?x.pageInfo||'':x.page||'',PMID:pmc&&x.source==='MED'?x.id:'',PMCID:pmc?x.pmcid||'':'',abstract:clean(pmc?x.abstractText:x.abstract),url:pmc?'https://europepmc.org/article/'+x.source+'/'+x.id:x.URL||'https://doi.org/'+x.DOI,type:'journalArticle',verified:true,source:pmc?'Europe PMC':'Crossref'};
 },
 async execute(name,args,run){
  if(!run.allowed.includes(name))throw Error('toolDenied');if(!args||typeof args!=='object')throw Error('toolArgs');
  if(name==='read_paper'||name==='view_page'){
   const page=Number(args.page)-1,pdf=LoomAssistantContext.pdf(run.reader);if(!Number.isInteger(page)||page<0||page>=(pdf?.numPages||0))throw Error('page');const source=this.source(run,{page,itemID:run.context.paper?.attachmentID,title:run.context.paper?.title||'PDF'});
   if(name==='view_page'){if(++run.images>3)throw Error('imageLimit');return {source,image:await LoomAssistantContext.image(run.reader,page,run.signal)};}
   const p=Components.utils.waiveXrays(await pdf.getPage(page+1)),text=PaperLoom.voiceScope.PaperVoiceCore.pdfText((await p.getTextContent()).items);return {source,text:text.slice(0,14000),truncated:text.length>14000};
  }
  const query=String(args.query||'').trim().slice(0,300);
  if(name==='search_library'){
   if(!query)throw Error('toolArgs');const search=new Zotero.Search();search.libraryID=Zotero.Libraries.userLibraryID;search.addCondition('quicksearch-titleCreatorYear','contains',query);search.addCondition('itemType','isNot','attachment');const ids=await search.search(),items=await Zotero.Items.getAsync(ids.slice(0,12));return {total:ids.length,results:items.filter(x=>!x.deleted).map(x=>({source:this.source(run,{itemID:x.id,title:x.getField('title'),url:x.getField('DOI')?'https://doi.org/'+x.getField('DOI'):'',record:this.reference(x,'library')}),authors:x.getCreators().map(c=>c.lastName).join(', '),date:x.getField('date'),abstract:x.getField('abstractNote').slice(0,3500),evidence:'library metadata/abstract'}))};
  }
  if(name==='search_literature'){
   if(!query)throw Error('toolArgs');const results=[],failures=[];
   try{const data=JSON.parse(await this.get('https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=core&pageSize=6&query='+encodeURIComponent(query)+(args.recent?'&sort_date=y':''),run));for(const x of (data.resultList?.result||[]).filter(x=>x.title))results.push({source:this.source(run,{title:x.title,url:x.doi?'https://doi.org/'+x.doi:'https://europepmc.org/article/'+x.source+'/'+x.id,doi:x.doi||'',published:x.firstPublicationDate||x.pubYear,record:this.reference(x,'pmc')}),authors:x.authorString,abstract:String(x.abstractText||'').replace(/<[^>]+>/g,' ').slice(0,5000),evidence:'Europe PMC metadata/abstract',retrieved:new Date().toISOString()});}catch(e){if(run.signal.aborted)throw e;failures.push('Europe PMC: '+e.message);}
   try{const data=JSON.parse(await this.get('https://api.crossref.org/works?rows=5&query.bibliographic='+encodeURIComponent(query)+(args.recent?'&sort=published&order=desc':''),run));for(const x of (data.message?.items||[]).filter(x=>x.title?.[0]&&['journal-article','posted-content','book-chapter','proceedings-article','book','monograph'].includes(x.type)))results.push({source:this.source(run,{title:x.title?.[0]||'',url:'https://doi.org/'+x.DOI,doi:x.DOI,published:x.published?.['date-parts']?.[0]?.join('-'),record:this.reference(x,'crossref')}),authors:(x.author||[]).slice(0,8).map(a=>a.family).join(', '),evidence:'Crossref metadata',retrieved:new Date().toISOString()});}catch(e){if(run.signal.aborted)throw e;failures.push('Crossref: '+e.message);}
   return {results:results.filter((x,i)=>results.findIndex(y=>y.source.id===x.source.id)===i),failures};
  }
  if(name==='search_web'){if(!query)throw Error('toolArgs');const key=await LoomAssistant.key('brave','https://api.search.brave.com'),data=JSON.parse(await this.get('https://api.search.brave.com/res/v1/web/search?count=5&q='+encodeURIComponent(query),run,key,'brave'));return {results:(data.web?.results||[]).map(x=>({source:this.source(run,{title:x.title,url:x.url}),snippet:x.description,evidence:'search snippet',retrieved:new Date().toISOString()}))};}
  if(name==='read_url'){
   const url=LoomAssistantCore.publicURL(args.url),host=new URL(url).hostname,domains=['ncbi.nlm.nih.gov','europepmc.org','ebi.ac.uk','nature.com','science.org','cell.com','elifesciences.org','biorxiv.org','medrxiv.org','arxiv.org','pmc.ncbi.nlm.nih.gov','wikipedia.org','journals.plos.org','frontiersin.org'];if(!domains.some(d=>host===d||host.endsWith('.'+d)))throw Error('webHost');
   const raw=await this.get(url,run),doc=new (Zotero.getMainWindow().DOMParser)().parseFromString(raw,'text/html');for(const el of doc.querySelectorAll('script,style,nav,footer,header,form,iframe'))el.remove();const text=(doc.querySelector('article,main')||doc.body).textContent.replace(/\s+/g,' ').trim();return {source:this.source(run,{title:doc.title||host,url}),text:text.slice(0,18000),truncated:text.length>18000,evidence:'web page text',retrieved:new Date().toISOString()};
  }
  throw Error('toolDenied');
 }
};
