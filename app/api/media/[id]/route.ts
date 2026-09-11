import {bindings} from '@/db';
import {serveMedia} from '@/lib/serve-media';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 return serveMedia(request,await bindings().MEDIA.get(id));
}
export const HEAD=GET;
