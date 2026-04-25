import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'No form data' })
  }

  const videoPart = form.find((p) => p.name === 'video')
  if (!videoPart || !videoPart.data) {
    throw createError({ statusCode: 400, statusMessage: 'No video file' })
  }

  const id = crypto.randomUUID()
  const uploadsDir = join(process.cwd(), '.data', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  const filePath = join(uploadsDir, `${id}.mp4`)

  await writeFile(filePath, videoPart.data)

  return { uploadId: id }
})
