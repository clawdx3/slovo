import { writeFile, mkdir, readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { transcribeWithGroq } from '../utils/groq'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'No form data' })
  }

  const videoPart = form.find((p) => p.name === 'video')
  if (!videoPart || !videoPart.data) {
    throw createError({ statusCode: 400, statusMessage: 'No video file' })
  }

  const runtimeConfig = useRuntimeConfig()
  if (!runtimeConfig.groqApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'GROQ_API_KEY not configured' })
  }

  const id = crypto.randomUUID()
  const uploadsDir = join(process.cwd(), '.data', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  const filePath = join(uploadsDir, `${id}.mp4`)

  try {
    await writeFile(filePath, videoPart.data)

    const audioBuffer = await readFile(filePath)
    const { segments } = await transcribeWithGroq(audioBuffer, runtimeConfig.groqApiKey)

    return { segments }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Transcription failed' })
  } finally {
    try {
      await unlink(filePath)
    } catch {
      // ignore cleanup errors
    }
  }
})
