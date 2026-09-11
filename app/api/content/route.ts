import {readContent} from '@/db';
export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await readContent(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'暂时无法读取网站内容'},{status:503})}}
