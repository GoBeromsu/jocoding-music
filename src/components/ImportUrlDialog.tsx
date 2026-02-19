import { useState, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Link2, X, Loader2, CheckCircle2, ListMusic } from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'
import type { EnrichedResult } from '@/types/index'

type Step = 'idle' | 'downloading' | 'metadata' | 'ai-searching' | 'ai-classifying' | 'done' | 'error'

const STEP_LABELS: Record<Step, string> = {
  idle: '',
  downloading: '다운로드 중…',
  metadata: '파일 정보 파싱 중…',
  'ai-searching': '🔍 AI가 곡 정보 검색 중…',
  'ai-classifying': '🎵 장르 · 무드 분류 중…',
  done: '완료',
  error: '오류',
}

function isPlaylistUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.searchParams.has('list') || u.pathname.includes('/playlist')
  } catch {
    return false
  }
}

export function ImportUrlDialog() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [percent, setPercent] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [enrichedResult, setEnrichedResult] = useState<EnrichedResult | null>(null)
  const [isPlaylist, setIsPlaylist] = useState(false)
  const unsubRef = useRef<(() => void)[]>([])
  const { loadTracks } = useLibraryStore()

  const isActive = step !== 'idle' && step !== 'done' && step !== 'error'

  const cleanup = () => {
    unsubRef.current.forEach(fn => fn())
    unsubRef.current = []
  }

  const handleUrlChange = (val: string) => {
    setUrl(val)
    setIsPlaylist(isPlaylistUrl(val))
  }

  const handleImport = async (asPlaylist = false) => {
    if (!url.trim()) return
    setStep('downloading')
    setPercent(0)
    setError(null)
    setEnrichedResult(null)

    const unsubStatus = window.musicApp.system.onImportStatus((s) => {
      setStep(s.step as Step)
      setPercent(s.percent)
    })
    unsubRef.current.push(unsubStatus)

    const unsubEnriched = window.musicApp.system.onImportEnriched(async (data) => {
      setEnrichedResult(data.result)
      await loadTracks()
    })
    unsubRef.current.push(unsubEnriched)

    try {
      if (asPlaylist) {
        await window.musicApp.library.importPlaylist(url.trim())
      } else {
        await window.musicApp.library.importUrl(url.trim())
      }
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
    setEnrichedResult(null)
    setIsPlaylist(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <Dialog.Trigger asChild>
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700 transition-colors">
          <Link2 size={14} />
          + 노래 추가
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-sm font-semibold text-neutral-100">노래 추가</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-neutral-500 hover:text-neutral-100 transition-colors">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-xs text-neutral-500 mb-4">
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

          {/* Playlist hint */}
          {isPlaylist && step === 'idle' && (
            <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <ListMusic size={12} className="text-blue-400 flex-shrink-0" />
              <span className="text-xs text-blue-400">플레이리스트가 감지됐습니다</span>
            </div>
          )}

          {/* AI Step progress */}
          {isActive && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                <Loader2 size={12} className="animate-spin" />
                {STEP_LABELS[step]}
                {step === 'downloading' && ` ${Math.round(percent)}%`}
              </div>
              <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    step === 'ai-searching' || step === 'ai-classifying'
                      ? 'bg-violet-500 animate-pulse'
                      : 'bg-neutral-100'
                  }`}
                  style={{
                    width: step === 'metadata' || step === 'ai-searching' || step === 'ai-classifying'
                      ? '100%'
                      : `${percent}%`
                  }}
                />
              </div>

              {/* AI step indicators */}
              <div className="flex gap-3 mt-2">
                {(['downloading', 'metadata', 'ai-searching', 'ai-classifying'] as const).map((s, i) => {
                  const steps: Step[] = ['downloading', 'metadata', 'ai-searching', 'ai-classifying']
                  const currentIdx = steps.indexOf(step)
                  const isDone = currentIdx > i
                  const isCurrent = currentIdx === i
                  return (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-green-500' : isCurrent ? 'bg-violet-500 animate-pulse' : 'bg-neutral-700'}`} />
                      <span className={`text-[9px] ${isCurrent ? 'text-neutral-300' : isDone ? 'text-neutral-500' : 'text-neutral-700'}`}>
                        {['다운로드', '파싱', '검색', '분류'][i]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Done state */}
          {step === 'done' && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                <CheckCircle2 size={12} />
                가져오기 완료!
              </div>
              {enrichedResult && (
                <div className="px-3 py-2 bg-neutral-800 rounded-lg space-y-1">
                  <div className="flex gap-2">
                    <span className="pill-genre">
                      {enrichedResult.genre}
                    </span>
                    <span className="pill-mood">
                      {enrichedResult.mood}
                    </span>
                  </div>
                  {enrichedResult.summary && (
                    <p className="text-[11px] text-neutral-500 leading-relaxed">{enrichedResult.summary}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'error' && (
            <div className="text-xs text-red-400 mb-4">{error}</div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleClose}
              className="btn-ghost"
            >
              닫기
            </button>
            {isPlaylist && step === 'idle' && (
              <button
                onClick={() => handleImport(true)}
                disabled={!url.trim()}
                className="btn-secondary flex items-center gap-1.5"
              >
                <ListMusic size={11} />
                전체 가져오기
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
