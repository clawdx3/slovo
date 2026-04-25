import { createReadStream } from 'node:fs'

export async function transcribeWithGroq(audioPath: string, apiKey: string): Promise<{ segments: Array<{ start: number; end: number; text: string }> }> {
  const formData = new FormData()
  const fileStream = createReadStream(audioPath)
  const blob = new Blob([await streamToBuffer(fileStream)], { type: 'audio/mp4' })
  formData.append('file', blob, 'audio.m4a')
  formData.append('model', 'whisper-large-v3')
  formData.append('response_format', 'verbose_json')
  formData.append('language', 'sl')

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Groq API error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as {
    segments?: Array<{ start: number; end: number; text: string }>
    text?: string
  }

  if (!data.segments || data.segments.length === 0) {
    return {
      segments: data.text ? [{ start: 0, end: 1, text: data.text }] : [],
    }
  }

  return { segments: data.segments }
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}
