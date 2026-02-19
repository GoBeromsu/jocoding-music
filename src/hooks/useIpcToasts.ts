import { useEffect } from 'react'
import toast from 'react-hot-toast'
import type { EnrichedResult } from '@/types/index'

export function useIpcToasts() {
  useEffect(() => {
    const unsubs: (() => void)[] = []

    // AI enrichment completed
    const unsubEnriched = window.musicApp.system.onImportEnriched((data) => {
      const result = data.result as EnrichedResult
      const label = [result.genre, result.mood].filter(Boolean).join(' · ')
      toast.success(
        label
          ? `AI 분류 완료: ${label}`
          : `AI 분석 완료`,
        { duration: 3000 }
      )
    })
    unsubs.push(unsubEnriched)

    // Import errors
    const unsubError = window.musicApp.system.onImportError((data) => {
      toast.error(data.message || 'Import 오류', { duration: 5000 })
    })
    unsubs.push(unsubError)

    // API key hot reload
    const unsubApiKey = window.musicApp.system.onApiKeyUpdated((data) => {
      if (data.active) {
        toast.success('API 키가 활성화됐습니다', { duration: 2000 })
      } else {
        toast('API 키가 제거됐습니다', { icon: '🔑', duration: 2000 })
      }
    })
    unsubs.push(unsubApiKey)

    return () => unsubs.forEach(fn => fn())
  }, [])
}
