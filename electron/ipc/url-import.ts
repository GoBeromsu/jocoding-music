import { ipcMain, BrowserWindow } from 'electron'
import fs from 'fs'
import { parseFile } from 'music-metadata'
import { libraryStore, type TrackMeta } from '../lib/library-store'
import { downloadAudio } from '../lib/url-importer'
import { enrichMusicMetadata } from '../lib/music-agent'

export function registerUrlImportHandlers(): void {
  ipcMain.handle('track:import-url', async (event, url: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)

    // Generate ID upfront so we can set the dest dir
    const id = libraryStore.newId()
    const destDir = libraryStore.getTrackDir(id)

    // 1. Download audio
    win?.webContents.send('import:status', { step: 'downloading', percent: 0 })

    const imported = await downloadAudio(url, destDir, (percent) => {
      win?.webContents.send('import:status', { step: 'downloading', percent })
    })

    // 2. Parse audio metadata from file
    let durationMs = imported.durationMs
    let title = imported.title
    let artist = imported.artist

    try {
      const meta = await parseFile(imported.filePath, { duration: true })
      title = meta.common.title ?? title
      artist = meta.common.artist ?? artist
      durationMs = meta.format.duration ? Math.round(meta.format.duration * 1000) : durationMs
    } catch { /* keep yt-dlp metadata */ }

    // 3. Get file size
    const stat = fs.statSync(imported.filePath)

    // 4. Upsert track into store
    const track: TrackMeta = {
      id,
      filePath: imported.filePath,
      isImported: true,
      title: title ?? null,
      artistName: artist ?? null,
      albumTitle: null,
      year: null,
      trackNumber: null,
      durationMs: durationMs ?? null,
      bitrate: null,
      sampleRate: null,
      fileSize: stat.size,
      mimeType: null,
      coverArtPath: null,
      tags: [],
      isDeleted: false,
      sourceUrl: imported.sourceUrl,
      sourcePlatform: imported.sourcePlatform,
      originalArtist: null,
      isCover: null,
      platformLinks: [],
      playCount: 0,
      lastPlayedAt: null,
      dateAdded: Date.now(),
      modifiedAt: Date.now(),
    }

    libraryStore.upsert(track)

    win?.webContents.send('import:status', { step: 'analyzing', percent: 100 })

    // 5. Enrich with OpenAI agent (async — push result when done)
    enrichMusicMetadata({
      title: title ?? 'Unknown',
      artist: artist ?? 'Unknown',
      sourceUrl: imported.sourceUrl,
      sourcePlatform: imported.sourcePlatform,
    }).then((result) => {
      const existing = libraryStore.get(id)
      if (existing) {
        libraryStore.upsert({
          ...existing,
          originalArtist: result.originalArtist,
          isCover: result.isCover,
          platformLinks: result.platformLinks,
        })
      }

      win?.webContents.send('import:enriched', { trackId: id, result })
    }).catch(() => { /* enrichment failed silently */ })

    return {
      trackId: id,
      title,
      artist,
      durationMs,
      sourcePlatform: imported.sourcePlatform,
    }
  })

  ipcMain.handle('track:get-platform-links', (_, trackId: string) => {
    const track = libraryStore.get(trackId)
    return track?.platformLinks ?? []
  })
}
