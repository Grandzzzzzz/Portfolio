import {netlifyMedia} from '../../lib/netlify-media';
import {serveMedia} from '../../lib/serve-media';
export default async function media(request:Request){
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
 const id=new URL(request.url).pathname.split('/').pop()||'';
 if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 return serveMedia(request,await netlifyMedia.get(id));
}
