import type { Env } from './http';
/** Privileged admission requires a server-side secret, never a client-supplied role. */
export async function hasMcpTestAccess(request:Request,env:Env):Promise<boolean>{
 if(!env.MCP_TEST_API_KEY || env.MCP_TEST_API_KEY.length<32)return false;
 const supplied=/^Bearer (\S+)$/i.exec(request.headers.get('Authorization')||'')?.[1];
 if(!supplied||supplied.length>512)return false;
 const digest=(value:string)=>crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 const [a,b]=await Promise.all([digest(supplied),digest(env.MCP_TEST_API_KEY)]);
 const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;
}
