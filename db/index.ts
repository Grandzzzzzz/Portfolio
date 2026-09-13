import 'server-only';
import { env } from 'cloudflare:workers';
import { defaultContent, type Content, validateContent } from '@/lib/content';
export function bindings() {
  return env as unknown as {
    DB: D1Database;
    MEDIA: R2Bucket;
    CMS_ADMIN_USER_ID?: string;
    PORTFOLIO_HOST?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
    CMS_ADMIN_EMAIL?: string;
  };
}
export async function readContent() {
  const row = await bindings()
    .DB.prepare(
      'SELECT content, version, updated_at FROM site_content WHERE id = 1',
    )
    .first<{ content: string; version: number; updated_at: string }>();
  return row
    ? {
        content: validateContent(JSON.parse(row.content)),
        version: row.version,
        updatedAt: row.updated_at,
      }
    : { content: validateContent(defaultContent), version: 0, updatedAt: null };
}

export async function writeContent(content:Content,version:number){
 const updatedAt=new Date().toISOString();
 const row=await bindings().DB.prepare('INSERT INTO site_content (id, content, version, updated_at) SELECT 1, ?, 1, ? WHERE ? = 0 OR EXISTS (SELECT 1 FROM site_content WHERE id = 1) ON CONFLICT(id) DO UPDATE SET content = excluded.content, version = site_content.version + 1, updated_at = excluded.updated_at WHERE site_content.version = ? RETURNING version').bind(JSON.stringify(content),updatedAt,version,version).first<{version:number}>();
 return row?{content,version:row.version,updatedAt}:null;
}
