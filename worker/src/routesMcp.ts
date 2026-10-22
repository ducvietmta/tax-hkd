/**
 * MCP endpoint cho ChatGPT & MCP clients. Tách từ index.ts.
 * tools/call gọi trực tiếp handleChat (thay vì this.fetch vòng lại).
 */

import { handleChat } from './routeChat';
import { jsonResponse, type Env } from './http';

/** null khi method không được hỗ trợ — router sẽ trả 404. */
export async function handleMcp(
  request: Request, env: Env, ctx: ExecutionContext, corsHeaders: Headers
): Promise<Response | null> {
  if (request.method !== 'GET' && request.method !== 'POST') return null;
  const path = new URL(request.url).pathname;
// 0b. MODEL CONTEXT PROTOCOL (MCP) HTTP ENDPOINT CHO CHATGPT & MCP CLIENTS (GET / POST /mcp & /api/mcp)
  if (path === '/mcp' || path === '/api/mcp') {
    if (request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        name: 'tax-qa-mcp',
        version: '1.0.0',
        description: 'Model Context Protocol (MCP) Server for Vietnam Tax Regulations 2026',
        transport: 'streamable-http',
        tools: ['ask_tax_ai']
      }, 200, corsHeaders);
    }

    if (request.method === 'POST') {
      const r: any = await request.json().catch(() => ({}));
      const rid = r.id;
      const method = r.method;
      const params = r.params || {};

      if (method === 'initialize') {
        return jsonResponse({
          jsonrpc: '2.0',
          id: rid,
          result: {
            protocolVersion: params?.protocolVersion || '2024-11-05',
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'tax-qa-mcp', version: '1.0.0' }
          }
        }, 200, corsHeaders);
      }

      if (method === 'notifications/initialized' || method === 'initialized') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (method === 'ping') {
        return jsonResponse({ jsonrpc: '2.0', id: rid, result: {} }, 200, corsHeaders);
      }

      if (method === 'tools/list') {
        return jsonResponse({
          jsonrpc: '2.0',
          id: rid,
          result: {
            tools: [
              {
                name: 'ask_tax_ai',
                description: 'Tư vấn và hỏi đáp luật thuế Hộ kinh doanh & TMĐT (TikTok Shop, Shopee...) tại Việt Nam theo quy định năm 2026. Trả về phân tích chi tiết, số thuế phải nộp, thuế suất và căn cứ pháp lý đối soát.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    question: {
                      type: 'string',
                      description: 'Nội dung câu hỏi về thuế (ví dụ: Bán hàng trên TikTok Shop doanh thu 600 triệu/năm nộp những thuế gì và bao nhiêu %?)'
                    },
                    history: {
                      type: 'array',
                      description: 'Lịch sử hội thoại nếu muốn câu trả lời theo ngữ cảnh giống web; bỏ trống để hỏi độc lập.',
                      items: {
                        type: 'object',
                        properties: { role: { type: 'string', enum: ['user', 'assistant'] }, content: { type: 'string' } },
                        required: ['role', 'content']
                      }
                    }
                  },
                  required: ['question']
                }
              }
            ]
          }
        }, 200, corsHeaders);
      }

      if (method === 'tools/call') {
        const toolArgs = params?.arguments || {};
        const question = (toolArgs.question || toolArgs.message || '').trim();

        if (!question) {
          return jsonResponse({
            jsonrpc: '2.0',
            id: rid,
            result: {
              content: [{ type: 'text', text: 'Vui lòng cung cấp nội dung câu hỏi về thuế.' }],
              isError: true
            }
          }, 200, corsHeaders);
        }

        if (question.length > 50000) {
          return jsonResponse({
            jsonrpc: '2.0',
            id: rid,
            result: {
              content: [{ type: 'text', text: 'Nội dung câu hỏi quá dài (tối đa 50.000 ký tự).' }],
              isError: true
            }
          }, 200, corsHeaders);
        }

        try {
          const chatRes = await handleChat(
            new Request('https://tax-hkd.internal/api/chatgpt/tax-qa', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Internal-Caller': 'mcp',
                'CF-Connecting-IP': request.headers.get('CF-Connecting-IP') || 'unknown'
              },
              body: JSON.stringify({ message: question, history: toolArgs.history || [] })
            }),
            env,
            ctx,
            corsHeaders,
            undefined,
            'connector'
          );

          const chatData: any = await chatRes.json();
          if (!chatRes.ok || !chatData.success) {
            return jsonResponse({
              jsonrpc: '2.0',
              id: rid,
              result: {
                content: [{ type: 'text', text: chatData.error || 'Lỗi khi xử lý câu hỏi tư vấn thuế.' }],
                isError: true
              }
            }, 200, corsHeaders);
          }

          const answerText = chatData.answer || chatData.response || 'Không tìm thấy câu trả lời phù hợp.';
          return jsonResponse({
            jsonrpc: '2.0',
            id: rid,
            result: {
              content: [{ type: 'text', text: answerText }],
              structuredContent: {
                answer: answerText,
                citations: chatData.citations || chatData.legal_citations || [],
                source: chatData.source,
                retrieval: chatData.retrieval || null,
              },
              isError: false
            }
          }, 200, corsHeaders);
        } catch (callErr: any) {
          return jsonResponse({
            jsonrpc: '2.0',
            id: rid,
            result: {
              content: [{ type: 'text', text: `Lỗi xử lý câu hỏi: ${callErr.message}` }],
              isError: true
            }
          }, 200, corsHeaders);
        }
      }

      return jsonResponse({
        jsonrpc: '2.0',
        id: rid,
        error: { code: -32601, message: `Method '${method}' not found` }
      }, 200, corsHeaders);
    }
  }
  return null;
}
