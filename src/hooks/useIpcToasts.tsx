import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import type { TrackImportEvent, TrackImportStep } from '@/types/index'

export function useIpcToasts() {
  const lastSteps = useRef(new Map<string, TrackImportStep>())
  const lastErrors = useRef(new Map<string, string>())

  const showImportError = (trackId: string | undefined, message?: string) => {
    const key = trackId ?? 'global'
    const normalized = message?.trim() || 'Import failed'
    if (lastErrors.current.get(key) === normalized) return
    lastErrors.current.set(key, normalized)
    toast.error(normalized)
  }

  useEffect(() => {
    const unsubs: (() => void)[] = []

    const unsubStatus = window.musicApp.system.onImportStatus((s: TrackImportEvent) => {
      const trackId = s.trackId ?? 'global'
      const step = (s.step ?? s.phase) as TrackImportStep | undefined
      if (!step || lastSteps.current.get(trackId) === step) return
      lastSteps.current.set(trackId, step)

      if (step === 'downloading') {
        toast(`트랙 임포트 시작`)
      }
      if (step === 'metadata') {
        toast('메타데이터 분석 완료')
      }
      if (step === 'ai-searching') {
        toast('AI 검색 중...')
      }
      if (step === 'ai-classifying') {
        toast('AI 분류 중...')
      }
      if (step === 'done') {
        lastErrors.current.delete(trackId)
        if (s.hasAudio === false) {
          toast((t) => (
            <div className="text-sm">
              <p>메타데이터만 저장되었습니다.</p>
              <p className="text-xs opacity-80">오디오가 없는 트랙은 재생이 불가해요.</p>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-[11px] underline opacity-90 mt-1"
              >
                확인
              </button>
            </div>
          ), { duration: 4500 })
        } else {
          toast.success('임포트가 완료되었습니다.')
        }
      }
      if (step === 'error') {
        showImportError(trackId, s.message)
      }
    })
    unsubs.push(unsubStatus)

    const unsubEnriched = window.musicApp.system.onImportEnriched((data) => {
      toast(`AI 분류 완료: ${data.result.genre || '장르'}, ${data.result.mood || '무드'}`)
    })
    unsubs.push(unsubEnriched)

    const unsubError = window.musicApp.system.onImportError((data) => {
      showImportError(data.trackId, data.message)
    })
    unsubs.push(unsubError)

  const unsubApiKey = window.musicApp.system.onApiKeyUpdated((data) => {
      if (data.active) {
        toast.success('API 키가 활성화됐습니다', { duration: 2000 })
      } else {
        toast('API 키가 제거됐습니다', { icon: '🔑', duration: 2000 })
      }
    })
    unsubs.push(unsubApiKey)

    return () => {
      lastSteps.current.clear()
      lastErrors.current.clear()
      unsubs.forEach(fn => fn())
    }
  }, [])
}
