import type { Job } from '~/types'

const jobs = new Map<string, Job>()

export const jobStore = jobs

export function createJob(job: Job): void {
  jobs.set(job.id, job)
}

export function updateJob(id: string, updates: Partial<Job>): Job | undefined {
  const job = jobs.get(id)
  if (!job) return undefined
  const updated = { ...job, ...updates }
  jobs.set(id, updated)
  return updated
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id)
}

export function deleteJob(id: string): boolean {
  return jobs.delete(id)
}
