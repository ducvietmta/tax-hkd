import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { verifiedFirebasePhone } from '../worker/src/firebaseAuth.ts';

const originalFetch = globalThis.fetch;
const keyPair = await webcrypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
);
const jwk = { ...await webcrypto.subtle.exportKey('jwk', keyPair.publicKey), kid: 'test-key' };
globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });

const base64url = (value) => Buffer.from(value).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const claims = {
  aud: 'tax-hkd',
  iss: 'https://securetoken.google.com/tax-hkd',
  sub: 'firebase-user',
  exp: now + 3600,
  iat: now - 5,
  auth_time: now - 5,
  phone_number: '+84988123456',
  firebase: { sign_in_provider: 'phone' },
};

async function tokenFor(payload) {
  const content = `${base64url(JSON.stringify({ alg: 'RS256', kid: 'test-key' }))}.${base64url(JSON.stringify(payload))}`;
  const signature = await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, Buffer.from(content));
  return `${content}.${base64url(signature)}`;
}

try {
  const token = await tokenFor(claims);
  assert.equal(await verifiedFirebasePhone(new Request('https://example.com', { headers: { Authorization: `Bearer ${token}` } })), '0988123456');
  assert.equal(await verifiedFirebasePhone(new Request('https://example.com')), null);
  assert.equal(await verifiedFirebasePhone(new Request('https://example.com', { headers: { Authorization: `Bearer ${token.slice(0, -2)}xx` } })), null);
  assert.equal(await verifiedFirebasePhone(new Request('https://example.com', { headers: { Authorization: `Bearer ${await tokenFor({ ...claims, exp: now - 1 })}` } })), null);
  assert.equal(await verifiedFirebasePhone(new Request('https://example.com', { headers: { Authorization: `Bearer ${await tokenFor({ ...claims, aud: 'another-project' })}` } })), null);
  console.log('Firebase token verification checks passed');
} finally {
  globalThis.fetch = originalFetch;
}
