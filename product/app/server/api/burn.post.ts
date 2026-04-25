import { access, mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { burnSubtitlesToVideo } from '../utils/burn-subtitles'
import { createJob, updateJob } from '../utils/jobs'

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
  const burnedDir = join(process.cwd(), '.data', 'burned')
  const videoPath = join(uploadsDir, `${uploadId}.mp4`)

  try {
    await access(videoPath)
    console.log('[burn] Video found:', videoPath)
  } catch {
    console.log('[burn] Video NOT found:', videoPath)
    throw createError({ statusCode: 404, statusMessage: 'Original video not found' })
  }

  const jobId = `${uploadId}_burn_${language}`
  const outputPath = join(burnedDir, `${jobId}.mp4`)

  // Ensure burned directory exists
  try {
    await mkdir(burnedDir, { recursive: true })
  } catch {
    // ignore
  }

  // Create job
  createJob({
    id: jobId,
    type: 'burn',
    status: 'burning',
    progress: 0,
    outputPath,
  })

  // Process asynchronously — return immediately so frontend can poll
  processBurn(jobId, videoPath, segments, outputPath).catch((err) => {
    console.error('[burn] Job failed:', err)
    updateJob(jobId, {
      status: 'failed',
      error: err?.message || 'Burning failed',
    })
    // Clean up partial output
    try {
      unlink(outputPath).catch(() => {})
    } catch {
      // ignore
    }
  })

  return { jobId, status: 'burning' }
})

async function processBurn(
  jobId: string,
  videoPath: string,
  segments: Array<{ start: number; end: number; text: string }>,
  outputPath: string,
): Promise<void> {
  try {
    await burnSubtitlesToVideo(videoPath, segments, outputPath, {
      onProgress: (pct: number) => {
        updateJob(jobId, {
          progress: Math.round(pct),
        })
      },
    })

    updateJob(jobId, {
      status: 'completed',
      progress: 100,
    })
  } catch (err: any) {
    updateJob(jobId, {
      status: 'failed',
      error: err?.message || 'Burning failed',
    })
    throw err
  }
}
