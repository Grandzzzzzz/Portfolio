import type {Project} from './content';
export type GalleryImage={id:string;image:string;mediaType?:'image'|'video';caption:string;layout:'wide'|'half'};
export type ProjectDetails={client:string;role:string;duration:string;challenge:string;approach:string;outcome:string;effect:'auto'|'metal'|'contour'|'orbit'|'none';palette:'auto'|'indigo'|'copper'|'green'|'mono';seed:number;gallery:GalleryImage[]};
export function seedFor(id:string){return Array.from(id).reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%100000}
export function getDetails(p:Project):ProjectDetails{
 const demo=/^project-[123]$/.test(p.id);
 const defaults:ProjectDetails={client:demo?'Independent concept':'',role:demo?p.category:'',duration:demo?'6 weeks':'',challenge:demo?'A familiar idea, seen from a different angle. The brief was to create a distinct visual language that feels clear, intentional, and a little unexpected.':'',approach:demo?'We began with research, sketches, and a simple question: what can we remove? Through typography, material studies, and digital experiments, the direction became a cohesive system.':'',outcome:demo?'A flexible identity with room to grow. From the smallest detail to the complete experience, every element shares the same visual rhythm.':'',effect:'auto',palette:'auto',seed:seedFor(p.id),gallery:demo?[{id:'detail-1',image:p.image,caption:'01 / Visual exploration',layout:'wide'}]:[]};
 return {...defaults,...p.details};
}
export function resolveStyle(d:ProjectDetails){
 const effects=['metal','contour','orbit'] as const;
 const palettes=['indigo','copper','green','mono'] as const;
 return {effect:d.effect==='auto'?effects[d.seed%3]:d.effect,palette:d.palette==='auto'?palettes[Math.floor(d.seed/3)%4]:d.palette};
}
export function validateDetails(value:unknown):ProjectDetails{
 if(!value||typeof value!=='object')throw Error('项目详情格式不正确');const d=value as ProjectDetails;
 for(const [key,max] of [['client',150],['role',150],['duration',100],['challenge',4000],['approach',4000],['outcome',4000]] as const)if(typeof d[key]!=='string'||d[key].length>max)throw Error('请检查项目详情文字长度');
 if(!['auto','metal','contour','orbit','none'].includes(d.effect)||!['auto','indigo','copper','green','mono'].includes(d.palette))throw Error('请选择有效的视觉风格');
 if(!Number.isSafeInteger(d.seed)||d.seed<0||d.seed>999999)throw Error('视觉编号无效');
 if(!Array.isArray(d.gallery)||d.gallery.length>12)throw Error('每个项目最多上传 12 个详情媒体');
 const ids=new Set<string>();
 for(const g of d.gallery){if(!g||typeof g.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(g.id)||ids.has(g.id))throw Error('媒体编号无效');ids.add(g.id);if(typeof g.image!=='string'||!/^\/(images\/[a-zA-Z0-9._-]+|api\/media\/[a-f0-9-]+)$/.test(g.image))throw Error('请使用上传的作品图片或视频');if(g.mediaType!==undefined&&!['image','video'].includes(g.mediaType))throw Error('详情媒体类型无效');if(typeof g.caption!=='string'||g.caption.length>300||!['wide','half'].includes(g.layout))throw Error('媒体说明或布局无效')}
 return {client:d.client,role:d.role,duration:d.duration,challenge:d.challenge,approach:d.approach,outcome:d.outcome,effect:d.effect,palette:d.palette,seed:d.seed,gallery:d.gallery.map(g=>({id:g.id,image:g.image,...(g.mediaType===undefined?{}:{mediaType:g.mediaType}),caption:g.caption,layout:g.layout}))};
}
