import { useEffect, useState } from 'react'
import { Music2, RefreshCw, X, Loader2 } from 'lucide-react'
import type { Track, EnrichedResult } from '@/types/index'

interface Props {
  track: Track
  onClose: () => void
}

export function TrackMetadataPanel({ track, onClose }: Props) {
  const [enriched, setEnriched] = useState<EnrichedResult | null>(null)
  const [aiStep, setAiStep] = useState<string | null>(null)

  // Reset when track changes
  useEffect(() => {
    setEnriched(null)
    setAiStep(null)
  }, [track.id])

  // Listen for AI enrichment events for this track
  useEffect(() => {
    const unsubStatus = window.musicApp.system.onImportStatus((s) => {
      if (s.trackId === track.id && (s.step === 'ai-searching' || s.step === 'ai-classifying')) {
        setAiStep(s.step)
      } else if (s.trackId === track.id && s.step === 'done') {
        setAiStep(null)
      }
    })

    const unsubEnriched = window.musicApp.system.onImportEnriched((data) => {
      if (data.trackId !== track.id) return
      setEnriched(data.result)
      setAiStep(null)
    })

    return () => { unsubStatus(); unsubEnriched() }
  }, [track.id])

  const coverUrl = track.coverArtPath
    ? `music://localhost/${encodeURIComponent(track.coverArtPath)}`
    : null

  // Use latest data: enriched result overrides track data
  const genre = enriched?.genre ?? track.genre
  const mood = enriched?.mood ?? track.mood
  const artistName = enriched?.performingArtist ?? track.artistName
  const summary = enriched?.summary ?? null
  const hasAiData = !!(genre || mood)

  return (
    <div className="w-64 flex-shrink-0 border-l border-neutral-800 bg-neutral-900 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Track Info</span>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Cover Art */}
      <div className="px-4 pt-4 pb-3">
        <div className="w-full aspect-square rounded-lg overflow-hidden bg-neutral-800">
          {coverUrl ? (
            <img src={coverUrl} alt={track.title ?? ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600 text-5xl">♪</div>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-semibold text-neutral-100 leading-tight">{track.title ?? 'Unknown Title'}</h3>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{artistName ?? 'Unknown Artist'}</p>
      </div>

      {/* AI Section */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-1.5 mb-3">
          <Music2 size={12} className="text-neutral-500" />
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">AI 분류</span>
        </div>

        {/* AI working indicator */}
        {aiStep && (
          <div className="flex items-center gap-2 mb-3 text-xs text-violet-400">
            <Loader2 size={11} className="animate-spin" />
            {aiStep === 'ai-searching' ? '🔍 곡 정보 검색 중…' : '🎵 장르·무드 분류 중…'}
          </div>
        )}

        {/* Genre & Mood pills */}
        {hasAiData && (
          <div className="flex flex-wrap gap-2 mb-3">
            {genre && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-neutral-600 uppercase">Genre</span>
                <span className="text-[11px] px-2.5 py-1 bg-violet-500/20 text-violet-300 rounded-full font-medium">
                  {genre}
                </span>
              </div>
            )}
            {mood && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-neutral-600 uppercase">Mood</span>
                <span className="text-[11px] px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full font-medium">
                  {mood}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cover info */}
        {(enriched?.isCover && enriched?.originalArtist) && (
          <div className="mb-3 px-2.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-[9px] text-amber-500 uppercase font-medium mb-0.5">Cover Song</p>
            <p className="text-xs text-amber-300">Original: {enriched.originalArtist}</p>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <p className="text-[11px] text-neutral-500 leading-relaxed mb-3">{summary}</p>
        )}

        {/* Source info */}
        {track.sourcePlatform && (
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <p className="text-[10px] text-neutral-600 uppercase mb-1">Source</p>
            <p className="text-xs text-neutral-500 capitalize">{track.sourcePlatform}</p>
          </div>
        )}

        {/* No AI data yet */}
        {!hasAiData && !aiStep && (
          <div className="flex items-center gap-2 text-xs text-neutral-700">
            <RefreshCw size={11} />
            AI 분석 대기 중…
          </div>
        )}
      </div>
    </div>
  )
}
