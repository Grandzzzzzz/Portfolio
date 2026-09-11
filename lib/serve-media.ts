export type StoredMedia={body:ReadableStream;size:number;httpEtag?:string;httpMetadata?:{contentType?:string}};
// Stream and honour byte ranges so videos can seek without buffering the full file.
export async function serveMedia(request:Request,object:StoredMedia|null){
 if(!object)return new Response('Not found',{status:404});
 const headers=new Headers({'Content-Type':object.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'});
 if(object.httpEtag)headers.set('ETag',object.httpEtag);
 if(object.httpEtag&&request.headers.get('if-none-match')===object.httpEtag){await object.body.cancel();return new Response(null,{status:304,headers})}
 let start=0,end=object.size-1,status=200;
 const range=request.headers.get('range'),ifRange=request.headers.get('if-range');
 if(range&&(!ifRange||ifRange===object.httpEtag)){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match||(!match[1]&&!match[2])){await object.body.cancel();return new Response(null,{status:416,headers:{'Content-Range':`bytes */${object.size}`}})}
  start=match[1]?Number(match[1]):Math.max(0,object.size-Number(match[2]));
  end=match[1]&&match[2]?Math.min(Number(match[2]),end):end;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=object.size){await object.body.cancel();return new Response(null,{status:416,headers:{'Content-Range':`bytes */${object.size}`}})}
  status=206;headers.set('Content-Range',`bytes ${start}-${end}/${object.size}`);
 }
 headers.set('Content-Length',String(end-start+1));
 if(request.method==='HEAD'){await object.body.cancel();return new Response(null,{status,headers})}
 if(status===200)return new Response(object.body,{headers});
 const reader=object.body.getReader();let offset=0;
 const body=new ReadableStream({async pull(controller){try{while(true){const {done,value}=await reader.read();if(done){controller.close();return}const from=Math.max(0,start-offset),to=Math.min(value.byteLength,end-offset+1);offset+=value.byteLength;if(to>from)controller.enqueue(value.subarray(from,to));if(offset>end){controller.close();await reader.cancel();return}if(to>from)return}}catch(error){controller.error(error)}},cancel:reason=>reader.cancel(reason)});
 return new Response(body,{status,headers});
}
