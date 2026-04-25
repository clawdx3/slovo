import { translateWithDeepL } from '../utils/deepl-translate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const texts: string[] = body?.texts || []

  if (!texts.length) {
    throw createError({ statusCode: 400, statusMessage: 'No texts to translate' })
  }

  const runtimeConfig = useRuntimeConfig()
  const apiKey = runtimeConfig.deepLApiKey || runtimeConfig.googleTranslateApiKey
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'DEEPL_API_KEY or GOOGLE_TRANSLATE_API_KEY not configured' })
  }

  // Prefer DeepL if key is present, otherwise fall back to Google
  const useDeepL = !!runtimeConfig.deepLApiKey

  try {
    const translations = useDeepL
      ? await translateWithDeepL(texts, apiKey, 'sl', 'en-us')
      : await import('../utils/google-translate').then((m) => m.translateWithGoogle(texts, apiKey, 'sl', 'en'))

    return { translations }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Translation failed' })
  }
})
