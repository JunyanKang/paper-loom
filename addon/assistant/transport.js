var LoomAssistantTransport={
 visibleText(text){return String(text||'').replace(/<think(?:ing)?>[\s\S]*?(?:<\/think(?:ing)?>|$)/gi,'').replace(/<\/?think(?:ing)?>/gi,'').replace(/<\/?(?:t|th|thi|thin|think|thinki|thinkin|thinking)$/i,'').trimStart();},
 request(host,{url,body,key,protocol='openai',method='POST',signal,onText,limit=4000000,timeout=90000}){
  return new Promise((resolve,reject)=>{const xhr=new host.XMLHttpRequest();let done=false,read=0,buffer='',text='',ended=false,usage=null,calls=new Map(),parseError=false,stopReason='';
   const finish=(error,value)=>{if(done)return;done=true;signal?.removeEventListener('abort',abort);xhr.onload=xhr.onerror=xhr.onabort=xhr.ontimeout=xhr.onprogress=null;error?reject(error):resolve(value);};
   const abort=()=>{xhr.abort();finish(Object.assign(Error('cancelled'),{name:'AbortError'}));};
   const event=line=>{if(!line.startsWith('data:'))return;const raw=line.slice(5).trim();if(!raw)return;if(raw==='[DONE]'){ended=true;return;}let e;try{e=JSON.parse(raw);}catch(_){parseError=true;return;}if(e.error||e.type==='error'){parseError=true;return;}
    const choice=e.choices?.[0];if(e.usage)usage=e.usage;if(choice?.finish_reason){ended=true;stopReason=choice.finish_reason;}if(e.type==='message_stop')ended=true;if(e.delta?.stop_reason)stopReason=e.delta.stop_reason;
    const delta=protocol==='anthropic'?(e.type==='content_block_delta'&&e.delta?.type==='text_delta'?e.delta.text:''):choice?.delta?.content;if(typeof delta==='string'){text+=delta;onText?.(this.visibleText(text));}
    for(const c of choice?.delta?.tool_calls||[]){let call=calls.get(c.index);if(!call){call={id:'',name:'',arguments:''};calls.set(c.index,call);}if(c.id)call.id=c.id;if(c.function?.name)call.name+=c.function.name;if(c.function?.arguments)call.arguments+=c.function.arguments;}
    if(e.type==='content_block_start'&&e.content_block?.type==='tool_use')calls.set(e.index,{id:e.content_block.id,name:e.content_block.name,arguments:''});
    if(e.type==='content_block_delta'&&e.delta?.type==='input_json_delta'){const call=calls.get(e.index);if(call)call.arguments+=e.delta.partial_json;}
   };
   const progress=()=>{if(xhr.responseText.length>limit){finish(Error('responseSize'));xhr.abort();return;}buffer+=xhr.responseText.slice(read);read=xhr.responseText.length;const lines=buffer.split(/\r?\n/);buffer=lines.pop();for(const line of lines)event(line);};
   xhr.open(method,url,true);xhr.timeout=timeout;xhr.setRequestHeader('Accept',body?'text/event-stream, application/json':'application/json');if(body)xhr.setRequestHeader('Content-Type','application/json');
   if(key){if(protocol==='anthropic'){xhr.setRequestHeader('x-api-key',key);xhr.setRequestHeader('anthropic-version','2023-06-01');}else if(protocol==='brave')xhr.setRequestHeader('X-Subscription-Token',key);else xhr.setRequestHeader('Authorization','Bearer '+key);}
   try{if(Components.interfaces?.nsIRequest)xhr.channel.loadFlags|=Components.interfaces.nsIRequest.LOAD_ANONYMOUS;xhr.channel.notificationCallbacks={QueryInterface:ChromeUtils.generateQI(['nsIInterfaceRequestor','nsIChannelEventSink']),getInterface(iid){return this.QueryInterface(iid);},asyncOnChannelRedirect(a,b,f,cb){cb.onRedirectVerifyCallback(Components.results.NS_ERROR_ABORT);}};}catch(_){finish(Error('secureConnection'));xhr.abort();return;}
   xhr.onprogress=()=>{if(xhr.status===200&&/^text\/event-stream/i.test(xhr.getResponseHeader('Content-Type')||''))progress();else if(xhr.responseText.length>limit){finish(Error('responseSize'));xhr.abort();}};
   xhr.onload=()=>{if(xhr.responseText.length>limit){finish(Error('responseSize'));return;}if(xhr.status<200||xhr.status>=300){finish(Error('http:'+xhr.status));return;}try{if(method==='GET'){finish(null,xhr.responseText);return;}
    if(/^\s*\{/.test(xhr.responseText)){const e=JSON.parse(xhr.responseText),choice=e.choices?.[0];if(e.error)throw Error('modelError');text=protocol==='anthropic'?(e.content||[]).filter(c=>c.type==='text').map(c=>c.text).join(''):choice?.message?.content||'';usage=e.usage;stopReason=choice?.finish_reason||e.stop_reason;for(const [i,c]of (choice?.message?.tool_calls||[]).entries())calls.set(i,{id:c.id,name:c.function.name,arguments:c.function.arguments});if(protocol==='anthropic')for(const [i,c]of(e.content||[]).entries())if(c.type==='tool_use')calls.set(i,{id:c.id,name:c.name,arguments:JSON.stringify(c.input)});ended=true;
    }else{progress();event(buffer);}if(parseError)throw Error('modelError');if(!ended)throw Error('incomplete');if(!text&&!calls.size)throw Error('empty');finish(null,{text:this.visibleText(text),calls:[...calls.values()],usage,truncated:['length','max_tokens'].includes(stopReason)});
   }catch(e){finish(e);}};
   xhr.onerror=()=>finish(Error('network'));xhr.ontimeout=()=>finish(Error('timeout'));xhr.onabort=()=>finish(Object.assign(Error('cancelled'),{name:'AbortError'}));
   if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});xhr.send(body?JSON.stringify(body):null);
  });
 },
 body(config,messages,tools){
  if(config.protocol!=='anthropic'){
   const body={model:config.model,messages,stream:true,max_tokens:4096,...(tools.length?{tools}:{}),...(config.id==='qwen'?{enable_thinking:false}:{})};
   if(config.id==='glm'&&/^glm-4\.[67]/i.test(config.model))body.thinking={type:'disabled'};
   if(config.id==='minimax'&&/^MiniMax-M3/i.test(config.model)){delete body.max_tokens;body.max_completion_tokens=8192;body.reasoning_split=true;if(/M3\.1-Flash/i.test(config.model))body.reasoning_effort='low';else body.thinking={type:'disabled'};}
   return body;
  }
  const convert=content=>typeof content==='string'?content:content.map(c=>c.type==='image_url'?{type:'image',source:{type:'base64',media_type:c.image_url.url.split(';')[0].slice(5),data:c.image_url.url.split(',')[1]}}:{type:'text',text:c.text});
  const out=[];for(const m of messages){if(m.role==='system')continue;if(m.role==='tool'){const block={type:'tool_result',tool_use_id:m.tool_call_id,content:m.content};if(out.at(-1)?.role==='user'&&Array.isArray(out.at(-1).content))out.at(-1).content.push(block);else out.push({role:'user',content:[block]});continue;}if(m.tool_calls){const content=[];if(m.content)content.push({type:'text',text:m.content});for(const c of m.tool_calls)content.push({type:'tool_use',id:c.id,name:c.function.name,input:JSON.parse(c.function.arguments||'{}')});out.push({role:'assistant',content});}else out.push({role:m.role,content:convert(m.content)});}
  return {model:config.model,system:messages.filter(m=>m.role==='system').map(m=>m.content).join('\n'),messages:out,stream:true,max_tokens:4096,...(tools.length?{tools:tools.map(t=>({name:t.function.name,description:t.function.description,input_schema:t.function.parameters}))}:{})};
 }
};
