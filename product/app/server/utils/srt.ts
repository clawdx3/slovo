export function segmentsToSrt(segments: Array<{ start: number; end: number; text: string }>): string {
  const entries: Array<{ start: number; end: number; text: string }> = []

  for (const seg of segments) {
    const chunks = splitText(seg.text, 40)
    if (chunks.length === 1) {
      entries.push({ start: seg.start, end: seg.end, text: chunks[0] })
    } else {
      const totalDuration = seg.end - seg.start
      const totalChars = seg.text.length
      let currentStart = seg.start

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        // Proportional time allocation based on character count
        const chunkDuration = (chunk.length / totalChars) * totalDuration
        const chunkEnd = i === chunks.length - 1 ? seg.end : currentStart + chunkDuration

        entries.push({
          start: currentStart,
          end: chunkEnd,
          text: chunk,
        })
        currentStart = chunkEnd
      }
    }
  }

  return entries
    .map((entry, i) => {
      const start = formatSrtTime(entry.start)
      const end = formatSrtTime(entry.end)
      return `${i + 1}\n${start} --> ${end}\n${entry.text}`
    })
    .join('\n\n')
}

/** Split text into chunks of roughly equal length, preserving whole words. */
function splitText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let current = ''

  for (const word of words) {
    if (!current) {
      current = word
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word
    } else {
      chunks.push(current)
      current = word
    }
  }
  if (current) chunks.push(current)

  return chunks
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}
