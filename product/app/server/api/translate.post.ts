import { translateWithGroq } from '../utils/groq-translate'
import { translateWithDeepL } from '../utils/deepl-translate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const texts: string[] = body?.texts || []

  if (!texts.length) {
    throw createError({ statusCode: 400, statusMessage: 'No texts to translate' })
  }

  const runtimeConfig = useRuntimeConfig()
  const apiKey = runtimeConfig.groqApiKey || runtimeConfig.deepLApiKey || runtimeConfig.googleTranslateApiKey
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'GROQ_API_KEY or translation API key not configured' })
  }

  // Priority: Groq (best context) > DeepL (good quality) > Google (fallback)
  const useGroq = !!runtimeConfig.groqApiKey
  const useDeepL = !useGroq && !!runtimeConfig.deepLApiKey

  try {
    let translations: string[]

    if (useGroq) {
      translations = await translateWithGroq(texts, apiKey)
    } else if (useDeepL) {
      translations = await translateWithDeepL(texts, apiKey, 'sl', 'en-us')
    } else {
      translations = await import('../utils/google-translate').then((m) => m.translateWithGoogle(texts, apiKey, 'sl', 'en'))
    }

    return { translations }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Translation failed' })
  }
})
