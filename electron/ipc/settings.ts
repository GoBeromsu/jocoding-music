import { ipcMain } from 'electron'
import { settingsStore } from '../lib/settings-store'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get-api-key', () => {
    return settingsStore.get().openaiApiKey
  })

  ipcMain.handle('settings:set-api-key', (_, key: string) => {
    const trimmed = key.trim()
    settingsStore.set({ openaiApiKey: trimmed || null })
    if (trimmed) {
      process.env.OPENAI_API_KEY = trimmed
    } else {
      delete process.env.OPENAI_API_KEY
    }
  })
}
