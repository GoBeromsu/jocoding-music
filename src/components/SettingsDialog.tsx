import { useState, useEffect } from 'react'
import { Settings, Monitor, Moon, Sun, Eye, EyeOff, Zap } from 'lucide-react'
import { useThemeStore, type ThemePreference } from '@/store/themeStore'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'System', icon: <Monitor size={15} /> },
  { value: 'dark',   label: 'Black',  icon: <Moon   size={15} /> },
  { value: 'light',  label: 'Light',  icon: <Sun    size={15} /> },
]

const QUALITY_OPTIONS: { value: 'best' | '192k' | '128k'; label: string }[] = [
  { value: 'best', label: '최고 품질' },
  { value: '192k', label: '192 kbps' },
  { value: '128k', label: '128 kbps' },
]

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const { preference, setTheme } = useThemeStore()
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [downloadQuality, setDownloadQuality] = useState<'best' | '192k' | '128k'>('best')

  useEffect(() => {
    if (open) {
      window.musicApp.settings.getApiKey().then(key => setApiKey(key ?? ''))
      window.musicApp.settings.getCredits().then(setCredits)
      window.musicApp.settings.getDownloadQuality().then(setDownloadQuality)
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
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm app-muted hover:bg-[color:var(--app-surface-hover)] hover:text-[color:var(--app-text)] transition-colors"
      >
        <Settings size={15} />
        설정
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-[color:color-mix(in oklch,var(--color-on-surface) 60%, transparent)]" />

        <div
          className="relative app-surface border app-border rounded-xl shadow-2xl w-80 p-5 max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
            <h2 className="text-sm font-semibold app-text mb-4">설정</h2>

            {/* Credits */}
            <div className="mb-5 px-3 py-2.5 app-surface-subtle rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={14} className="app-accent" />
                <span className="text-xs app-muted">AI Credits</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold app-text">
                  {credits ?? '—'}
                </span>
                <span className="text-[10px] app-muted ml-1">remaining</span>
              </div>
            </div>
            <p className="text-[10px] app-muted mb-5 -mt-3 px-1">
              AI 분석 1회 = 1 크레딧 · 기본 10 크레딧 무료 제공
            </p>

            {/* Appearance */}
            <div>
              <p className="text-xs app-muted uppercase tracking-wide mb-2">Appearance</p>
              <div className="flex gap-2">
                {THEME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border text-xs transition-colors ${
                  preference === opt.value
                        ? 'border-[color:var(--app-accent)] app-text bg-surface-container-high'
                        : 'border-[color:var(--app-border)] app-muted hover:border-[color:var(--app-accent)] hover:text-[color:var(--app-text)]'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Download Quality */}
            <div className="mt-5">
              <p className="text-xs app-muted uppercase tracking-wide mb-2">다운로드 품질</p>
              <div className="flex gap-2">
                {QUALITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setDownloadQuality(opt.value)
                      window.musicApp.settings.setDownloadQuality(opt.value)
                    }}
                    className={`flex-1 py-2 rounded-lg border text-xs transition-colors ${
                      downloadQuality === opt.value
                        ? 'border-[color:var(--app-accent)] app-text bg-surface-container-high'
                        : 'border-[color:var(--app-border)] app-muted hover:border-[color:var(--app-accent)] hover:text-[color:var(--app-text)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] app-muted">다음 임포트부터 적용됩니다.</p>
            </div>

            {/* OpenAI API Key */}
            <div className="mt-5">
              <p className="text-xs app-muted uppercase tracking-wide mb-2">OpenAI API Key</p>
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
                  className="p-1.5 app-muted hover:text-[color:var(--app-text)] transition-colors"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] app-muted">
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
