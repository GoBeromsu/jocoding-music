import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function useIpcToasts() {
  useEffect(() => {
    const unsubs: (() => void)[] = []

    // Enrichment success
    const unsubEnriched = window.musicApp.system.onImportEnriched((data) => {
      const result = data.result as { performingArtist?: string; summary?: string }
      toast.success(result.performingArtist
        ? `AI 분석 완료: ${result.performingArtist}`
        : 'AI 분석 완료')
    })
    unsubs.push(unsubEnriched)

    // Import errors (if bridge exists)
    if ((window.musicApp.system as any).onImportError) {
      const unsubError = (window.musicApp.system as any).onImportError((data: { trackId: string; message: string }) => {
        toast.error(data.message || 'Import error')
      })
      unsubs.push(unsubError)
    }

    return () => unsubs.forEach(fn => fn())
  }, [])
}
