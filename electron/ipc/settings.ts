import { ipcMain, BrowserWindow } from 'electron'
import { settingsStore } from '../lib/settings-store'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get-api-key', () => {
    return settingsStore.get().openaiApiKey
  })

  ipcMain.handle('settings:set-api-key', (event, key: string) => {
    const trimmed = key.trim()
    settingsStore.set({ openaiApiKey: trimmed || null })
    if (trimmed) {
      process.env.OPENAI_API_KEY = trimmed
    } else {
      delete process.env.OPENAI_API_KEY
    }
    // Hot reload: push event to renderer so UI can react immediately
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.webContents.send('settings:api-key-updated', { active: !!trimmed })
  })

  ipcMain.handle('settings:get-credits', () => {
    return settingsStore.get().credits
  })

  ipcMain.handle('settings:use-credit', () => {
    const success = settingsStore.deductCredit()
    return { success, remaining: settingsStore.get().credits }
  })

  ipcMain.handle('settings:get-download-quality', () => {
    return settingsStore.get().downloadQuality ?? 'best'
  })

  ipcMain.handle('settings:set-download-quality', (_, quality: string) => {
    const valid = ['best', '192k', '128k']
    if (valid.includes(quality)) {
      settingsStore.set({ downloadQuality: quality as import('../lib/settings-store').DownloadQuality })
    }
  })
}
