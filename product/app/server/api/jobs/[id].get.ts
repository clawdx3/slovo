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

  return {
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    segments: 'segments' in job ? job.segments : undefined,
    outputPath: job.outputPath,
    error: job.error,
  }
})
