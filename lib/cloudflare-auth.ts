import 'server-only';
import { headers, cookies } from 'next/headers';
import { createRemoteJWKSet } from 'jose';
import { bindings } from '@/db';
import { verifyAccessToken } from './access-token';

let cached:
  | { issuer: string; keys: ReturnType<typeof createRemoteJWKSet> }
  | undefined;
export async function cloudflareAdmin() {
  const env = bindings();
  const team = env.CF_ACCESS_TEAM_DOMAIN,
    audience = env.CF_ACCESS_AUD,
    email = env.CMS_ADMIN_EMAIL;
  if (
    !team ||
    !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(team) ||
    !audience ||
    !email
  )
    return null;
  const requestHeaders = await headers();
  const token =
    requestHeaders.get('cf-access-jwt-assertion') ||
    (await cookies()).get('CF_Authorization')?.value;
  if (!token) return null;
  try {
    if (!cached || cached.issuer !== team)
      cached = {
        issuer: team,
        keys: createRemoteJWKSet(new URL('/cdn-cgi/access/certs', team)),
      };
    return await verifyAccessToken(
      token,
      { issuer: team, audience, email },
      cached.keys,
    );
  } catch {
    return null;
  }
}
