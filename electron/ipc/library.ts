import { ipcMain, BrowserWindow, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { parseFile } from 'music-metadata'
import { libraryStore, type TrackMeta } from '../lib/library-store'

const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.opus', '.aac'])

export function registerLibraryHandlers(): void {
  ipcMain.handle('system:select-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('library:scan-folder', async (event, folderPath: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const files = collectAudioFiles(folderPath)
    let done = 0

    for (const filePath of files) {
      try {
        const stat = fs.statSync(filePath)
        const meta = await parseFile(filePath, { duration: true })
        const common = meta.common
        const format = meta.format

        // Check if already in store by filePath
        const existing = libraryStore.getAll().find(t => t.filePath === filePath)
        const id = existing?.id ?? libraryStore.newId()

        const track: TrackMeta = {
          id,
          filePath,
          isImported: false,
          title: common.title ?? path.basename(filePath, path.extname(filePath)),
          artistName: common.artist ?? null,
          albumTitle: common.album ?? null,
          year: common.year ?? null,
          trackNumber: common.track?.no ?? null,
          durationMs: format.duration ? Math.round(format.duration * 1000) : null,
          bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : null,
          sampleRate: format.sampleRate ?? null,
          fileSize: stat.size,
          mimeType: format.codec ?? null,
          coverArtPath: null,
          tags: [],
          isDeleted: false,
          sourceUrl: existing?.sourceUrl ?? null,
          sourcePlatform: existing?.sourcePlatform ?? null,
          genre: existing?.genre ?? null,
          mood: existing?.mood ?? null,
          playCount: existing?.playCount ?? 0,
          lastPlayedAt: existing?.lastPlayedAt ?? null,
          dateAdded: existing?.dateAdded ?? Date.now(),
          modifiedAt: Date.now(),
        }

        libraryStore.upsert(track)
      } catch {
        // Skip unreadable/corrupt files
      }

      done++
      if (done % 10 === 0 || done === files.length) {
        win?.webContents.send('library:scan-progress', { done, total: files.length })
      }
    }

    return { count: done }
  })

  ipcMain.handle('library:get-tracks', () => {
    return libraryStore.getAll().map(toTrackRow)
  })

  ipcMain.handle('library:get-track', (_, id: string) => {
    const track = libraryStore.get(id)
    return track ? toTrackRow(track) : null
  })

  ipcMain.handle('library:search-tracks', (_, query: string) => {
    return libraryStore.search(query).map(toTrackRow)
  })

  ipcMain.handle('library:get-albums', () => {
    // Album grouping is done client-side via derivedAlbums() in libraryStore
    return libraryStore.getAll().map(toTrackRow)
  })

  ipcMain.handle('library:get-artists', () => {
    // Artist grouping is done client-side via derivedArtists() in libraryStore
    return libraryStore.getAll().map(toTrackRow)
  })

  ipcMain.handle('library:delete-track', (_, id: string) => {
    libraryStore.softDelete(id)
  })
}

function toTrackRow(t: TrackMeta) {
  return {
    id: t.id,
    filePath: t.filePath,
    isImported: t.isImported,
    title: t.title,
    artistName: t.artistName,
    albumTitle: t.albumTitle,
    durationMs: t.durationMs,
    bitrate: t.bitrate,
    coverArtPath: t.coverArtPath,
    sourceUrl: t.sourceUrl,
    sourcePlatform: t.sourcePlatform,
    genre: t.genre,
    mood: t.mood,
    playCount: t.playCount,
    dateAdded: t.dateAdded,
    trackNumber: t.trackNumber,
  }
}

function collectAudioFiles(dir: string): string[] {
  const results: string[] = []
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...collectAudioFiles(full))
      } else if (AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        results.push(full)
      }
    }
  } catch { /* permission denied */ }
  return results
}
