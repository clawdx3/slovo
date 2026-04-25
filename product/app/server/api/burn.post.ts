import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { burnSubtitlesToVideo } from '../utils/burn-subtitles'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { uploadId, segments, language = 'sl' }: {
    uploadId?: string
    segments?: Array<{ start: number; end: number; text: string }>
    language?: 'sl' | 'en'
  } = body || {}

  if (!uploadId || !segments?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing uploadId or segments' })
  }

  const uploadsDir = join(process.cwd(), '.data', 'uploads')
  const videoPath = join(uploadsDir, `${uploadId}.mp4`)
  const outputPath = join(uploadsDir, `${uploadId}_burned_${language}.mp4`)

  try {
    // Verify video exists
    await readFile(videoPath)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Original video not found' })
  }

  try {
    await burnSubtitlesToVideo(videoPath, segments, outputPath)

    // Stream the result back
    const burnedVideo = await readFile(outputPath)

    setHeader(event, 'Content-Type', 'video/mp4')
    setHeader(event, 'Content-Disposition', `attachment; filename="slovo_${language}.mp4"`)
    return burnedVideo
  } catch (err: any) {
    console.error('[burn] ffmpeg error:', err)
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Failed to burn subtitles' })
  }
})
