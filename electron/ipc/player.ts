import { ipcMain } from 'electron'
import { libraryStore } from '../lib/library-store'

export function registerPlayerHandlers(): void {
  ipcMain.handle('player:get-audio-url', (_, trackId: string) => {
    const track = libraryStore.get(trackId)
    if (!track) throw new Error(`Track ${trackId} not found`)
    return `music://localhost/${encodeURIComponent(track.filePath)}`
  })

  ipcMain.handle('player:update-play-count', (_, trackId: string) => {
    const track = libraryStore.get(trackId)
    if (!track) return
    libraryStore.upsert({
      ...track,
      playCount: track.playCount + 1,
      lastPlayedAt: Date.now(),
    })
  })
}
