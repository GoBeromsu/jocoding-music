import { ipcMain } from 'electron'
import { libraryStore } from '../lib/library-store'
import { generateTasteSummary } from '../lib/music-agent'
import { settingsStore } from '../lib/settings-store'

export function registerDashboardHandlers(): void {
  ipcMain.handle('dashboard:get-stats', () => {
    return libraryStore.getDashboardStats()
  })

  ipcMain.handle('dashboard:generate-taste-summary', async () => {
    const stats = libraryStore.getDashboardStats()

    if (stats.taggedTracks < 3) {
      return '아직 분류된 음악이 부족해요. 몇 곡 더 가져오면 취향을 제대로 분석할 수 있어요.'
    }

    if (settingsStore.get().credits <= 0) {
      throw new Error('크레딧이 부족합니다. Settings에서 확인해주세요.')
    }

    settingsStore.deductCredit()

    const topTrack = stats.topTracks[0]
      ? { title: stats.topTracks[0].title ?? 'Unknown', artist: stats.topTracks[0].artistName ?? 'Unknown', playCount: stats.topTracks[0].playCount }
      : undefined

    return generateTasteSummary({
      topGenres: stats.topGenres.slice(0, 3).map(g => g.genre),
      topMoods: stats.topMoods.slice(0, 3).map(m => m.mood),
      totalTracks: stats.totalTracks,
      topTrack,
    })
  })
}
