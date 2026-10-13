// Cloudflare Pages Functions Catch-all Router
// Map toàn bộ request /api/* vào Worker handler
import workerHandler, { Env } from '../../worker/src/index';

export const onRequest: PagesFunction<Env> = async (context) => {
  return workerHandler.fetch(context.request, context.env, {
    waitUntil: (promise: Promise<any>) => context.waitUntil(promise),
    passThroughOnException: () => context.passThroughOnException(),
  } as ExecutionContext);
};
