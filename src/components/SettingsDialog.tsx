import { useState, useEffect } from 'react'
import { Settings, Monitor, Moon, Sun, Eye, EyeOff, Zap } from 'lucide-react'
import { useThemeStore, type ThemePreference } from '@/store/themeStore'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'System', icon: <Monitor size={15} /> },
  { value: 'dark',   label: 'Dark',   icon: <Moon   size={15} /> },
  { value: 'light',  label: 'Light',  icon: <Sun    size={15} /> },
]

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const { preference, setTheme } = useThemeStore()
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      window.musicApp.settings.getApiKey().then(key => setApiKey(key ?? ''))
      window.musicApp.settings.getCredits().then(setCredits)
    }
  }, [open])

  async function handleSave() {
    await window.musicApp.settings.setApiKey(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-neutral-500 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
      >
        <Settings size={15} />
        설정
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />

          <div
            className="relative bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-80 p-5"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-neutral-100 mb-4">설정</h2>

            {/* Credits */}
            <div className="mb-5 px-3 py-2.5 bg-neutral-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-xs text-neutral-300">AI Credits</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-neutral-100">
                  {credits ?? '—'}
                </span>
                <span className="text-[10px] text-neutral-500 ml-1">remaining</span>
              </div>
            </div>
            <p className="text-[10px] text-neutral-600 mb-5 -mt-3 px-1">
              AI 분석 1회 = 1 크레딧 · 기본 10 크레딧 무료 제공
            </p>

            {/* Appearance */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Appearance</p>
              <div className="flex gap-2">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs transition-colors ${
                      preference === opt.value
                        ? 'border-neutral-100 text-neutral-100 bg-neutral-700'
                        : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* OpenAI API Key */}
            <div className="mt-5">
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">OpenAI API Key</p>
              <div className="flex gap-1.5">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="sk-..."
                  className="input-base flex-1"
                />
                <button
                  onClick={() => setShowKey(v => !v)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-neutral-600">
                로컬 저장. AI 장르·무드 분류에 필요합니다.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={handleSave}
                className="btn-secondary"
              >
                {saved ? '저장됨!' : '저장'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="btn-ghost"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
