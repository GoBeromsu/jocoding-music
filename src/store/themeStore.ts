import { create } from 'zustand'

export type ThemePreference = 'system' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return getSystemTheme()
  return pref
}

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
  setTheme: (pref: ThemePreference) => void
}

function loadPreference(): ThemePreference {
  const value = localStorage.getItem('theme-preference')
  if (value === 'system' || value === 'dark' || value === 'light') return value
  return 'system'
}

const savedPref = loadPreference()

export const useThemeStore = create<ThemeState>((set) => {
  // Listen for OS theme changes to update resolved when preference is 'system'
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', () => {
    set((state) => {
      if (state.preference !== 'system') return state
      return { resolved: getSystemTheme() }
    })
  })

  return {
    preference: savedPref,
    resolved: resolveTheme(savedPref),
    setTheme: (pref) => {
      localStorage.setItem('theme-preference', pref)
      set({ preference: pref, resolved: resolveTheme(pref) })
    },
  }
})
