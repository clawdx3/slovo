export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptionJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  segments: TranscriptSegment[] | null
  error: string | null
  createdAt: string
  updatedAt: string
}
