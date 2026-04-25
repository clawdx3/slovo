import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'

export interface ExtractAudioOptions {
  videoPath: string
  audioPath: string
  onProgress?: (progress: number) => void
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
    proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })

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

/**
 * Extract audio from a video file using ffmpeg.
 * First tries stream copy (-acodec copy), falls back to AAC re-encode.
 * Reports progress via onProgress callback (0-100).
 */
export async function extractAudio(options: ExtractAudioOptions): Promise<void> {
  const { videoPath, audioPath, onProgress } = options

  let durationSec: number
  try {
    durationSec = await getVideoDuration(videoPath)
  } catch {
    durationSec = 0
  }

  // Try stream copy first (fast, no re-encode)
  try {
    await runFfmpegExtract(videoPath, audioPath, ['-vn', '-acodec', 'copy'], durationSec, onProgress)
    // Verify output exists and has content
    const st = await stat(audioPath)
    if (st.size > 0) return
  } catch {
    // Stream copy failed (e.g. no compatible audio stream), fall through to re-encode
  }

  // Fallback: re-encode to AAC 128k
  await runFfmpegExtract(videoPath, audioPath, ['-vn', '-acodec', 'aac', '-b:a', '128k'], durationSec, onProgress)
}

/**
 * Compress an audio file to fit within Groq's 25MB limit.
 * Re-encodes at 64kbps AAC.
 */
export async function compressAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['-y', '-i', inputPath, '-vn', '-acodec', 'aac', '-b:a', '64k', outputPath]
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] })

    let stderr = ''
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('error', (err) => reject(new Error(`ffmpeg spawn error: ${err.message}`)))
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`))
    })
  })
}

function runFfmpegExtract(
  videoPath: string,
  audioPath: string,
  codecArgs: string[],
  durationSec: number,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', videoPath,
      ...codecArgs,
      audioPath,
    ]

    const proc = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stderr = ''

    proc.stderr?.on('data', (d: Buffer) => {
      const chunk = d.toString()
      stderr += chunk

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
      reject(new Error(`ffmpeg spawn error: ${err.message}`))
    })

    proc.on('close', (code) => {
      if (code === 0) {
        onProgress?.(100)
        resolve()
      } else {
        reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`))
      }
    })
  })
}