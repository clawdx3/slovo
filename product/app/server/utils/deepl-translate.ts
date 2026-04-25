const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'
const SPLIT_DELIMITER = ' |||SEG||| '

export async function translateWithDeepL(
  texts: string[],
  apiKey: string,
  source = 'SL',
  target = 'EN-US'
): Promise<string[]> {
  if (!texts.length) return []

  // Join all segments with a delimiter so DeepL translates the full context
  // as one coherent body of text, then split back into segments.
  const joinedText = texts.join(SPLIT_DELIMITER)

  const res = await fetch(DEEPL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
    },
    body: new URLSearchParams({
      text: joinedText,
      source_lang: source.toUpperCase(),
      target_lang: target.toUpperCase(),
      split_sentences: '0',
      preserve_formatting: '1',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`DeepL API error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    translations?: Array<{ text: string; detected_source_language?: string }>
  }

  if (!data.translations?.length) {
    throw new Error('Invalid DeepL response')
  }

  // Split the translated text back into segments
  const translatedJoined = data.translations[0].text
  const translatedTexts = translatedJoined.split(SPLIT_DELIMITER).map((t) => t.trim())

  // If DeepL didn't preserve all delimiters (possible with smart translation),
  // fall back to per-segment translation
  if (translatedTexts.length !== texts.length) {
    return translateWithDeepLSegmented(texts, apiKey, source, target)
  }

  return translatedTexts
}

async function translateWithDeepLSegmented(
  texts: string[],
  apiKey: string,
  source: string,
  target: string
): Promise<string[]> {
  // Fallback: translate each segment individually (still uses DeepL, just less context)
  const res = await fetch(DEEPL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
    },
    body: new URLSearchParams(
      texts.flatMap((text) => [['text', text]])
        .concat([
          ['source_lang', source.toUpperCase()],
          ['target_lang', target.toUpperCase()],
          ['preserve_formatting', '1'],
        ])
    ),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`DeepL API error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    translations?: Array<{ text: string }>
  }

  if (!data.translations?.length) {
    throw new Error('Invalid DeepL response')
  }

  return data.translations.map((t) => t.text)
}
