import { useState, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Link2, X, Loader2, CheckCircle2, ListMusic } from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'
type Step = 'idle' | 'downloading' | 'metadata' | 'ai-searching' | 'ai-classifying' | 'done' | 'error'

const STEP_LABELS: Record<Step, string> = {
  idle: '',
  downloading: '다운로드 중…',
  metadata: '파일 정보 처리 중…',
  'ai-searching': '🔍 AI가 곡 정보 검색 중…',
  'ai-classifying': '🎵 장르 · 무드 분류 중…',
  done: '완료',
  error: '오류',
}

export function ImportUrlDialog() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [percent, setPercent] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasAudio, setHasAudio] = useState<boolean | null>(null)
  const [importMode, setImportMode] = useState<'single' | 'playlist'>('single')
  const unsubRef = useRef<(() => void)[]>([])
  const { loadTracks } = useLibraryStore()

  const isActive = step !== 'idle' && step !== 'done' && step !== 'error'

  const cleanup = () => {
    unsubRef.current.forEach(fn => fn())
    unsubRef.current = []
  }

  const handleUrlChange = (val: string) => {
    setUrl(val)
  }

  const toStep = (value: string): Step => {
    const phase = ['idle', 'downloading', 'metadata', 'ai-searching', 'ai-classifying', 'done', 'error']
    return phase.includes(value) ? (value as Step) : 'idle'
  }

  const handleImport = async (asPlaylist = false) => {
    if (!url.trim()) return
    setStep('downloading')
    setPercent(0)
    setError(null)
    setHasAudio(null)
    setImportMode(asPlaylist ? 'playlist' : 'single')

    const unsubStatus = window.musicApp.system.onImportStatus((s) => {
      const nextStep = toStep((s.step ?? s.phase ?? 'idle') as string)
      setStep(nextStep)
      if (typeof s.percent === 'number') setPercent(s.percent)
      if (typeof s.hasAudio === 'boolean') setHasAudio(s.hasAudio)
      if (nextStep === 'error' && typeof s.message === 'string') setError(s.message)
    })
    unsubRef.current.push(unsubStatus)

    const unsubEnriched = window.musicApp.system.onImportEnriched(async () => {
      await loadTracks()
    })
    unsubRef.current.push(unsubEnriched)

    const unsubError = window.musicApp.system.onImportError((data: { trackId: string; message: string }) => {
      setStep('error')
      setError(data.message)
    })
    unsubRef.current.push(unsubError)

    try {
      if (asPlaylist) {
        await window.musicApp.library.importPlaylist(url.trim())
        setStep('done')
      } else {
        const result = await window.musicApp.library.importUrl(url.trim())
        setStep(result.importStatus === 'error' ? 'error' : 'done')
        setHasAudio(result.hasAudio ?? null)
        if (result.importStatus === 'error' && result.importError) {
          setError(result.importError)
        }
      }
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
    setHasAudio(null)
    setImportMode('single')
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <Dialog.Trigger asChild>
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium app-surface app-text border border-[color:var(--app-border)] app-surface-hover transition-colors">
          <Link2 size={14} />
          + 노래 추가
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[color:color-mix(in oklch,var(--color-on-surface) 60%, transparent)] z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md app-surface border app-border rounded-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-sm font-semibold app-text">노래 추가</Dialog.Title>
            <Dialog.Close asChild>
              <button className="app-muted hover:text-[color:var(--app-text)] transition-colors">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-xs app-muted mb-4">
            URL을 붙여넣으면 AI가 곡 정보, 장르, 무드를 자동으로 채워줍니다.
          </p>

          <input
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isActive && handleImport(false)}
            disabled={isActive}
            className="input-base mb-3"
          />

        {isActive && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs app-muted mb-2">
                <Loader2 size={12} className="animate-spin" />
                {STEP_LABELS[step]}
                {step === 'downloading' && ` ${Math.round(percent)}%`}
              </div>
              <div className="h-1 app-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    step === 'ai-searching' || step === 'ai-classifying'
                      ? 'bg-[color:var(--app-accent)] animate-pulse'
                      : 'bg-[color:var(--app-accent-strong)]'
                  }`}
                  style={{
                    width: step === 'metadata' || step === 'ai-searching' || step === 'ai-classifying'
                      ? '100%'
                      : `${percent}%`,
                  }}
                />
              </div>

              <div className="flex gap-3 mt-2">
                {(['downloading', 'metadata', 'ai-searching', 'ai-classifying'] as const).map((s, i) => {
                  const steps: Step[] = ['downloading', 'metadata', 'ai-searching', 'ai-classifying']
                  const currentIdx = steps.indexOf(step)
                  const isDone = currentIdx > i
                  const isCurrent = currentIdx === i
                  return (
                    <div key={s} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-[color:var(--app-accent)]' : isCurrent ? 'bg-[color:var(--app-accent)] animate-pulse' : 'bg-[color:var(--app-muted)]'}`} />
                      <span className={`text-[9px] ${isCurrent ? 'app-text' : isDone ? 'app-muted' : 'opacity-40'}`}>
                        {['다운로드', '파싱', '검색', '분류'][i]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs app-text mb-2">
                <CheckCircle2 size={12} />
                가져오기 완료!
              </div>
              {!hasAudio && (
                <p className="text-xs app-error">오디오 없이 메타데이터만 저장됩니다.</p>
              )}
            </div>
          )}

          {step === 'error' && (
            <p className="text-xs app-error mb-4">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleClose}
              className="btn-ghost"
            >
              닫기
            </button>
            {step === 'error' && (
              <button
                onClick={() => handleImport(importMode === 'playlist')}
                className="btn-secondary"
              >
                재시도
              </button>
            )}
            {step === 'idle' && (
              <button
                onClick={() => handleImport(true)}
                disabled={!url.trim()}
                className="btn-secondary flex items-center gap-1.5"
              >
                <ListMusic size={11} />
                플레이리스트 가져오기
              </button>
            )}
            <button
              onClick={() => handleImport(false)}
              disabled={!url.trim() || isActive}
              className="btn-primary"
            >
              가져오기
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
