import { createReadStream } from 'node:fs'
import { access, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { burnSubtitlesToVideo } from '../utils/burn-subtitles'

export default defineEventHandler(async (event) => {
  console.log('[burn] ========== REQUEST START ==========')
  
  const body = await readBody(event)
  console.log('[burn] Body parsed:', { uploadId: body?.uploadId, segmentsCount: body?.segments?.length })

  const { uploadId, segments, language = 'sl' }: {
    uploadId?: string
    segments?: Array<{ start: number; end: number; text: string }>
    language?: 'sl' | 'en'
  } = body || {}

  if (!uploadId || !segments?.length) {
    console.log('[burn] Validation failed — missing uploadId or segments')
    throw createError({ statusCode: 400, statusMessage: 'Missing uploadId or segments' })
  }

  const uploadsDir = join(process.cwd(), '.data', 'uploads')
  const videoPath = join(uploadsDir, `${uploadId}.mp4`)
  const outputPath = join(uploadsDir, `${uploadId}_burned_${language}.mp4`)

  try {
    await access(videoPath)
    console.log('[burn] Video found:', videoPath)
  } catch {
    console.log('[burn] Video NOT found:', videoPath)
    throw createError({ statusCode: 404, statusMessage: 'Original video not found' })
  }

  try {
    console.log('[burn] Starting ffmpeg...')
    await burnSubtitlesToVideo(videoPath, segments, outputPath)
    console.log('[burn] ffmpeg completed successfully')

    const stats = await new Promise<import('node:fs').Stats>((resolve, reject) => {
      const fs = require('node:fs')
      fs.stat(outputPath, (err: any, st: import('node:fs').Stats) => {
        if (err) reject(err)
        else resolve(st)
      })
    })
    console.log('[burn] Output file size:', stats.size, 'bytes')

    setHeader(event, 'Content-Type', 'video/mp4')
    setHeader(event, 'Content-Disposition', `attachment; filename="slovo_${language}.mp4"`)
    setHeader(event, 'Content-Length', String(stats.size))

    const stream = createReadStream(outputPath)
    
    event.node.res.on('finish', () => {
      console.log('[burn] Response finished, cleaning up temp file')
      unlink(outputPath).catch(() => {})
    })
    event.node.res.on('close', () => {
      console.log('[burn] Response closed, cleaning up temp file')
      unlink(outputPath).catch(() => {})
    })

    console.log('[burn] Starting stream...')
    return sendStream(event, stream)
  } catch (err: any) {
    console.error('[burn] ERROR:', err)
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Failed to burn subtitles' })
  }
})
