import type { IncomingMessage } from 'node:http';

const loopback = (ip: string | undefined) => ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

/** The private bridge is a local developer capability, never a LAN/tunnel API. */
export function allowDevBridgeRequest(req: IncomingMessage, requireOrigin: boolean): boolean {
  if (!loopback(req.socket.remoteAddress) || !loopback(req.socket.localAddress)) return false;
  if (req.headers['x-tax-dev-bridge'] !== 'local') return false;
  if (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return false;
  try {
    const host = req.headers.host;
    if (!host || /[\s/@\\?#]/.test(host)) return false;
    const destination = new URL(`http://${host}`);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(destination.hostname)) return false;
    if (Number(destination.port || '80') !== req.socket.localPort) return false;
    const origin = req.headers.origin;
    if (!origin) return !requireOrigin;
    return origin === destination.origin;
  } catch {
    return false;
  }
}
