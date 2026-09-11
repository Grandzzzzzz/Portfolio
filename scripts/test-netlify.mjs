import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {BlobsServer} from '@netlify/blobs/server';
import {getStore,setEnvironmentContext} from '@netlify/blobs';
const directory=await mkdtemp(path.join(tmpdir(),'portfolio-netlify-test-'));
const server=new BlobsServer({directory,logger:()=>{}});
const address=await server.start();
setEnvironmentContext({siteID:'portfolio-test',apiURL:`http://localhost:${address.port}`,token:'test-only'});
const nativeFetch=globalThis.fetch;
process.env.URL='https://portfolio-test.netlify.app';process.env.CMS_ADMIN_EMAIL='owner@example.test';
globalThis.fetch=async(input,options)=>{
 if(String(input)==='https://portfolio-test.netlify.app/.netlify/identity/user')return options?.headers?.Authorization==='Bearer valid-test-token'?Response.json({id:'owner',email:'owner@example.test',confirmed_at:'2026-01-01'}):new Response(null,{status:401});
 return nativeFetch(input,options);
};
try{
 const {default:handler}=await import('../.netlify/functions-internal/server/main.mjs');
 const content=JSON.parse(await readFile(process.argv[2]||'.backups/2026-09-10T11-28-25-934Z/content.json','utf8'));
 const store=getStore({name:'portfolio-content',consistency:'strong'});
 await store.setJSON('current',{content,version:1,updatedAt:new Date().toISOString()});
 const call=(route,{method='GET',body,auth=false,origin=true,headers={}}={})=>handler(new Request('https://portfolio-test.netlify.app'+route,{method,headers:{...(auth?{cookie:'nf_jwt=valid-test-token'}:{}),...(origin?{origin:'https://portfolio-test.netlify.app'}:{}),...headers},body}));
 let response=await call('/');assert.equal(response.status,200);assert.ok((await response.text()).includes(content.name));
 response=await call('/admin');assert.equal(response.status,200);assert.ok((await response.text()).includes('管理员邮箱'));
 assert.equal((await call('/api/admin/content')).status,403);
 assert.equal((await call('/api/admin/content',{headers:{cookie:'nf_jwt=forged'}})).status,403);
 response=await call('/api/admin/content',{auth:true});assert.equal(response.status,200);assert.deepEqual((await response.json()).content,content);
 const edited={...content,role:'Test role saved in isolated storage'};
 const put={method:'PUT',auth:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({content:edited,version:1})};
 assert.equal((await call('/api/admin/content',{...put,origin:false})).status,403);
 response=await call('/api/admin/content',put);assert.equal(response.status,200);assert.equal((await response.json()).version,2);
 assert.equal((await call('/api/admin/content',put)).status,409);
 assert.equal((await call('/api/admin/content',{...put,body:JSON.stringify({content:{...edited,name:''},version:2})})).status,400);
 response=await call('/api/content');assert.equal((await response.json()).content.role,edited.role);
 const id=crypto.randomUUID(),bytes=new Uint8Array(700000);bytes.set([137,80,78,71]);
 for(let i=0;i<2;i++){const form=new FormData();form.set('uploadId',id);form.set('partNumber',String(i));form.set('totalParts','2');form.set('file',new Blob([bytes.slice(i*524288,(i+1)*524288)]),'test.png');response=await call('/api/admin/upload/chunk',{method:'POST',auth:true,body:form});assert.equal(response.status,200)}
 response=await call('/api/admin/upload/complete',{method:'POST',auth:true,body:JSON.stringify({uploadId:id,totalParts:2}),headers:{'Content-Type':'application/json'}});assert.equal(response.status,200);const uploaded=await response.json();
 response=await call(uploaded.url);assert.equal(response.status,200);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
 for(const [range,status,length] of [['bytes=0-99',206,100],['bytes=-100',206,100],['bytes=699999-',206,1],['bytes=999999-',416,0],['bytes=-0',416,0]]){response=await call(uploaded.url,{headers:{range}});assert.equal(response.status,status);assert.equal((await response.arrayBuffer()).byteLength,length)}
 response=await call(uploaded.url,{method:'HEAD'});assert.equal(response.headers.get('content-length'),'700000');assert.equal((await response.arrayBuffer()).byteLength,0);
 const media=getStore('portfolio-media');assert.equal(await media.get(`__upload/${id}/0`),null);
 for(const p of content.projects){response=await call('/work/'+p.id);assert.equal(response.status,200);assert.ok((await response.text()).includes(p.name))}
 console.log('PASS: public pages, admin login gate, verified-account authorization, CSRF, persistent edits, stale-version conflict, invalid content, chunk upload/merge/cleanup, media bytes, ranges, HEAD, and all project routes.');
}finally{globalThis.fetch=nativeFetch;await server.stop();await rm(directory,{recursive:true,force:true})}
