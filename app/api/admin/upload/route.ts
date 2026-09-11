import {bindings} from '@/db';
import {protectWrite} from '@/lib/admin';
export async function POST(request:Request){
 const denied=await protectWrite(request);if(denied)return denied;
 const max=50*1024*1024;
 if(Number(request.headers.get('content-length'))>max+10000)return Response.json({error:'文件不能超过 50 MB'},{status:413});
 try{
 const form=await request.formData();const file=form.get('file');
 if(!(file instanceof File)||!file.size||file.size>max)return Response.json({error:'请选择 50 MB 以内的图片或视频'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());
 let type='',mediaType:'image'|'video'='image';
 if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)type='image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)type='image/jpeg';
 if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')type='image/webp';
 if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3){type='video/webm';mediaType='video'}
 if(new TextDecoder().decode(bytes.slice(4,8))==='ftyp'){type='video/mp4';mediaType='video'}
 if(!type)return Response.json({error:'请上传 JPG、PNG、WebP、MP4 或 WebM 文件'},{status:400});
 const id=crypto.randomUUID();await bindings().MEDIA.put(id,bytes,{httpMetadata:{contentType:type}});
 return Response.json({url:`/api/media/${id}`,mediaType});
 }catch{return Response.json({error:'上传失败，请重试'},{status:500})}
}
