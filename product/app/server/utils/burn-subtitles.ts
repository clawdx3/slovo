import { spawn } from 'node:child_process'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { segmentsToSrt } from './srt'

interface Segment {
  start: number
  end: number
  text: string
}

function findFfmpeg(): string {
  try {
    const installer = require('@ffmpeg-installer/ffmpeg')
    if (installer?.path) return installer.path
  } catch { /* ignore */ }
  return 'ffmpeg'
}

export async function burnSubtitlesToVideo(
  videoPath: string,
  segments: Segment[],
  outputPath: string
): Promise<void> {
  const srtContent = segmentsToSrt(segments)
  const srtPath = outputPath.replace(/\.[^.]+$/, '.srt')

  await writeFile(srtPath, srtContent, 'utf-8')

  const ffmpegPath = findFfmpeg()
  const args = [
    '-y',
    '-i', videoPath,
    '-vf', `subtitles=${srtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,MarginV=60,Alignment=2,BorderStyle=1'`,
    '-c:a', 'copy',
    '-movflags', '+faststart',
    outputPath,
  ]

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })

    let stderr = ''
    proc.stderr?.on('data', (d) => { stderr += d.toString() })

    proc.on('error', reject)
    proc.on('close', async (code) => {
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
