import { spawn } from 'node:child_process'
import { writeFile, unlink, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { segmentsToSrt } from './srt'

interface Segment {
  start: number
  end: number
  text: string
}

export interface BurnOptions {
  onProgress?: (progress: number) => void
}

export async function burnSubtitlesToVideo(
  videoPath: string,
  segments: Segment[],
  outputPath: string,
  options: BurnOptions = {},
): Promise<void> {
  const { onProgress } = options

  // Get video duration for progress calculation
  let durationSec = 0
  try {
    const stats = await stat(videoPath)
    if (stats.isFile()) {
      // We'll get duration from ffprobe
      durationSec = await getVideoDuration(videoPath)
    }
  } catch {
    // ignore, will use fallback
  }

  const srtContent = segmentsToSrt(segments)
  const srtPath = outputPath.replace(/\.[^.]+$/, '.srt')

  await writeFile(srtPath, srtContent, 'utf-8')
  console.log('[burn] SRT written to', srtPath, `(${segments.length} segments)`)

  const ffmpegPath = 'ffmpeg'
  const args = [
    '-y',
    '-i', videoPath,
    '-vf', `subtitles=${srtPath}:force_style='FontName=DejaVu Sans,FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=1,MarginV=100,Alignment=2,BorderStyle=3,BackColour=&H80000000'`,
    '-c:a', 'copy',
    '-movflags', '+faststart',
    outputPath,
  ]

  console.log('[burn] Spawning ffmpeg:', ffmpegPath, args.join(' '))

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
    })

    let stderr = ''
    proc.stderr?.on('data', (d) => {
      const chunk = d.toString()
      stderr += chunk
      // Log progress lines (they contain "frame=")
      if (chunk.includes('frame=') || chunk.includes('size=')) {
        console.log('[burn] ffmpeg:', chunk.trim().slice(0, 120))
      }

      // Parse progress from ffmpeg stderr: "out_time_ms=12345"
      if (onProgress && durationSec > 0) {
        const timeMatch = chunk.match(/out_time_ms=(\d+)/)
        if (timeMatch) {
          const currentTimeSec = parseInt(timeMatch[1], 10) / 1_000_000
          const pct = Math.min(100, Math.round((currentTimeSec / durationSec) * 100))
          onProgress(pct)
        }
      }
    })

    proc.on('error', (err) => {
      console.error('[burn] ffmpeg spawn error:', err)
      reject(err)
    })

    proc.on('close', async (code) => {
      console.log('[burn] ffmpeg exited with code', code)

      // Clean up temp SRT
      try {
        await unlink(srtPath)
      } catch {
        /* ignore */
      }

      if (code === 0) {
        onProgress?.(100)
        resolve()
      } else {
        reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`))
      }
    })
  })
}

/**
 * Get video duration in seconds using ffprobe.
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      videoPath,
    ], { stdio: ['ignore', 'pipe', 'pipe'] })

    let stdout = ''
    proc.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString()
    })

    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited ${code}`))
        return
      }
      try {
        const info = JSON.parse(stdout)
        const duration = parseFloat(info?.format?.duration)
        if (isNaN(duration) || duration <= 0) {
          reject(new Error('Could not determine video duration'))
        } else {
          resolve(duration)
        }
      } catch (err) {
        reject(err)
      }
    })
  })
}
