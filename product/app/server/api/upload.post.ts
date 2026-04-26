import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const form = await readFormData(event)

  const videoFile = form.get('video') as File | null
  if (!videoFile || videoFile.size === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No video file' })
  }

  const id = crypto.randomUUID()
  const uploadsDir = join(process.cwd(), '.data', 'uploads')
  mkdirSync(uploadsDir, { recursive: true })
  const filePath = join(uploadsDir, `${id}.mp4`)

  const buf = Buffer.from(await videoFile.arrayBuffer())
  writeFileSync(filePath, buf)

  return { uploadId: id }
})
