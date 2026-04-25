export function segmentsToSrt(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((seg, i) => {
      const start = formatSrtTime(seg.start)
      const end = formatSrtTime(seg.end)
      const wrapped = wrapText(seg.text, 30)
      return `${i + 1}\n${start} --> ${end}\n${wrapped}`
    })
    .join('\n\n')
}

/** Word-wrap text to max chars per line. */
function wrapText(text: string, maxChars: number): string {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if (!current) {
      current = word
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  return lines.join('\n')
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}
