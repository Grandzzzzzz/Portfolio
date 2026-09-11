import {getStore} from '@netlify/blobs';
export const netlifyMedia={
 async get(key:string){
  const object=await getStore({name:'portfolio-media',consistency:'strong'}).getWithMetadata(key,{type:'stream'});
  if(!object)return null;
  return {body:object.data,size:Number(object.metadata.size),httpEtag:object.etag,httpMetadata:{contentType:String(object.metadata.contentType||'application/octet-stream')},arrayBuffer:()=>new Response(object.data).arrayBuffer()};
 },
 async put(key:string,bytes:Uint8Array,options?:{httpMetadata?:{contentType?:string}}){
  await getStore({name:'portfolio-media',consistency:'strong'}).set(key,new Blob([bytes as Uint8Array<ArrayBuffer>]),{metadata:{size:bytes.byteLength,contentType:options?.httpMetadata?.contentType||'application/octet-stream',createdAt:Date.now()}});
 },
 async delete(key:string){await getStore('portfolio-media').delete(key)}
};
