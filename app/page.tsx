import {readContent} from '@/db';
import Portfolio from './portfolio-view';
export const dynamic='force-dynamic';
export async function generateMetadata(){const {content}=await readContent();return {title:`${content.name} — ${content.role}`,description:content.tagline}}
export default async function Home(){const {content}=await readContent();return <Portfolio content={content}/>;}
