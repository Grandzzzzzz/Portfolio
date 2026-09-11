import {bindings} from '@/db';
import {serveMedia} from '@/lib/serve-media';

async function getVercelStaticMedia(request: Request, id: string) {
 const asset=await fetch(new URL(`/uploads/${id}.bin`,request.url));
 if(!asset.ok||!asset.body)return null;
 let contentType=asset.headers.get('content-type')||'application/octet-stream';
 try{
  const metadata=await fetch(new URL(`/uploads/${id}.bin.json`,request.url));
  if(metadata.ok){const value=await metadata.json() as {contentType?:unknown};if(typeof value.contentType==='string')contentType=value.contentType;}
 }catch{}
 return {body:asset.body,size:Number(asset.headers.get('content-length')||0),httpEtag:asset.headers.get('etag')||`"${id}"`,httpMetadata:{contentType},arrayBuffer:()=>asset.arrayBuffer()};
}

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 const store=bindings();
 const object=await store.MEDIA.get(id)||((store.PORTFOLIO_HOST as string)==='vercel'?await getVercelStaticMedia(request,id):null);
 return serveMedia(request,object);
}
export const HEAD=GET;
