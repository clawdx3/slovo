import { translateWithGoogle } from '../utils/google-translate'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const texts: string[] = body?.texts || []

  if (!texts.length) {
    throw createError({ statusCode: 400, statusMessage: 'No texts to translate' })
  }

  const runtimeConfig = useRuntimeConfig()
  if (!runtimeConfig.googleTranslateApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'GOOGLE_TRANSLATE_API_KEY not configured' })
  }

  try {
    const translations = await translateWithGoogle(
      texts,
      runtimeConfig.googleTranslateApiKey,
      'sl',
      'en'
    )

    return { translations }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Translation failed' })
  }
})
