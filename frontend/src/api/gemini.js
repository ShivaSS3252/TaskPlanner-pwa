// src/api/gemini.js
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

export const breakdownTask = async (taskText) => {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

  // Try JSON array parse first
  const arrayMatch = text.match(/\[[\s\S]*?\]/)
  if (arrayMatch) {
    const parsed = JSON.parse(arrayMatch[0])
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  }

  // Fallback: numbered list parsing
  const lines = text.split('\n')
    .map((l) => l.replace(/^[\d\-\*\•]+[\.\)]\s*/, '').trim())
    .filter((l) => l.length > 3)
  if (lines.length > 0) return lines.slice(0, 5)

  throw new Error('Could not parse subtasks from response')
}
