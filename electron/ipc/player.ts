import fs from 'fs'
import path from 'path'
import { ipcMain } from 'electron'
import { libraryStore } from '../lib/library-store'

function findFallbackAudioPath(trackId: string): string | null {
  const dir = libraryStore.getTrackDir(trackId)
  const entries = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const lower = entry.name.toLowerCase()
    if (lower.startsWith('audio.') && lower.length > 'audio.'.length) {
      return path.join(dir, entry.name)
    }
  }

  const commonExts = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.opus', '.aac']
  const fallback = entries.find((entry) => {
    if (!entry.isFile()) return false
    const name = entry.name.toLowerCase()
    return commonExts.some(ext => name.endsWith(ext))
  })

  return fallback ? path.join(dir, fallback.name) : null
}

export function registerPlayerHandlers(): void {
  ipcMain.handle('player:get-audio-url', (_, trackId: string) => {
    const track = libraryStore.get(trackId)
    if (!track) {
      return { trackId, url: null, hasAudio: false, error: '트랙을 찾을 수 없습니다.' }
    }

    if (track.hasAudio === false) {
      return { trackId, url: null, hasAudio: false, error: '오디오 파일이 없습니다.' }
    }

    let resolvedPath = track.filePath

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      const fallback = findFallbackAudioPath(track.id)
      if (fallback) {
        resolvedPath = fallback
        libraryStore.upsert({ ...track, filePath: resolvedPath, hasAudio: true })
      }
    }

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return { trackId, url: null, hasAudio: false, error: '오디오 파일이 존재하지 않습니다.' }
    }

    return { trackId, url: `music://localhost/${encodeURIComponent(resolvedPath)}`, hasAudio: true, error: null }
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
