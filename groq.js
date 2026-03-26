// lib/groq.js
// Shared Groq client + JSON utilities
// Uses llama-3.1-8b-instant — free, fast, reliable

import Groq from 'groq-sdk'

let _client = null
function getClient() {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY environment variable is not set')
    _client = new Groq({ apiKey })
  }
  return _client
}

// Main call function — returns parsed JSON directly
export async function callGroq(prompt) {
  const client = getClient()

  const completion = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    max_tokens: 4000,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Always respond with valid JSON only. No markdown, no explanation, no code fences. Start your response directly with { and end with }.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content || ''
  return safeParseJSON(raw)
}

// ── Robust JSON parser ────────────────────────────────────────────────────────
export function safeParseJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response from Groq')

  // Strip markdown fences
  raw = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  // Direct parse first
  try { return JSON.parse(raw) } catch (_) {}

  // Find outermost { }
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')

  let s = raw.slice(start, end + 1)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, ' ')

  try { return JSON.parse(s) } catch (_) {}

  // Truncation recovery — find last complete object in prospects/leads array
  const recovered = recoverTruncated(s)
  if (recovered) return recovered

  throw new Error('Could not parse response as JSON. Please try again.')
}

function recoverTruncated(str) {
  let depth = 0, lastClose = -1, inStr = false, esc = false
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (esc)               { esc = false; continue }
    if (c === '\\' && inStr) { esc = true;  continue }
    if (c === '"')         { inStr = !inStr; continue }
    if (inStr)             continue
    if (c === '{')         depth++
    if (c === '}')         { depth--; if (depth === 1) lastClose = i }
  }
  if (lastClose === -1) return null
  try {
    const p = JSON.parse(str.slice(0, lastClose + 1) + ']}')
    if (p.leads?.length || p.prospects?.length) return p
  } catch (_) {}
  return null
}
