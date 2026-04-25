import { spawn } from 'node:child_process'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { segmentsToSrt } from './srt'

interface Segment {
  start: number
  end: number
  text: string
}

export async function burnSubtitlesToVideo(
  videoPath: string,
  segments: Segment[],
  outputPath: string
): Promise<void> {
  const srtContent = segmentsToSrt(segments)
  const srtPath = outputPath.replace(/\.[^.]+$/, '.srt')

  await writeFile(srtPath, srtContent, 'utf-8')
  console.log('[burn] SRT written to', srtPath, `(${segments.length} segments)`)

  const ffmpegPath = 'ffmpeg'
  const args = [
    '-y',
    '-i', videoPath,
    '-vf', `subtitles=${srtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,MarginV=60,Alignment=2,BorderStyle=1'`,
    '-c:a', 'copy',
    '-movflags', '+faststart',
    outputPath,
  ]

  console.log('[burn] Spawning ffmpeg:', ffmpegPath, args.join(' '))

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, {
      stdio: ['ignore', 'ignore', 'pipe']
    })

    let stderr = ''
    proc.stderr?.on('data', (d) => {
      const chunk = d.toString()
      stderr += chunk
      // Log progress lines (they contain "frame=")
      if (chunk.includes('frame=') || chunk.includes('size=')) {
        console.log('[burn] ffmpeg:', chunk.trim().slice(0, 120))
      }
    })

    proc.on('error', (err) => {
      console.error('[burn] ffmpeg spawn error:', err)
      reject(err)
    })

    proc.on('close', async (code) => {
      console.log('[burn] ffmpeg exited with code', code)

      // Clean up temp SRT
      try { await unlink(srtPath) } catch { /* ignore */ }

      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`))
      }
    })
  })
}
