import { useState } from 'react'
import { Settings, Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore, type ThemePreference } from '@/store/themeStore'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'System', icon: <Monitor size={15} /> },
  { value: 'dark',   label: 'Dark',   icon: <Moon   size={15} /> },
  { value: 'light',  label: 'Light',  icon: <Sun    size={15} /> },
]

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const { preference, setTheme } = useThemeStore()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors"
      >
        <Settings size={15} />
        Settings
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Dialog */}
          <div
            className="relative bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-80 p-5"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-neutral-100 mb-4">Settings</h2>

            {/* Theme */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Appearance</p>
              <div className="flex gap-2">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs transition-colors ${
                      preference === opt.value
                        ? 'border-white text-white bg-neutral-700'
                        : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
