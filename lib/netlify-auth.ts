import 'server-only';
import {cookies} from 'next/headers';
import {cache} from 'react';
export const netlifyAdmin=cache(async()=>{
 const token=(await cookies()).get('nf_jwt')?.value;
 const origin=process.env.URL,owner=process.env.CMS_ADMIN_EMAIL;
 if(!token||!origin||!owner)return null;
 try{
  const url=new URL(origin);
  if(url.protocol!=='https:'&&!(process.env.NODE_ENV==='development'&&['localhost','127.0.0.1'].includes(url.hostname)))return null;
  // Verify against this site's Identity service; never trust decoded cookie claims.
  const response=await fetch(new URL('/.netlify/identity/user',url),{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)return null;
  const user=await response.json() as {id?:string;email?:string;confirmed_at?:string};
  if(!user.id||!user.confirmed_at||user.email?.toLowerCase()!==owner.toLowerCase())return null;
  return {userId:user.id,email:user.email,displayName:user.email,fullName:null};
 }catch{return null}
});
