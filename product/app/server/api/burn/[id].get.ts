import { createReadStream, stat as fsStat } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { getJob } from '../../utils/jobs'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job ID required' })
  }

  const job = getJob(id)
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  if (job.type !== 'burn') {
    throw createError({ statusCode: 400, statusMessage: 'Not a burn job' })
  }

  if (job.status !== 'completed' || !job.outputPath) {
    throw createError({ statusCode: 400, statusMessage: 'Burn not completed' })
  }

  const outputPath = job.outputPath

  // Verify file exists
  let stats: import('node:fs').Stats
  try {
    stats = await new Promise((resolve, reject) => {
      fsStat(outputPath, (err, st) => {
        if (err) reject(err)
        else resolve(st)
      })
    })
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Burned video not found' })
  }

  setHeader(event, 'Content-Type', 'video/mp4')
  setHeader(event, 'Content-Disposition', `attachment; filename="slovo_burned.mp4"`)
  setHeader(event, 'Content-Length', stats.size)

  const stream = createReadStream(outputPath)

  event.node.res.on('finish', () => {
    console.log('[burn-download] Response finished, cleaning up temp file')
    unlink(outputPath).catch(() => {})
  })
  event.node.res.on('close', () => {
    console.log('[burn-download] Response closed, cleaning up temp file')
    unlink(outputPath).catch(() => {})
  })

  return sendStream(event, stream)
})
