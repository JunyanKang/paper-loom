/* Local text-layer fallback. Conservative hanging-indent/numbered segmentation. */
var CiteLensBibliography = {
  headerKey(text){return CiteLensCore.norm(text).replace(/\b\d+\b/g,'num').replace(/^num +| +num$/g,'');},
  runningHeaders(pages) {
    const C=CiteLensCore,seen=new Map(),lines=[];
    for(const [index,page] of Object.entries(pages||{})){
      const top=page.viewBox?.[3]||800,bottom=page.viewBox?.[1]||0,rows=new Map();
      for(const c of page.chars||[]){if(!c.rect||c.rect[1]<top-80&&c.rect[1]>bottom+80)continue;const y=Math.round(c.rect[1]/3)*3;if(!rows.has(y))rows.set(y,[]);rows.get(y).push(c);}
      for(const chars of rows.values()){const text=C.charsText({chars}),doi=C.doi(text),key=doi||this.headerKey(text);if(key.length<12&&!/^(?:article|research|review|open access)$/i.test(key))continue;lines.push({chars,key,index});if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(index);}
    }
    const repeated=lines.filter(x=>seen.get(x.key).size>=2||/^(?:article|research|review)$/i.test(x.key)&&x.chars.every(c=>c.fontSize>=16)),result=new Set(repeated.flatMap(x=>x.chars.map(c=>x.index+':'+c.offset)));result.lines=new Set(repeated.map(x=>x.key));return result;
  },
  fromReference(ref,headers=new Set()) {
    const chars=ref.chars?.filter(c=>!headers.has(c.pageIndex+':'+c.offset)),copy={...ref,chars};
    return CiteLensCore.fromReference(copy);
  },
  authorStart(text) {
    text=CiteLensCore.repairPDFAccents(text);
    return /^(?:The )?[\p{Lu}][\p{L}\d .&’'–-]{3,140}(?:Consortium|Group|Team|Developers)\.?\s*\((?:18|19|20)\d{2}/u.test(text)||/^(?:(?:van|von|de|del|der|den|da|di|la|le|tom) +|al-)*[\p{Lu}][\p{L}'’\- ]{1,40},\s*(?:[\p{Lu}]\.|[\p{Lu}][\p{Ll}])/u.test(text)||/^(?:(?:van|von|de|del|der|den|da|di|la|le|tom) +)*[\p{Lu}][\p{L}'’\-]*(?: [\p{L}'’\-]+){0,3} [A-Z](?:[A-Z]|-[A-Z]){0,8}(?:,|\.\s+[\p{Lu}]|\.?\s*\(?\s*(?:18|19|20)\d{2})/u.test(text);
  },
  columnSplit(usable,width){
    // Find the actual gutter, including alternating inner/outer page margins.
    // Inline font runs inside a single wide column must not become a second column.
    const candidates=[...new Set(usable.filter(x=>x.x>width*.42&&x.x<width*.62).map(x=>Math.round(x.x)))];
    let split=null,best=0;
    for(const x of candidates){const aligned=usable.filter(p=>Math.abs(p.x-x)<2),starts=aligned.length,low=Math.min(...aligned.map(p=>p.y)),high=Math.max(...aligned.map(p=>p.y)),crossings=usable.filter(p=>p.y>=low&&p.y<=high&&p.x<x-4&&p.x+p.width>x-2).length;
      if(starts>=5&&crossings<Math.max(3,starts*.35)&&starts-crossings>best){best=starts-crossings;split=x-2;}}
    if(split!==null){const cuts=[];for(let x=split;x>=split-width*.05;x-=1){const count=usable.filter(p=>p.x<x&&p.x+p.width>x).length;cuts.push({x,count});}const minimum=Math.min(...cuts.map(c=>c.count)),clear=cuts.filter(c=>c.count===minimum);split=clear[Math.floor(clear.length/2)].x;}
    return split;
  },
  lines(items,width,pageIndex) {
    const usable=items.filter(x=>x.str?.trim()&&x.transform?.length>=6&&Math.abs(x.transform[0])>=Math.abs(x.transform[1])).map(x=>({text:x.str,x:x.transform[4],y:x.transform[5],height:Math.abs(x.height||x.transform[3]||8),width:x.width||0}));
    const split=this.columnSplit(usable,width);
    const columns=split===null?1:2,out=[];
    for(let col=0;col<columns;col++) {
      const set=usable.filter(x=>columns===1||(x.x>=split?1:0)===col).sort((a,b)=>b.y-a.y||a.x-b.x);const rows=[];
      for(const item of set){let row=rows.find(r=>Math.abs(r.y-item.y)<Math.min(2,item.height*.3));if(!row){row={y:item.y,parts:[]};rows.push(row);}row.parts.push(item);}
      for(const row of rows){row.parts.sort((a,b)=>a.x-b.x);let text='';for(let i=0;i<row.parts.length;i++){const p=row.parts[i],prev=row.parts[i-1];if(prev&&p.x-prev.x-prev.width>Math.max(.6,p.height*.12)&&!text.endsWith(' '))text+=' ';text+=p.text;}const min=Math.min(...row.parts.map(p=>p.x)),max=Math.max(...row.parts.map(p=>p.x+p.width)),h=Math.max(...row.parts.map(p=>p.height));out.push({text:CiteLensCore.clean(text),x:min,y:row.y,height:h,column:col,pageIndex,rect:[min,row.y-h*.25,max,row.y+h]});}
    }
    return out;
  },
  parse(pages,headers=null) {
    const out=[],headerLines=new Set([...(headers?.lines||[])].flatMap(h=>[h,CiteLensCore.doi(h)||this.headerKey(h)]));let active=false,current=null;
    const flush=()=>{if(!current)return;const raw=current.lines.map(l=>l.text).join(' ').replace(/(\d)[-‐]\s+(?=[a-z])/g,'$1-').replace(/([\p{L}])[-‐]\s+(?!(?:and|or)\b)([a-z])/gu,'$1$2');const r=CiteLensCore.parse(raw,{pageIndex:current.lines[0].pageIndex,rects:current.lines.filter(l=>l.pageIndex===current.lines[0].pageIndex).map(l=>l.rect)});if((r.year||current.number&&(r.DOI||/\b(?:this issue|in press)\b/i.test(raw)))&&r.author&&r.title.length>=8){r.source='PDF 本地分栏解析（需核对）';r.number=current.number;out.push(r);}current=null;};
    for(const page of pages){const top=page.viewBox?.[3]??page.height,bottom=page.viewBox?.[1]??0;const items=page.items.filter(item=>{const text=CiteLensCore.clean(item.str),key=CiteLensCore.doi(text)||this.headerKey(text);if((item.transform?.[5]>top-80||item.transform?.[5]<bottom+80)&&/^Page\s+\d+$/i.test(text))return false;return !([...headerLines].some(h=>h===key||key.length>12&&h.includes(key))&&(item.transform?.[5]>top-80||item.transform?.[5]<bottom+80||!!CiteLensCore.doi(text)));}),lines=this.lines(items,page.width,page.pageIndex),bases=new Map(),referenceBases=new Map();
      for(const l of lines)if(l.y>bottom+30&&l.y<top-20)bases.set(l.column,Math.min(bases.get(l.column)??Infinity,l.x));
      for(const l of lines)if(this.authorStart(l.text))referenceBases.set(l.column,Math.min(referenceBases.get(l.column)??Infinity,l.x));
      const numberedStarts=lines.map((l,i)=>{const m=l.text.match(/^\[?(\d{1,4})\]?[.)]?\s+(.+)/u);return m&&this.authorStart(m[2])?{i,n:Number(m[1]),l}:null;}).filter(Boolean);
      const inferred=new Set();
      for(let n=0;n+2<numberedStarts.length;n++){const group=numberedStarts.slice(n,n+3);if(group[1].n!==group[0].n+1||group[2].n!==group[1].n+1)continue;
        if(group.every((g,j)=>{const end=numberedStarts[n+j+1]?.i??lines.length;return /\b(?:18|19|20)\d{2}\b/.test(lines.slice(g.i,end).map(x=>x.text).join(' '));})){inferred.add(group[0].i);const previous=lines.slice(0,group[0].i).findLastIndex(l=>new RegExp('^'+(group[0].n-1)+'[.)]\\s').test(l.text));if(previous>=0&&/\b(?:18|19|20)\d{2}\b/.test(lines.slice(previous,group[0].i).map(x=>x.text).join(' ')))inferred.add(previous);}}
      for(const [lineIndex,l] of lines.entries()){if(l.y<bottom+30||l.y>top-18)continue;if((l.y>top-80||l.y<bottom+30)&&headerLines.has(CiteLensCore.doi(l.text)||this.headerKey(l.text)))continue;
        if(/^(references|bibliography|literature cited|参考文献)\s*$/i.test(l.text)){active=true;continue;}
        if(!active&&inferred.has(lineIndex))active=true;
        if(!active)continue;
        if(/^(?:Conflict of Interest Statement|Received(?::|\s+[A-Z][a-z]+\s+\d)|Copyright\s+[©(])/i.test(l.text)){flush();active=false;continue;}
        if(/^Fig(?:ure)?\.?\s+\d+(?:[.:]|\s|$)/i.test(l.text)){flush();active=false;continue;}
        if(/^(appendix|supplement(?:ary material|ary information|al figures)|acknowledg(e)?ments|STAR\s*\+?\s*METHODS|Methods$|Fig(?:ure)?\.?\s+\d+[.: ]|Publisher[’'’]s note|Open Access This|Author contributions|Competing interests|Additional information|Annual Review of|Contents)\b/i.test(l.text)){flush();active=false;continue;}
        if(current?.number&&/^[^.:]{4,100}Consortium:/.test(l.text)){flush();active=false;continue;}
        const doiContinuation=current&&/^\d+[.]?$/.test(l.text)&&l.x>(referenceBases.get(l.column)??bases.get(l.column)??l.x)+3&&!!CiteLensCore.doi(current.lines.map(x=>x.text).join(' '));
        if(!doiContinuation&&(l.text.length<3||/^\d+$/.test(l.text))||/^(?:A\.|[A-Z]\.\s*)?\s*Bringmann et al\./.test(l.text)||/Prog(?:ress)?\.? (?:in )?Retin/i.test(l.text)&&/\(20\d\d\)/.test(l.text))continue;
        const numbered=l.text.match(/^\[?(\d{1,4})\]?[.)]?\s+(?=[\p{L}])/u);
        const authorStart=this.authorStart(l.text);
        const atMargin=l.x<=(referenceBases.get(l.column)??bases.get(l.column)??l.x)+3;
        const unfinishedAuthors=current&&!/\b(?:1[6-9]|20)\d{2}[a-z]?\b/.test(current.lines.map(x=>x.text).join(' '));
        if((numbered&&this.authorStart(l.text.slice(numbered[0].length))||authorStart&&(referenceBases.get(l.column)===undefined||atMargin)||numbered&&/^\[?\d{1,4}(?:[.)]|\])\s/.test(l.text)&&atMargin)&&(!unfinishedAuthors||numbered&&current?.number&&Number(numbered[1])===current.number+1)){referenceBases.set(l.column,l.x);flush();current={lines:[l],number:numbered?Number(numbered[1]):undefined};}
        else if(current)current.lines.push(l);
      }
    }
    flush();return out;
  },
  merge(native,local) {
    const C=CiteLensCore,out=[];
    for(const r of [...native,...local]){
      const i=out.findIndex(x=>{
        if(x.number&&r.number&&x.number!==r.number)return false;
        const samePlace=!!(x.position?.rects?.length&&r.position?.rects?.length)&&x.position.pageIndex===r.position.pageIndex&&Math.abs((x.position?.rects?.[0]?.[0]||0)-(r.position?.rects?.[0]?.[0]||0))<8;
        const a=C.norm(x.raw).replace(/ /g,''),b=C.norm(r.raw).replace(/ /g,'');
        const sameStart=samePlace&&Math.abs((x.position?.rects?.[0]?.[3]||0)-(r.position?.rects?.[0]?.[3]||0))<4;
        if(sameStart&&C.norm(x.author)===C.norm(r.author)&&x.year===r.year&&x.suffix===r.suffix&&(C.similarity(x.title,r.title)>.75||a.startsWith(b)||b.startsWith(a)))return true;
        if(samePlace&&x.number&&x.number===r.number&&C.norm(x.author)===C.norm(r.author))return true;
        return (!(x.number&&r.number)||x.number===r.number)&&C.identity(x)===C.identity(r)||samePlace&&a===b||samePlace&&x.number&&x.number===r.number&&(a.startsWith(b)||b.startsWith(a))||C.norm(x.author)===C.norm(r.author)&&x.year===r.year&&x.suffix===r.suffix&&C.norm(x.title)===C.norm(r.title);
      });
      if(i<0)out.push(r);else if(local.includes(r)||r.raw.length>out[i].raw.length)out[i]=r;
    }
    return out;
  }
};
if(typeof module!=='undefined')module.exports=CiteLensBibliography;
