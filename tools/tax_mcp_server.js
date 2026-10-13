#!/usr/bin/env node
/**
 * Tax QA MCP Server (Model Context Protocol)
 * Server MCP ẩn phục vụ kiểm thử hệ thống Hỏi - Đáp Thuế TMĐT & Hộ kinh doanh 2026.
 */

const API_URL = process.env.TAX_API_URL || 'https://tax-hkd.pages.dev/api/chat';

const TOOLS = [
  {
    name: 'ask_tax_ai',
    description: 'Hỏi đáp & tư vấn chính sách thuế cho Hộ kinh doanh, Cá nhân kinh doanh, nhà bán hàng TMĐT (TikTok Shop, Shopee, Facebook, kinh doanh truyền thống) tại Việt Nam theo quy định năm 2026. Trả về câu trả lời của AI cùng căn cứ pháp lý, văn bản luật và trích lục RAG.',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Nội dung câu hỏi về thuế cần tư vấn (ví dụ: Bán hàng trên TikTok Shop doanh thu 500 triệu/năm nộp những thuế gì và bao nhiêu %?)'
        },
        history: {
          type: 'array',
          description: 'Lịch sử hội thoại trước đó (tuỳ chọn để test đối thoại nhiều lượt)',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['user', 'assistant'] },
              content: { type: 'string' }
            },
            required: ['role', 'content']
          }
        }
      },
      required: ['question']
    }
  }
];

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

async function handleToolCall(name, args) {
  if (name !== 'ask_tax_ai') {
    throw new Error(`Công cụ không tồn tại: ${name}`);
  }

  const question = args?.question || '';
  if (!question.trim()) {
    throw new Error('Nội dung câu hỏi không được để trống.');
  }

  const history = Array.isArray(args?.history) ? args.history : [];

  const payload = {
    message: question.trim(),
    history: history
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'TaxQA-MCP-TestClient/1.0'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Lỗi máy chủ (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  if (!data.success && data.error) {
    throw new Error(`API trả về lỗi: ${data.error}`);
  }

  const answer = data.response || data.answer || 'Không có câu trả lời.';
  const hasCitations = Array.isArray(data.citations) && data.citations.length > 0;
  if (data.source === 'out_of_scope' || !hasCitations) {
    return answer;
  }
  const citations = data.citations.join(', ');
  const source = data.source || 'RAG Knowledge Engine';
  const evidenceList = Array.isArray(data.retrieval?.evidence)
    ? data.retrieval.evidence.map(e => `• ${e.title} (Điều kiện: ${e.conditional ? 'Có điều kiện' : 'Áp dụng chung'})`).join('\n')
    : 'Không có chứng cứ đối chiếu';

  const output = [
    answer,
    '',
    '----------------------------------------',
    '📊 THÔNG TIN HỆ THỐNG RAG & ĐỐI SOÁT:',
    `• Nguồn xử lý: ${source}`,
    `• Căn cứ pháp lý trích dẫn: ${citations}`,
    '• Đoạn quy định đối chiếu:',
    evidenceList
  ].join('\n');

  return output;
}

let buffer = '';

process.stdin.on('data', async (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let req = null;
    try {
      req = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const { id, method, params } = req;

    try {
      if (method === 'initialize') {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: params?.protocolVersion || '2024-11-05',
            capabilities: {
              tools: { listChanged: false }
            },
            serverInfo: {
              name: 'tax-qa',
              version: '1.0.0'
            }
          }
        });
      } else if (method === 'notifications/initialized' || method === 'initialized') {
        // Notification - no response needed
      } else if (method === 'ping') {
        send({ jsonrpc: '2.0', id, result: {} });
      } else if (method === 'tools/list') {
        send({
          jsonrpc: '2.0',
          id,
          result: { tools: TOOLS }
        });
      } else if (method === 'tools/call') {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        const textResult = await handleToolCall(toolName, toolArgs);

        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: textResult
              }
            ],
            isError: false
          }
        });
      } else if (id !== undefined) {
        send({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method '${method}' not found`
          }
        });
      }
    } catch (err) {
      if (id !== undefined) {
        send({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `[Lỗi thực thi]: ${err.message}`
              }
            ],
            isError: true
          }
        });
      }
    }
  }
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
