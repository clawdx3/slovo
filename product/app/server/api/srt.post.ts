import { segmentsToSrt } from '../utils/srt'

export default defineEventHandler(async (event) => {
  const { segments } = await readBody(event)

  if (!Array.isArray(segments) || segments.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No segments provided' })
  }

  const srt = segmentsToSrt(segments)
  return { srt }
})
