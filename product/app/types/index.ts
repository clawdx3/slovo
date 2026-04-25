export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface Job {
  id: string
  type: 'transcribe' | 'burn'
  status: 'pending' | 'extracting_audio' | 'transcribing' | 'burning' | 'completed' | 'failed'
  progress: number
  segments?: TranscriptSegment[]
  outputPath?: string
  error?: string
}
