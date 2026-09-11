import 'server-only';
import {getStore} from '@netlify/blobs';
import {defaultContent,type Content} from '@/lib/content';
import {netlifyMedia} from '@/lib/netlify-media';
export function bindings(){return {MEDIA:netlifyMedia,PORTFOLIO_HOST:'netlify',CMS_ADMIN_USER_ID:undefined,CF_ACCESS_TEAM_DOMAIN:undefined,CF_ACCESS_AUD:undefined,CMS_ADMIN_EMAIL:process.env.CMS_ADMIN_EMAIL}}
type Snapshot={content:Content;version:number;updatedAt:string|null};
export async function readContent():Promise<Snapshot>{
 const value=await getStore({name:'portfolio-content',consistency:'strong'}).get('current',{type:'json'});
 return value??{content:defaultContent,version:0,updatedAt:null};
}
export async function writeContent(content:Content,version:number):Promise<Snapshot|null>{
 const store=getStore({name:'portfolio-content',consistency:'strong'});
 const current=await store.getWithMetadata('current',{type:'json'});
 if((current?.data.version??0)!==version)return null;
 const snapshot={content,version:version+1,updatedAt:new Date().toISOString()};
 const result=await store.setJSON('current',snapshot,current?{onlyIfMatch:current.etag}:{onlyIfNew:true});
 if(!result.modified)return null;
 // Verify persistence rather than treating a storage transport failure as success.
 const persisted=await store.get('current',{type:'json'});
 if(persisted?.version!==snapshot.version||JSON.stringify(persisted.content)!==JSON.stringify(content))throw Error('保存状态未确认，请刷新后台检查');
 return snapshot;
}
