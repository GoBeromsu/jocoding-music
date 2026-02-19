import path from 'path'
import fs from 'fs'
import YTDlpWrapModule from 'yt-dlp-wrap'

// Handle ESM/CJS interop — yt-dlp-wrap may expose constructor as .default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const YTDlpWrap: typeof YTDlpWrapModule = (YTDlpWrapModule as any).default ?? YTDlpWrapModule

export type SourcePlatform = 'youtube' | 'soundcloud' | 'direct' | 'unknown'

export interface ImportResult {
  filePath: string
  title: string | null
  artist: string | null
  durationMs: number | null
  thumbnailUrl: string | null
  sourcePlatform: SourcePlatform
  sourceUrl: string
}

export async function downloadThumbnail(url: string, destPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) return
  const buf = await res.arrayBuffer()
  fs.writeFileSync(destPath, Buffer.from(buf))
}

export function detectPlatform(url: string): SourcePlatform {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')
    if (host === 'youtube.com' || host === 'youtu.be') return 'youtube'
    if (host === 'soundcloud.com') return 'soundcloud'
    const ext = path.extname(u.pathname).toLowerCase()
    if (['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.opus', '.aac'].includes(ext)) return 'direct'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function getYtDlpBinaryPath(): string | undefined {
  if (process.resourcesPath) {
    const bundled = path.join(process.resourcesPath, 'bin', 'yt-dlp')
    if (fs.existsSync(bundled)) return bundled
  }
  return undefined
}

export async function downloadAudio(
  url: string,
  destDir: string,
  onProgress?: (percent: number) => void,
): Promise<ImportResult> {
  const platform = detectPlatform(url)

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  const binaryPath = getYtDlpBinaryPath()
  const ytDlp = binaryPath ? new YTDlpWrap(binaryPath) : new YTDlpWrap()

  // First, get metadata via --dump-json (no download)
  const metaRaw = await ytDlp.execPromise([
    url,
    '--dump-json',
    '--no-playlist',
  ])
  const meta = JSON.parse(metaRaw) as {
    title?: string
    uploader?: string
    artist?: string
    creator?: string
    duration?: number
    thumbnail?: string
    ext?: string
    id?: string
  }

  const title = meta.title ?? null
  const artist = meta.artist ?? meta.creator ?? meta.uploader ?? null
  const durationMs = meta.duration ? Math.round(meta.duration * 1000) : null
  const thumbnailUrl = meta.thumbnail ?? null
  const fileId = meta.id ?? Date.now().toString()
  const outputTemplate = path.join(destDir, `${fileId}.%(ext)s`)

  // Download best audio
  await new Promise<void>((resolve, reject) => {
    const process = ytDlp.exec([
      url,
      '--no-playlist',
      '-f', 'bestaudio/best',
      '--extract-audio',
      '--audio-format', 'm4a',
      '--audio-quality', '0',
      '-o', outputTemplate,
    ])

    process.on('progress', (progress: { percent?: number }) => {
      if (onProgress && progress.percent != null) {
        onProgress(progress.percent)
      }
    })

    process.on('close', () => resolve())
    process.on('error', reject)
  })

  // Find the downloaded file
  const files = fs.readdirSync(destDir).filter(f => f.startsWith(fileId))
  if (files.length === 0) throw new Error('Download completed but file not found')
  const filePath = path.join(destDir, files[0])

  return {
    filePath,
    title,
    artist,
    durationMs,
    thumbnailUrl,
    sourcePlatform: platform,
    sourceUrl: url,
  }
}

export async function extractPlaylistUrls(url: string): Promise<string[]> {
  const binaryPath = getYtDlpBinaryPath()
  const ytDlp = binaryPath ? new YTDlpWrap(binaryPath) : new YTDlpWrap()

  try {
    const raw = await ytDlp.execPromise([
      url,
      '--flat-playlist',
      '--dump-json',
    ])
    // Each line is a JSON object for one playlist entry
    const entries = raw.trim().split('\n').filter(Boolean).map(line => {
      const entry = JSON.parse(line) as { url?: string; webpage_url?: string; id?: string }
      return entry.webpage_url ?? entry.url ?? (entry.id ? `https://www.youtube.com/watch?v=${entry.id}` : null)
    }).filter((u): u is string => u !== null)
    return entries
  } catch {
    // Not a playlist or extraction failed — treat as single URL
    return [url]
  }
}
