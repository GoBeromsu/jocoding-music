import { useEffect, useState } from 'react'
import { ExternalLink, Music2, RefreshCw } from 'lucide-react'
import type { Track, PlatformLink, EnrichedResult } from '@/types/index'

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  spotify:       { label: 'Spotify',       color: 'text-green-400' },
  apple_music:   { label: 'Apple Music',   color: 'text-pink-400' },
  youtube_music: { label: 'YouTube Music', color: 'text-red-400' },
  youtube:       { label: 'YouTube',       color: 'text-red-500' },
  melon:         { label: '멜론',           color: 'text-green-300' },
  bugs:          { label: '벅스',           color: 'text-purple-400' },
  genie:         { label: '지니',           color: 'text-blue-400' },
}

interface Props {
  track: Track
}

export function TrackMetadataPanel({ track }: Props) {
  const [links, setLinks] = useState<PlatformLink[]>([])
  const [enriched, setEnriched] = useState<EnrichedResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Load platform links from DB
  useEffect(() => {
    setLinks([])
    setEnriched(null)
    window.musicApp.library.getPlatformLinks(track.id).then(setLinks)
  }, [track.id])

  // Listen for background enrichment push for this track
  useEffect(() => {
    const unsub = window.musicApp.system.onImportEnriched((data) => {
      if (data.trackId !== track.id) return
      const result = data.result as EnrichedResult
      setEnriched(result)
      setLinks(result.platformLinks)
    })
    return unsub
  }, [track.id])

  const handleReanalyze = async () => {
    setLoading(true)
    try {
      await window.musicApp.library.importUrl(
        (track as Track & { sourceUrl?: string }).sourceUrl ?? ''
      )
    } finally {
      setLoading(false)
    }
  }

  const hasAiData = enriched || links.length > 0

  return (
    <div className="border-t border-neutral-800 bg-neutral-900/50 px-6 py-4 text-sm">
      <div className="flex items-center gap-2 mb-3">
        <Music2 size={13} className="text-neutral-500" />
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">AI 메타데이터</span>
      </div>

      {/* Artist info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
        <div>
          <p className="text-xs text-neutral-600 mb-0.5">부른 가수</p>
          <p className="text-sm text-neutral-200">
            {enriched?.performingArtist ?? track.artistName ?? '—'}
          </p>
        </div>
        {(enriched?.isCover || enriched?.originalArtist) && (
          <div>
            <p className="text-xs text-neutral-600 mb-0.5">원곡 아티스트</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">COVER</span>
              <p className="text-sm text-neutral-200">{enriched.originalArtist}</p>
            </div>
          </div>
        )}
      </div>

      {/* AI summary */}
      {enriched?.summary && (
        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">{enriched.summary}</p>
      )}

      {/* Platform links */}
      {links.length > 0 && (
        <div>
          <p className="text-xs text-neutral-600 mb-2">다른 플랫폼에서 듣기</p>
          <div className="flex flex-wrap gap-2">
            {links.map(({ platform, url }) => {
              const meta = PLATFORM_LABELS[platform] ?? { label: platform, color: 'text-neutral-400' }
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.preventDefault(); window.open(url, '_blank') }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-neutral-700 hover:border-neutral-500 transition-colors ${meta.color}`}
                >
                  {meta.label}
                  <ExternalLink size={10} />
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state + loading */}
      {!hasAiData && (
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          {loading ? (
            <>
              <RefreshCw size={11} className="animate-spin" />
              AI 분석 중…
            </>
          ) : (
            <button
              onClick={handleReanalyze}
              className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              <RefreshCw size={11} />
              AI 분석 시작
            </button>
          )}
        </div>
      )}
    </div>
  )
}
