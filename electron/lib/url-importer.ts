import path from 'path'
import fs from 'fs'
import YTDlpWrapModule from 'yt-dlp-wrap'
import ffmpegStaticPath from 'ffmpeg-static'

// Handle ESM/CJS interop — yt-dlp-wrap may expose constructor as .default
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const YTDlpWrap: typeof YTDlpWrapModule = (YTDlpWrapModule as any).default ?? YTDlpWrapModule

export type SourcePlatform = 'youtube' | 'soundcloud' | 'spotify' | 'applemusic' | 'melon' | 'direct' | 'unknown'

export interface ImportResult {
  filePath: string
  title: string | null
  artist: string | null
  durationMs: number | null
  thumbnailUrl: string | null
  sourcePlatform: SourcePlatform
  sourceUrl: string
}

export interface MetadataOnlyResult {
  title: string | null
  artist: string | null
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
    if (host === 'open.spotify.com') return 'spotify'
    if (host === 'music.apple.com') return 'applemusic'
    if (host === 'www.melon.com' || host === 'melon.com') return 'melon'
    const ext = path.extname(u.pathname).toLowerCase()
    if (['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.opus', '.aac'].includes(ext)) return 'direct'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export function isAudioPlatform(platform: SourcePlatform): boolean {
  return platform === 'youtube' || platform === 'soundcloud' || platform === 'direct'
}

export async function fetchMetadataOnly(url: string): Promise<MetadataOnlyResult> {
  const platform = detectPlatform(url)
  let title: string | null = null
  let artist: string | null = null
  let thumbnailUrl: string | null = null

  // Try oEmbed APIs first
  try {
    if (platform === 'spotify') {
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
      const res = await fetch(oembedUrl)
      if (res.ok) {
        const data = await res.json() as { title?: string; thumbnail_url?: string }
        // Spotify oEmbed title format: "Song Name" or "Song Name by Artist"
        const rawTitle = data.title ?? null
        if (rawTitle && rawTitle.includes(' by ')) {
          const parts = rawTitle.split(' by ')
          title = parts[0].trim()
          artist = parts.slice(1).join(' by ').trim()
        } else {
          title = rawTitle
        }
        thumbnailUrl = data.thumbnail_url ?? null
      }
    } else if (platform === 'applemusic') {
      const oembedUrl = `https://music.apple.com/oembed?url=${encodeURIComponent(url)}`
      const res = await fetch(oembedUrl)
      if (res.ok) {
        const data = await res.json() as { title?: string; thumbnail_url?: string }
        title = data.title ?? null
        thumbnailUrl = data.thumbnail_url ?? null
      }
    }
  } catch {
    // oEmbed failed, will rely on AI enrichment
  }

  return {
    title: title ?? '알 수 없는 곡',
    artist: artist ?? '알 수 없는 아티스트',
    thumbnailUrl,
    sourcePlatform: platform,
    sourceUrl: url,
  }
}

function getYtDlpBinaryPath(): string | undefined {
  // Packaged app: resources/bin/yt-dlp
  if (process.resourcesPath) {
    const bundled = path.join(process.resourcesPath, 'bin', 'yt-dlp')
    if (fs.existsSync(bundled)) return bundled
  }
  // Dev fallback: system paths
  for (const dir of ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin']) {
    const p = path.join(dir, 'yt-dlp')
    if (fs.existsSync(p)) return p
  }
  return undefined
}

function getFfmpegBinaryPath(): string | undefined {
  // 1. ffmpeg-static (fix path for asar.unpacked)
  if (ffmpegStaticPath) {
    const fixed = ffmpegStaticPath.replace('app.asar', 'app.asar.unpacked')
    if (fs.existsSync(fixed)) return fixed
    if (fs.existsSync(ffmpegStaticPath)) return ffmpegStaticPath
  }
  // 2. System fallback (dev brew install)
  for (const dir of ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin']) {
    const p = path.join(dir, 'ffmpeg')
    if (fs.existsSync(p)) return p
  }
  return undefined
}

export async function downloadAudio(
  url: string,
  destDir: string,
  onProgress?: (percent: number) => void,
  quality: import('../lib/settings-store').DownloadQuality = 'best',
): Promise<ImportResult> {
  const platform = detectPlatform(url)

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  const binaryPath = getYtDlpBinaryPath()
  const ytDlp = binaryPath ? new YTDlpWrap(binaryPath) : new YTDlpWrap()
  const ffmpegBin = getFfmpegBinaryPath()
  const ffmpegArgs = ffmpegBin ? ['--ffmpeg-location', ffmpegBin] : []

  // First, get metadata via --dump-json (no download)
  const metaRaw = await ytDlp.execPromise([
    url,
    '--dump-json',
    '--no-playlist',
    ...ffmpegArgs,
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
    const audioQuality = quality === 'best' ? '0' : quality === '192k' ? '192K' : '128K'
    const process = ytDlp.exec([
      url,
      '--no-playlist',
      '-f', 'bestaudio/best',
      '--extract-audio',
      '--audio-format', 'm4a',
      '--audio-quality', audioQuality,
      '-o', outputTemplate,
      ...ffmpegArgs,
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
  const ffmpegBin = getFfmpegBinaryPath()
  const ffmpegArgs = ffmpegBin ? ['--ffmpeg-location', ffmpegBin] : []

  try {
    const raw = await ytDlp.execPromise([
      url,
      '--flat-playlist',
      '--dump-json',
      ...ffmpegArgs,
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
