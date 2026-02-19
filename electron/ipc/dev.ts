import { ipcMain, BrowserWindow } from 'electron'
import { libraryStore } from '../lib/library-store'
import { enrichMusicMetadata } from '../lib/music-agent'
import { settingsStore } from '../lib/settings-store'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function registerDevHandlers(): void {
  ipcMain.handle('dev:backfill-tags', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const untagged = libraryStore.getAll().filter(t => !t.genre || !t.mood)

    const results: { id: string; success: boolean; error?: string }[] = []
    let succeeded = 0
    let failed = 0

    for (let i = 0; i < untagged.length; i++) {
      const track = untagged[i]

      // Skip tracks with no title and no artist — nothing to search
      if (!track.title && !track.artistName) {
        results.push({ id: track.id, success: false, error: 'no title or artist' })
        failed++
        win?.webContents.send('dev:backfill-progress', {
          current: i + 1,
          total: untagged.length,
          trackId: track.id,
          success: false,
        })
        continue
      }

      // Stop if credits run out
      if (settingsStore.get().credits <= 0) {
        // Mark remaining as skipped
        for (let j = i; j < untagged.length; j++) {
          results.push({ id: untagged[j].id, success: false, error: 'insufficient credits' })
          failed++
        }
        break
      }

      try {
        const result = await enrichMusicMetadata({
          title: track.title ?? 'Unknown',
          artist: track.artistName ?? 'Unknown',
          sourceUrl: track.sourceUrl ?? '',
          sourcePlatform: track.sourcePlatform ?? '',
        })
        settingsStore.deductCredit()

        const existing = libraryStore.get(track.id)
        if (existing) {
          libraryStore.upsert({
            ...existing,
            artistName: result.performingArtist ?? existing.artistName,
            genre: result.genre,
            mood: result.mood,
          })
        }

        results.push({ id: track.id, success: true })
        succeeded++
        win?.webContents.send('dev:backfill-progress', {
          current: i + 1,
          total: untagged.length,
          trackId: track.id,
          success: true,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results.push({ id: track.id, success: false, error: message })
        failed++
        win?.webContents.send('dev:backfill-progress', {
          current: i + 1,
          total: untagged.length,
          trackId: track.id,
          success: false,
          error: message,
        })
      }

      // Rate limit guard
      await delay(250)
    }

    return { total: untagged.length, succeeded, failed, results }
  })
}
