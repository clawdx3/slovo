import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f0-9-]+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid upload ID' })
  }

  const filePath = join(process.cwd(), '.data', 'uploads', `${id}.mp4`)

  try {
    await unlink(filePath)
    return { deleted: true }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return { deleted: false, message: 'File already removed' }
    }
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete file' })
  }
})
