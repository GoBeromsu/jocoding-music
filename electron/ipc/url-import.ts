import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { parseFile } from 'music-metadata'
import { libraryStore, type TrackMeta } from '../lib/library-store'
import { downloadAudio, downloadThumbnail, extractPlaylistUrls, fetchMetadataOnly, isAudioPlatform, detectPlatform } from '../lib/url-importer'
import { enrichMusicMetadata } from '../lib/music-agent'
import { settingsStore } from '../lib/settings-store'
import type { ImportUrlResult } from '../../src/types/index'

type ImportStep = 'metadata' | 'downloading' | 'ai-searching' | 'ai-classifying' | 'done' | 'error'
type ImportResultState = 'done' | 'error'

function emitImportStatus(
  win: BrowserWindow | null,
  payload: { trackId: string; step: ImportStep; percent: number; hasAudio?: boolean; message?: string },
) {
  win?.webContents.send('import:status', {
    ...payload,
    phase: payload.step,
  })
}

function emitImportError(win: BrowserWindow | null, data: { trackId: string; message: string }) {
  win?.webContents.send('import:error', data)
}

function buildTrackMeta(params: {
  id: string
  filePath: string
  isImported: boolean
  title: string | null
  artist: string | null
  durationMs: number | null
  sourceUrl: string
  sourcePlatform: string
  hasAudio: boolean
  coverArtPath: string | null
  importStatus: 'enriching' | 'ready' | 'error'
  importError?: string | null
  fileSize?: number | null
  mimeType?: string | null
}) {
  return {
    id: params.id,
    filePath: params.filePath,
    isImported: params.isImported,
    isFavorite: false,
    title: params.title,
    artistName: params.artist,
    albumTitle: null,
    year: null,
    trackNumber: null,
    durationMs: params.durationMs,
    bitrate: null,
    sampleRate: null,
    fileSize: params.fileSize ?? null,
    mimeType: params.mimeType ?? null,
    coverArtPath: params.coverArtPath,
    tags: [],
    hasAudio: params.hasAudio,
    externalLinks: params.sourceUrl,
    isDeleted: false,
    sourceUrl: params.sourceUrl,
    sourcePlatform: params.sourcePlatform,
    genre: null,
    mood: null,
    playCount: 0,
    lastPlayedAt: null,
    dateAdded: Date.now(),
    modifiedAt: Date.now(),
    importStatus: params.importStatus,
    importError: params.importError ?? null,
  }
}

async function enrichTrackMetadata(
  win: BrowserWindow | null,
  trackId: string,
  title: string | null,
  artist: string | null,
  sourceUrl: string,
  sourcePlatform: string,
) : Promise<ImportResultState> {
  const credits = settingsStore.get().credits
  const existing = libraryStore.get(trackId)
  if (!existing) return 'error'

  if (credits <= 0) {
    emitImportStatus(win, {
      trackId,
      step: 'done',
      percent: 100,
      hasAudio: existing.hasAudio,
      message: '크레딧이 부족해 AI 분류를 건너뜁니다.',
    })
    libraryStore.upsert({
      ...existing,
      importStatus: 'ready',
      importError: '크레딧이 부족해 AI 분류를 건너뛰었습니다.',
    })
    return 'done'
  }

  try {
    emitImportStatus(win, {
      trackId,
      step: 'ai-searching',
      percent: 95,
      hasAudio: existing.hasAudio,
    })

    const result = await enrichMusicMetadata({
      title: title ?? 'Unknown',
      artist: artist ?? 'Unknown',
      sourceUrl,
      sourcePlatform,
    })

    emitImportStatus(win, {
      trackId,
      step: 'ai-classifying',
      percent: 100,
      hasAudio: existing.hasAudio,
    })

    const latest = libraryStore.get(trackId)
    if (latest) {
      libraryStore.upsert({
        ...latest,
        artistName: result.performingArtist ?? latest.artistName,
        genre: result.genre,
        mood: result.mood,
        importStatus: 'ready',
        importError: null,
      })
    }

    settingsStore.deductCredit()
    win?.webContents.send('import:enriched', { trackId, result })
    emitImportStatus(win, {
      trackId,
      step: 'done',
      percent: 100,
      hasAudio: latest?.hasAudio ?? true,
    })
    return 'done'
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 분류 실패'
    const current = libraryStore.get(trackId)
    if (current) {
      libraryStore.upsert({
        ...current,
        importStatus: 'error',
        importError: message,
      })
    }

    emitImportStatus(win, {
      trackId,
      step: 'error',
      percent: 100,
      hasAudio: current?.hasAudio ?? true,
      message,
    })
    emitImportError(win, { trackId, message })
    return 'error'
  }
}

async function withCover(coverUrl: string | null, destDir: string): Promise<string | null> {
  if (!coverUrl) return null
  const thumbPath = path.join(destDir, 'thumb.jpg')
  try {
    fs.mkdirSync(destDir, { recursive: true })
    await downloadThumbnail(coverUrl, thumbPath)
    return thumbPath
  } catch {
    return null
  }
}

async function importMetadataOnly(win: BrowserWindow | null, url: string, trackId: string): Promise<ImportUrlResult> {
  emitImportStatus(win, { trackId, step: 'metadata', percent: 10, hasAudio: false })

  const meta = await fetchMetadataOnly(url)
  const coverArtPath = await withCover(meta.thumbnailUrl, libraryStore.getTrackDir(trackId))
  const track: TrackMeta = buildTrackMeta({
    id: trackId,
    filePath: '',
    isImported: true,
    title: meta.title,
    artist: meta.artist,
    durationMs: null,
    sourceUrl: meta.sourceUrl,
    sourcePlatform: meta.sourcePlatform,
    hasAudio: false,
    coverArtPath,
    importStatus: 'enriching',
    fileSize: null,
    mimeType: null,
  })
  libraryStore.upsert(track)

  emitImportStatus(win, { trackId, step: 'metadata', percent: 100, hasAudio: false })
  const enrichResult = await enrichTrackMetadata(win, trackId, meta.title, meta.artist, meta.sourceUrl, meta.sourcePlatform)
  const latestAfterEnrich = libraryStore.get(trackId)
  if (enrichResult === 'error') {
    return {
      trackId,
      title: meta.title,
      artist: meta.artist,
      durationMs: null,
      sourcePlatform: meta.sourcePlatform ?? 'unknown',
      hasAudio: latestAfterEnrich?.hasAudio ?? false,
      importStatus: latestAfterEnrich?.importStatus ?? 'error',
      importError: latestAfterEnrich?.importError ?? 'AI 분류 실패',
    }
  }

  const latest = latestAfterEnrich
  return {
    trackId,
    title: meta.title,
    artist: meta.artist,
    durationMs: null,
    sourcePlatform: meta.sourcePlatform ?? 'unknown',
    hasAudio: latest?.hasAudio ?? false,
    importStatus: latest?.importStatus ?? 'ready',
    importError: latest?.importError ?? null,
  }
}

export function registerUrlImportHandlers(): void {
  ipcMain.handle('track:import-url', async (event, url: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const id = libraryStore.newId()
    const destDir = libraryStore.getTrackDir(id)
    const platform = detectPlatform(url)
    const hasAudioSource = isAudioPlatform(platform)

    emitImportStatus(win, {
      trackId: id,
      step: 'metadata',
      percent: 0,
      hasAudio: hasAudioSource,
    })

    if (!hasAudioSource) {
      try {
        const result = await importMetadataOnly(win, url, id)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import failed'
        const existing = libraryStore.get(id)
        if (existing) {
          libraryStore.upsert({
            ...existing,
            importStatus: 'error',
            importError: message,
          })
        }
        emitImportStatus(win, { trackId: id, step: 'error', percent: 100, hasAudio: false, message })
        emitImportError(win, { trackId: id, message })
        throw err
      }
    }

    emitImportStatus(win, { trackId: id, step: 'downloading', percent: 0, hasAudio: true })
    const quality = settingsStore.get().downloadQuality ?? 'best'

    let imported
    try {
      imported = await downloadAudio(url, destDir, (percent) => {
        emitImportStatus(win, { trackId: id, step: 'downloading', percent, hasAudio: true })
      }, quality)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audio download failed'
      emitImportStatus(win, { trackId: id, step: 'error', percent: 0, hasAudio: false, message })
      emitImportError(win, { trackId: id, message })
      throw err
    }

    let durationMs = imported.durationMs
    let title = imported.title
    let artist = imported.artist

    emitImportStatus(win, { trackId: id, step: 'metadata', percent: 70, hasAudio: true })

    try {
      const meta = await parseFile(imported.filePath, { duration: true })
      title = meta.common.title ?? title
      artist = meta.common.artist ?? artist
      durationMs = meta.format.duration ? Math.round(meta.format.duration * 1000) : durationMs
    } catch (err) {
      console.warn('[import] metadata parse fallback to yt-dlp:', err)
    }

    let coverArtPath: string | null = null
    if (imported.thumbnailUrl) {
      coverArtPath = await withCover(imported.thumbnailUrl, destDir)
    }

    let stat: fs.Stats | null = null
    try {
      stat = fs.statSync(imported.filePath)
    } catch {
      const message = '다운로드한 오디오 파일을 읽을 수 없습니다.'
      emitImportStatus(win, { trackId: id, step: 'error', percent: 100, hasAudio: false, message })
      emitImportError(win, { trackId: id, message })
      throw new Error(message)
    }

    const track: TrackMeta = buildTrackMeta({
      id,
      filePath: imported.filePath,
      isImported: true,
      title,
      artist,
      durationMs,
      sourceUrl: imported.sourceUrl,
      sourcePlatform: imported.sourcePlatform,
      hasAudio: true,
      coverArtPath,
      importStatus: 'enriching',
      fileSize: stat.size,
      mimeType: null,
    })
    libraryStore.upsert(track)

    const enrichResult = await enrichTrackMetadata(win, id, title, artist, imported.sourceUrl, imported.sourcePlatform)
    if (enrichResult === 'error') {
      const current = libraryStore.get(id)
      if (!current) throw new Error('임포트된 트랙 정보를 찾을 수 없습니다.')
      return {
        trackId: id,
        title: current.title,
        artist: current.artistName,
        durationMs: current.durationMs,
        sourcePlatform: current.sourcePlatform ?? 'unknown',
        hasAudio: current.hasAudio ?? true,
        importStatus: current.importStatus ?? 'error',
        importError: current.importError ?? 'AI 분류 실패',
      }
    }

    const latest = libraryStore.get(id)
    return {
      trackId: id,
      title,
      artist,
      durationMs,
      sourcePlatform: imported.sourcePlatform,
      hasAudio: latest?.hasAudio ?? true,
      importStatus: latest?.importStatus ?? 'ready',
      importError: latest?.importError ?? null,
    }
  })

  ipcMain.handle('track:import-playlist', async (event, url: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const urls = await extractPlaylistUrls(url)
    const trackIds: string[] = []

    for (let i = 0; i < urls.length; i++) {
      const id = libraryStore.newId()
      emitImportStatus(win, {
        trackId: id,
        step: 'downloading',
        percent: Math.round((i / Math.max(urls.length, 1)) * 100),
        hasAudio: true,
      })

      try {
        const destDir = libraryStore.getTrackDir(id)
        const quality = settingsStore.get().downloadQuality ?? 'best'
        const imported = await downloadAudio(urls[i], destDir, undefined, quality)

        let coverArtPath: string | null = null
        if (imported.thumbnailUrl) {
          coverArtPath = await withCover(imported.thumbnailUrl, destDir)
        }
        const stat = fs.statSync(imported.filePath)

        const track: TrackMeta = buildTrackMeta({
          id,
          filePath: imported.filePath,
          isImported: true,
          title: imported.title ?? null,
          artist: imported.artist ?? null,
          durationMs: imported.durationMs ?? null,
          sourceUrl: imported.sourceUrl,
          sourcePlatform: imported.sourcePlatform,
          hasAudio: true,
          coverArtPath,
          importStatus: 'enriching',
          fileSize: stat.size,
          mimeType: null,
        })
        libraryStore.upsert(track)
        trackIds.push(id)

    const enrichResult = await enrichTrackMetadata(win, id, imported.title, imported.artist, imported.sourceUrl, imported.sourcePlatform)
    if (enrichResult === 'error') {
      emitImportError(win, {
        trackId: id,
        message: libraryStore.get(id)?.importError ?? 'AI 분류 실패',
      })
    }
      } catch (err) {
        console.error(`[playlist] failed to import ${urls[i]}:`, err)
        const errorMessage = err instanceof Error ? err.message : 'Playlist item import failed'
        emitImportStatus(win, {
          trackId: id,
          step: 'error',
          percent: 100,
          hasAudio: false,
          message: errorMessage,
        })
        emitImportError(win, { trackId: id, message: errorMessage })
      }
    }

    return { trackIds, count: trackIds.length }
  })
}
