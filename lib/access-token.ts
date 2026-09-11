import { jwtVerify, type JWTVerifyGetKey } from 'jose';

export async function verifyAccessToken(
  token: string,
  config: { issuer: string; audience: string; email: string },
  keys: JWTVerifyGetKey,
) {
  const { payload } = await jwtVerify(token, keys, {
    issuer: config.issuer,
    audience: config.audience,
    algorithms: ['RS256'],
    requiredClaims: ['exp', 'iat', 'sub', 'email'],
    clockTolerance: 5,
  });
  if (
    typeof payload.email !== 'string' ||
    payload.email.toLowerCase() !== config.email.toLowerCase()
  )
    throw Error('Account is not authorized');
  return {
    userId: payload.sub!,
    email: payload.email,
    displayName: payload.email,
    fullName: null,
  };
}
