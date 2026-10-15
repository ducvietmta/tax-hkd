import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'node:url'
import fs from 'fs'
import http from 'http'
import {
  checkQuestion,
  buildSecurePrompt,
  validateAnswer,
  refusalText,
  MSG_RATE,
} from './src/services/guard'

function aiChatBridgePlugin() {
  const tokenPath = path.join(process.env.APPDATA || '', 'AI Chat Bridge', 'mcp-token')
  const LOCAL_PORT = 8788

  function getToken(): string {
    try {
      if (fs.existsSync(tokenPath)) {
        const value = fs.readFileSync(tokenPath, 'utf8').trim()
        if (value) return value
      }
    } catch {}
    // Không còn token fallback cứng trong repo (tránh lộ secret).
    // Dev cần cài AI Chat Bridge để ghi mcp-token, hoặc đặt env AI_BRIDGE_TOKEN.
    return (process.env.AI_BRIDGE_TOKEN || '').trim()
  }

  function callMcp(method: string, params: any): Promise<any> {
    const token = getToken()
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      })

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: LOCAL_PORT,
          path: `/private/${token}/mcp`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 120000,
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            try {
              resolve(JSON.parse(data))
            } catch (err) {
              resolve({ raw: data })
            }
          })
        }
      )

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('MCP Bridge timeout'))
      })
      req.write(payload)
      req.end()
    })
  }

  return {
    name: 'ai-chat-bridge-middleware',
    configureServer(server) {
      // 1. Health check endpoint (dev-only)
      server.middlewares.use('/api/bridge-status', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end()
          return
        }

        if (!getToken()) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ connected: false, configured: false }))
          return
        }
        try {
          await callMcp('tools/list', {})
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ connected: true, configured: true }))
        } catch {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ connected: false, configured: true }))
        }
      })

      // 2. Query endpoint – có guardrail bắt buộc phía server
      // Dev-only: middleware này chỉ tồn tại khi `vite dev`, production dùng Worker /api/chat.
      const hits = new Map<string, number[]>()
      // Dọn dẹp định kỳ để Map rate-limit không phình memory khi dev lâu.
      const RATE_WINDOW_MS = 60_000
      setInterval(() => {
        const cutoff = Date.now() - RATE_WINDOW_MS
        for (const [ip, times] of hits) {
          const kept = times.filter((t) => t > cutoff)
          if (kept.length) hits.set(ip, kept)
          else hits.delete(ip)
        }
      }, RATE_WINDOW_MS).unref?.()
      let queue: Promise<unknown> = Promise.resolve()
      const MAX_BODY = 2048
      const RATE_LIMIT = 8 // số câu hỏi / phút / IP

      const sendJson = (res: any, payload: unknown, status = 200) => {
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(payload))
      }
      const blocked = (res: any, message: string, reason: string) =>
        sendJson(res, { success: true, blocked: true, reason, text: refusalText(message) })
      const bridgeUnavailable = (res: any) =>
        sendJson(res, { success: false, error: 'AI Chat Bridge chưa cấu hình (thiếu mcp-token). Production dùng Worker /api/chat.' }, 503)

      server.middlewares.use('/api/bridge-query', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }

        // Không có token -> báo rõ thay vì gọi MCP chắc chắn lỗi.
        if (!getToken()) return bridgeUnavailable(res)

        // Rate limit theo IP
        const ip = req.socket.remoteAddress || 'unknown'
        const now = Date.now()
        const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000)
        if (recent.length >= RATE_LIMIT) {
          return blocked(res, MSG_RATE, 'rate_limit')
        }
        recent.push(now)
        hits.set(ip, recent)

        let body = ''
        let tooBig = false
        req.on('data', (chunk) => {
          body += chunk
          if (body.length > MAX_BODY) {
            tooBig = true
            req.destroy()
          }
        })
        req.on('close', () => {
          if (tooBig && !res.writableEnded) sendJson(res, { success: false, error: 'Payload too large' }, 413)
        })
        req.on('end', async () => {
          try {
            let data: any
            try {
              data = JSON.parse(body)
            } catch {
              return sendJson(res, { success: false, error: 'Bad request' }, 400)
            }

            // Client chỉ được gửi "question" – server tự dựng prompt, không tin prompt từ client
            const check = checkQuestion(data?.question)
            if (!check.ok) {
              return blocked(res, check.message, check.reason)
            }

            // Chỉ cho phép đúng 1 đích AI, không cho client tự chọn
            const target = 'muse'
            const prompt = buildSecurePrompt(check.clean)

            // Hàng đợi tuần tự: bridge chỉ có 1 khung chat
            const job = queue.then(async () => {
              const sendRes = await callMcp('tools/call', {
                name: 'send_message',
                arguments: { target, text: prompt },
              })
              if (sendRes?.error || sendRes?.result?.isError) {
                return { success: false, error: 'Không gửi được câu hỏi', stage: 'send' }
              }

              const waitRes = await callMcp('tools/call', { name: 'wait_response', arguments: {} })
              if (waitRes?.error || waitRes?.result?.isError) {
                return { success: false, error: 'Không nhận được phản hồi', stage: 'wait' }
              }

              let responseText = ''
              const content = waitRes?.result?.content?.[0]?.text
              if (content) {
                try {
                  const parsed = JSON.parse(content)
                  responseText = parsed.text || content
                } catch {
                  responseText = content
                }
              }
              return { success: true, target, text: validateAnswer(responseText), source: 'tax-assistant' }
            })
            queue = job.catch(() => undefined)

            sendJson(res, await job)
          } catch {
            sendJson(res, { success: false, error: 'Lỗi xử lý yêu cầu' })
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    aiChatBridgePlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    watch: {
      ignored: ['**/public/videos/**', '**/.git/**'],
    },
  },
})
