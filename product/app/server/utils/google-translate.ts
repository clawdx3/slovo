export async function translateWithGoogle(
  texts: string[],
  apiKey: string,
  source = 'sl',
  target = 'en'
): Promise<string[]> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts,
      source,
      target,
      format: 'text',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Google Translate API error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    data?: { translations?: Array<{ translatedText: string }> }
  }

  if (!data.data?.translations) {
    throw new Error('Invalid Google Translate response')
  }

  return data.data.translations.map((t) => t.translatedText)
}
