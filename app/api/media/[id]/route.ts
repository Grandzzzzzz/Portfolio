import {bindings} from '@/db';
import {serveMedia} from '@/lib/serve-media';

async function getPublishedStaticMedia(request: Request, id: string) {
 const asset=await fetch(new URL(`/uploads/${id}.bin`,request.url));
 if(!asset.ok||!asset.body)return null;
 let contentType=asset.headers.get('content-type')||'application/octet-stream';
 try{
  const metadata=await fetch(new URL(`/uploads/${id}.bin.json`,request.url));
  if(metadata.ok){const value=await metadata.json() as {contentType?:unknown};if(typeof value.contentType==='string')contentType=value.contentType;}
 }catch{}
 const contentLength=Number(asset.headers.get('content-length'));
 if(Number.isSafeInteger(contentLength)&&contentLength>0){
  return {body:asset.body,size:contentLength,httpEtag:asset.headers.get('etag')||`"${id}"`,httpMetadata:{contentType},arrayBuffer:()=>asset.arrayBuffer()};
 }
 const bytes=await asset.arrayBuffer();
 return {body:new Blob([bytes],{type:contentType}).stream(),size:bytes.byteLength,httpEtag:asset.headers.get('etag')||`"${id}"`,httpMetadata:{contentType},arrayBuffer:async()=>bytes};
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 const store=bindings();
 const host=store.PORTFOLIO_HOST as string;
 const object=await store.MEDIA.get(id)||(['netlify','vercel'].includes(host)?await getPublishedStaticMedia(request,id):null);
 return serveMedia(request,object);
}
export const HEAD=GET;
