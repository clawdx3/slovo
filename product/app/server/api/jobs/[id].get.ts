export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job ID required' })
  }

  // For direct transcription (no queue), jobs are not stored.
  // This endpoint returns 404 to indicate the job model is not used in MVP.
  throw createError({ statusCode: 404, statusMessage: 'Job not found' })
})
