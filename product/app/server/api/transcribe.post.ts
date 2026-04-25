import { join } from 'node:path'
import { unlink, stat } from 'node:fs/promises'
import { extractAudio } from '../utils/ffmpeg'
import { transcribeWithGroq } from '../utils/groq'
import { createJob, updateJob, getJob } from '../utils/jobs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const uploadId = body?.uploadId

  if (!uploadId || typeof uploadId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'uploadId required' })
  }

  const runtimeConfig = useRuntimeConfig()
  if (!runtimeConfig.groqApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'GROQ_API_KEY not configured' })
  }

  const uploadsDir = join(process.cwd(), '.data', 'uploads')
  const videoPath = join(uploadsDir, `${uploadId}.mp4`)
  const audioPath = join(uploadsDir, `${uploadId}.m4a`)

  // Verify video exists
  try {
    await stat(videoPath)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Video not found' })
  }

  // Create job
  createJob({
    id: uploadId,
    type: 'transcribe',
    status: 'pending',
    progress: 0,
  })

  // Process asynchronously — return immediately so frontend can poll
  processJob(uploadId, videoPath, audioPath, runtimeConfig.groqApiKey).catch((err) => {
    console.error('[transcribe] Job failed:', err)
    updateJob(uploadId, {
      status: 'failed',
      error: err?.message || 'Processing failed',
    })
  })

  return { id: uploadId, status: 'processing' }
})

async function processJob(
  jobId: string,
  videoPath: string,
  audioPath: string,
  apiKey: string,
): Promise<void> {
  // Phase 1: Extract audio
  updateJob(jobId, {
    status: 'extracting_audio',
    progress: 0,
  })

  await extractAudio({
    videoPath,
    audioPath,
    onProgress: (pct) => {
      updateJob(jobId, {
        progress: Math.round(pct * 0.5), // extraction = 0-50%
      })
    },
  })

  // Phase 2: Transcribe with Groq
  updateJob(jobId, {
    status: 'transcribing',
    progress: 50,
  })

  const { segments } = await transcribeWithGroq(audioPath, apiKey)

  updateJob(jobId, {
    status: 'completed',
    progress: 100,
    segments,
  })

  // Clean up audio temp file (keep video for burn/download)
  try {
    await unlink(audioPath)
  } catch {
    // ignore
  }
}
