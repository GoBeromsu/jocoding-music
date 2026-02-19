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
          originalArtist: existing?.originalArtist ?? null,
          isCover: existing?.isCover ?? null,
          platformLinks: existing?.platformLinks ?? [],
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
    const tracks = libraryStore.getAll()
    const albumMap = new Map<string, {
      title: string; artistName: string | null; year: number | null
      coverArtPath: string | null; trackCount: number
    }>()

    for (const t of tracks) {
      if (!t.albumTitle) continue
      const key = `${t.albumTitle}|||${t.artistName ?? ''}`
      const existing = albumMap.get(key)
      if (existing) {
        existing.trackCount++
      } else {
        albumMap.set(key, {
          title: t.albumTitle,
          artistName: t.artistName,
          year: t.year,
          coverArtPath: t.coverArtPath,
          trackCount: 1,
        })
      }
    }

    return Array.from(albumMap.values()).sort((a, b) =>
      (a.artistName ?? '').localeCompare(b.artistName ?? '') || a.title.localeCompare(b.title)
    )
  })

  ipcMain.handle('library:get-artists', () => {
    const tracks = libraryStore.getAll()
    const artistMap = new Map<string, { name: string; albumCount: number; trackCount: number }>()
    const albumSets = new Map<string, Set<string>>()

    for (const t of tracks) {
      if (!t.artistName) continue
      const name = t.artistName
      if (!artistMap.has(name)) {
        artistMap.set(name, { name, albumCount: 0, trackCount: 0 })
        albumSets.set(name, new Set())
      }
      artistMap.get(name)!.trackCount++
      if (t.albumTitle) albumSets.get(name)!.add(t.albumTitle)
    }

    for (const [name, set] of albumSets) {
      artistMap.get(name)!.albumCount = set.size
    }

    return Array.from(artistMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
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
    originalArtist: t.originalArtist,
    isCover: t.isCover,
    platformLinks: t.platformLinks,
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
