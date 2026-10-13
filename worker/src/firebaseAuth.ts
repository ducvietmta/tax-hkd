const PROJECT_ID = 'tax-hkd-7a2bb';
const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

interface FirebaseClaims {
  aud: string;
  iss: string;
  sub: string;
  exp: number;
  iat: number;
  auth_time: number;
  phone_number?: string;
  firebase?: { sign_in_provider?: string };
}

function decodeBase64Url(value: string): Uint8Array {
  const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export async function verifiedFirebasePhone(request: Request): Promise<string | null> {
  const match = /^Bearer (\S+)$/i.exec(request.headers.get('Authorization') || '');
  if (!match) return null;

  try {
    const parts = match[1].split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as FirebaseClaims;
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' ||
        claims.aud !== PROJECT_ID || claims.iss !== `https://securetoken.google.com/${PROJECT_ID}` ||
        typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128 ||
        typeof claims.exp !== 'number' || claims.exp <= now ||
        typeof claims.iat !== 'number' || claims.iat > now ||
        typeof claims.auth_time !== 'number' || claims.auth_time > now ||
        claims.firebase?.sign_in_provider !== 'phone' ||
        typeof claims.phone_number !== 'string' || !/^\+84[35789]\d{8}$/.test(claims.phone_number)) return null;

    const response = await fetch(JWK_URL);
    if (!response.ok) return null;
    const jwks = await response.json() as { keys: (JsonWebKey & { kid?: string })[] };
    const jwk = jwks.keys.find((key) => key.kid === header.kid && key.kty === 'RSA');
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64Url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    return valid ? `0${claims.phone_number.slice(3)}` : null;
  } catch {
    return null;
  }
}
