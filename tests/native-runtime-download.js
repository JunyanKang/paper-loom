const base=PathUtils.parent(PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path));
// Keep installation tests inside the project, independent of all real profiles.
Runtime.root=PathUtils.join(PathUtils.parent(Services.dirsvc.get('ProfD',Components.interfaces.nsIFile).path),'runtime-qa');
Runtime.cache=PathUtils.join(Runtime.root,'downloads');await IOUtils.makeDirectory(Runtime.cache,{ignoreExisting:true});
const report=PathUtils.join(PathUtils.parent(Runtime.root),'test-results','runtime-progress.json');
let last=0;Runtime.subscribe(s=>{if(Date.now()-last>800||['ready','error','cancelled'].includes(s.phase)){last=Date.now();IOUtils.writeJSON(report,{...s,platform:Runtime.platform}).catch(()=>{});}});
L.qaRuntimeTask=Runtime.install().then(path=>{L.qaRuntimeResult={passed:true,path,state:Runtime.state};return L.qaRuntimeResult;},error=>{L.qaRuntimeResult={passed:false,error:error.message,state:Runtime.state};return L.qaRuntimeResult;});
return {started:true,platform:Runtime.platform,bytes:Runtime.catalog.packages.reduce((n,p)=>n+p.bytes,0)};
