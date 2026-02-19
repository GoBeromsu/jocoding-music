import { useState, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Link2, X, Loader2, CheckCircle2 } from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'

type Step = 'idle' | 'downloading' | 'analyzing' | 'done' | 'error'

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '▶',
  spotify: '🎵',
  apple_music: '🍎',
  youtube_music: '▶',
  melon: '🍈',
  bugs: '🎧',
  genie: '🧞',
}

export function ImportUrlDialog() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [percent, setPercent] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const unsubRef = useRef<(() => void)[]>([])
  const { loadTracks } = useLibraryStore()

  const cleanup = () => {
    unsubRef.current.forEach(fn => fn())
    unsubRef.current = []
  }

  const handleImport = async () => {
    if (!url.trim()) return
    setStep('downloading')
    setPercent(0)
    setError(null)

    const unsubStatus = window.musicApp.system.onImportStatus((s) => {
      setStep(s.step as Step)
      setPercent(s.percent)
    })
    unsubRef.current.push(unsubStatus)

    try {
      await window.musicApp.library.importUrl(url.trim())
      setStep('done')
      await loadTracks()
    } catch (e) {
      setStep('error')
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      cleanup()
    }
  }

  const handleClose = () => {
    cleanup()
    setOpen(false)
    setUrl('')
    setStep('idle')
    setPercent(0)
    setError(null)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <Dialog.Trigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors">
          <Link2 size={15} />
          Import from URL
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-sm font-semibold text-white">Import from URL</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-neutral-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-xs text-neutral-500 mb-4">
            YouTube, SoundCloud 등의 URL을 입력하면 AI가 곡 정보를 자동으로 수집합니다.
          </p>

          <input
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && step === 'idle' && handleImport()}
            disabled={step !== 'idle' && step !== 'error' && step !== 'done'}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 disabled:opacity-50 mb-4"
          />

          {/* Progress */}
          {(step === 'downloading' || step === 'analyzing') && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                <Loader2 size={12} className="animate-spin" />
                {step === 'downloading' ? `다운로드 중… ${Math.round(percent)}%` : 'AI가 곡 정보를 분석 중…'}
              </div>
              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: step === 'analyzing' ? '100%' : `${percent}%` }}
                />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex items-center gap-2 text-xs text-green-400 mb-4">
              <CheckCircle2 size={12} />
              가져오기 완료! AI 분석은 백그라운드에서 계속됩니다.
            </div>
          )}

          {step === 'error' && (
            <div className="text-xs text-red-400 mb-4">{error}</div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              닫기
            </button>
            <button
              onClick={handleImport}
              disabled={!url.trim() || (step !== 'idle' && step !== 'error')}
              className="px-4 py-1.5 text-xs bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              가져오기
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export { PLATFORM_ICONS }
