const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const SPLIT_DELIMITER = ' |||SEG||| '

export async function translateWithGroq(
  texts: string[],
  apiKey: string,
): Promise<string[]> {
  if (!texts.length) return []

  // Join all segments with a delimiter
  const joinedText = texts.join(SPLIT_DELIMITER)

  const systemPrompt = `You are a professional Slovene-to-English translator specializing in rural/agricultural content and informal spoken Slovene.

RULES:
- Translate the full text as one coherent narrative, preserving context across all segments
- Maintain informal tone — the source is casual spoken Slovene (e.g., "še" = "still/too", "zdaj" = "now")
- Use natural English phrasing for agricultural context (sheep, shearing, pastures, etc.)
- Return ONLY the translated text, with segments separated by: ${SPLIT_DELIMITER}
- Do NOT add any explanations, notes, or formatting beyond the delimiters
- Keep the same number of segments as the input`

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: joinedText },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Groq API error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const translatedJoined = data.choices?.[0]?.message?.content?.trim()
  if (!translatedJoined) {
    throw new Error('Empty Groq response')
  }

  // Split back into segments
  const translatedTexts = translatedJoined.split(SPLIT_DELIMITER).map((t) => t.trim())

  // Sanity check: if segment count mismatch, fall back to individual translations
  if (translatedTexts.length !== texts.length) {
    // Try with a more explicit prompt for segment preservation
    return translateWithGroqSegmented(texts, apiKey)
  }

  return translatedTexts
}

async function translateWithGroqSegmented(
  texts: string[],
  apiKey: string,
): Promise<string[]> {
  const systemPrompt = `You are a professional Slovene-to-English translator. Translate each segment naturally. Return ONLY the translations, one per line, in the same order.`

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: texts.map((t, i) => `${i + 1}. ${t}`).join('\n') },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Groq API error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content?.trim() || ''
  const lines = content
    .split('\n')
    .map((l) => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)

  if (lines.length !== texts.length) {
    throw new Error(`Groq returned ${lines.length} lines for ${texts.length} segments`)
  }

  return lines
}
