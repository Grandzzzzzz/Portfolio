import {writeContent,readContent} from '@/db';
import {isAdmin,protectWrite} from '@/lib/admin';
import {validateContent} from '@/lib/content';
export const dynamic='force-dynamic';
export async function GET(){if(!await isAdmin())return Response.json({error:'无管理权限'},{status:403});return Response.json(await readContent(),{headers:{'Cache-Control':'private, no-store'}})}
export async function PUT(request:Request){
 const denied=await protectWrite(request);if(denied)return denied;
 try{
 const raw=await request.text();if(raw.length>1000000)return Response.json({error:'内容过大'},{status:413});
 const payload=JSON.parse(raw);const content=validateContent(payload.content);const version=payload.version;
 if(!Number.isSafeInteger(version)||version<0)throw Error('版本格式不正确');
 const row=await writeContent(content,version);
 if(!row)return Response.json({error:'内容已在另一个窗口更新。请刷新后台后重新编辑。'},{status:409});
 return Response.json(row);
 }catch(error){return Response.json({error:error instanceof Error?error.message:'保存失败，请重试'},{status:400})}
}
