import { join } from 'node:path'
import { unlink, stat } from 'node:fs/promises'
import { extractAudio } from '../utils/ffmpeg'
import { transcribeWithGroq } from '../utils/groq'

// In-memory job store (per-process, sufficient for single-instance MVP)
interface Job {
  id: string
  status: 'pending' | 'extracting_audio' | 'transcribing' | 'completed' | 'failed'
  progress: number
  segments?: Array<{ start: number; end: number; text: string }>
  error?: string
}

const jobs = new Map<string, Job>()

// Expose jobs map for the GET endpoint
export const jobStore = jobs

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
  const job: Job = {
    id: uploadId,
    status: 'extracting_audio',
    progress: 0,
  }
  jobs.set(uploadId, job)

  // Process asynchronously — return immediately so frontend can poll
  processJob(uploadId, videoPath, audioPath, runtimeConfig.groqApiKey).catch((err) => {
    console.error('[transcribe] Job failed:', err)
    const j = jobs.get(uploadId)
    if (j) {
      j.status = 'failed'
      j.error = err?.message || 'Processing failed'
    }
  })

  return { id: uploadId, status: 'processing' }
})

async function processJob(
  jobId: string,
  videoPath: string,
  audioPath: string,
  apiKey: string,
): Promise<void> {
  const job = jobs.get(jobId)
  if (!job) return

  // Phase 1: Extract audio
  job.status = 'extracting_audio'
  job.progress = 0

  await extractAudio({
    videoPath,
    audioPath,
    onProgress: (pct) => {
      const j = jobs.get(jobId)
      if (j) j.progress = Math.round(pct * 0.5) // extraction = 0-50%
    },
  })

  // Phase 2: Transcribe with Groq
  job.status = 'transcribing'
  job.progress = 50

  const { segments } = await transcribeWithGroq(audioPath, apiKey)

  job.status = 'completed'
  job.progress = 100
  job.segments = segments

  // Clean up audio temp file (keep video for burn/download)
  try {
    await unlink(audioPath)
  } catch {
    // ignore
  }
}
