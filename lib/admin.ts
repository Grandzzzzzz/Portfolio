import 'server-only';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { bindings } from '@/db';
import { cloudflareAdmin } from './cloudflare-auth';
import {netlifyAdmin} from './netlify-auth';
export function isNetlifyHost(){return (bindings().PORTFOLIO_HOST as string)==='netlify'}
export function isLocalHost(){return (bindings().PORTFOLIO_HOST as string)==='local'}
export function isCloudflareHost() {
  return bindings().PORTFOLIO_HOST === 'cloudflare';
}
export async function getAdminSession() {
  return isLocalHost() ? { userId: 'local', email: 'local@localhost', displayName: 'Local admin', fullName: 'Local admin' } : isNetlifyHost()?netlifyAdmin():isCloudflareHost() ? cloudflareAdmin() : getChatGPTUser();
}
export async function isAdmin() {
  const user = await getAdminSession();
  if (!user) return false;
  if (isLocalHost()) return true;
  if (isCloudflareHost()||isNetlifyHost()) return true;
  if (process.env.NODE_ENV === 'development' && user.userId === 'local_seedy')
    return true;
  const owner = bindings().CMS_ADMIN_USER_ID;
  return Boolean(owner && user.userId === owner);
}
export async function protectWrite(request: Request) {
  if (!(await isAdmin()))
    return Response.json({ error: '请先登录管理员账号' }, { status: 403 });
  const origin = request.headers.get('origin');
  if (
    origin !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return Response.json({ error: '请求来源无效' }, { status: 403 });
  return null;
}
