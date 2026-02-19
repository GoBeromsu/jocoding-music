import fs from 'fs'
import path from 'path'

export interface AppSettings {
  openaiApiKey: string | null
  credits: number
}

const DEFAULT_SETTINGS: AppSettings = {
  openaiApiKey: null,
  credits: 10,
}

let settingsPath = ''
let cache: AppSettings = { ...DEFAULT_SETTINGS }

export const settingsStore = {
  init(userDataDir: string): void {
    settingsPath = path.join(userDataDir, 'settings.json')
    if (fs.existsSync(settingsPath)) {
      try {
        const raw = fs.readFileSync(settingsPath, 'utf-8')
        cache = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      } catch {
        cache = { ...DEFAULT_SETTINGS }
      }
    } else {
      cache = { ...DEFAULT_SETTINGS }
    }
  },

  get(): AppSettings {
    return { ...cache }
  },

  set(partial: Partial<AppSettings>): void {
    cache = { ...cache, ...partial }
    fs.writeFileSync(settingsPath, JSON.stringify(cache, null, 2), 'utf-8')
  },

  deductCredit(): boolean {
    if (cache.credits <= 0) return false
    cache.credits = cache.credits - 1
    fs.writeFileSync(settingsPath, JSON.stringify(cache, null, 2), 'utf-8')
    return true
  },
}
