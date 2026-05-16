// src/api/gemini.js — uses Groq (free, 14,400 req/day)
const API_KEY = import.meta.env.VITE_GROQ_API_KEY
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export const breakdownTask = async (taskText) => {
  if (!API_KEY || API_KEY === 'your_groq_api_key_here') {
    throw new Error('NO_KEY')
  }

  const prompt = `Break down this task into 3 to 5 clear, specific, actionable subtasks:

Task: "${taskText}"

Rules:
- Each subtask must be a concrete action, not vague
- Keep each subtask short (under 10 words)
- Return ONLY a JSON array of strings, nothing else

Example output: ["Research top 5 competitors", "List their key features", "Note pricing differences", "Write comparison summary"]`

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim() || ''

  const arrayMatch = text.match(/\[[\s\S]*?\]/)
  if (arrayMatch) {
    const parsed = JSON.parse(arrayMatch[0])
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  }

  const lines = text.split('\n')
    .map((l) => l.replace(/^[\d\-\*\•]+[\.\)]\s*/, '').trim())
    .filter((l) => l.length > 3)
  if (lines.length > 0) return lines.slice(0, 5)

  throw new Error('Could not parse subtasks from response')
}
