export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptionJob {
  id: string
  status: 'pending' | 'extracting_audio' | 'transcribing' | 'completed' | 'failed'
  progress: number
  segments: TranscriptSegment[] | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface JobStatus {
  id: string
  status: 'pending' | 'extracting_audio' | 'transcribing' | 'completed' | 'failed'
  progress: number
  segments?: TranscriptSegment[]
  error?: string
}
