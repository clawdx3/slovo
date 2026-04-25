import { jobStore } from '../transcribe.post'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job ID required' })
  }

  const job = jobStore.get(id)
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }

  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    segments: job.segments,
    error: job.error,
  }
})
