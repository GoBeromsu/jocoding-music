import { useEffect, useState } from 'react'
import { ExternalLink, Music2, RefreshCw, X } from 'lucide-react'
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
  onClose: () => void
}

export function TrackMetadataPanel({ track, onClose }: Props) {
  const [links, setLinks] = useState<PlatformLink[]>([])
  const [enriched, setEnriched] = useState<EnrichedResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLinks(track.platformLinks ?? [])
    setEnriched(null)
    window.musicApp.library.getPlatformLinks(track.id).then(setLinks)
  }, [track.id])

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
      await window.musicApp.library.importUrl(track.sourceUrl ?? '')
    } finally {
      setLoading(false)
    }
  }

  const coverUrl = track.coverArtPath
    ? `music://localhost/${encodeURIComponent(track.coverArtPath)}`
    : null

  const hasAiData = enriched || links.length > 0

  return (
    <div className="w-72 flex-shrink-0 border-l border-neutral-800 bg-neutral-900 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Now Playing</span>
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
        <h3 className="text-sm font-semibold text-neutral-100 truncate">{track.title ?? 'Unknown Title'}</h3>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{track.artistName ?? 'Unknown Artist'}</p>
        {track.albumTitle && (
          <p className="text-xs text-neutral-600 mt-0.5 truncate">{track.albumTitle}</p>
        )}
      </div>

      {/* AI Section */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Music2 size={12} className="text-neutral-500" />
          <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">AI Metadata</span>
        </div>

        {/* Artist info */}
        <div className="space-y-2 mb-3">
          <div>
            <p className="text-[10px] text-neutral-600 uppercase">부른 가수</p>
            <p className="text-xs text-neutral-200">
              {enriched?.performingArtist ?? track.artistName ?? '—'}
            </p>
          </div>
          {(enriched?.isCover || enriched?.originalArtist) && (
            <div>
              <p className="text-[10px] text-neutral-600 uppercase">원곡 아티스트</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">COVER</span>
                <p className="text-xs text-neutral-200">{enriched?.originalArtist}</p>
              </div>
            </div>
          )}
        </div>

        {enriched?.summary && (
          <p className="text-[11px] text-neutral-500 leading-relaxed mb-3">{enriched.summary}</p>
        )}

        {/* Platform links */}
        {links.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] text-neutral-600 uppercase mb-2">다른 플랫폼</p>
            <div className="space-y-1">
              {links.map(({ platform, url }) => {
                const meta = PLATFORM_LABELS[platform] ?? { label: platform, color: 'text-neutral-400' }
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.preventDefault(); window.open(url, '_blank') }}
                    className={`flex items-center justify-between w-full text-xs px-2.5 py-1.5 rounded-md bg-neutral-800/50 hover:bg-neutral-800 transition-colors ${meta.color}`}
                  >
                    {meta.label}
                    <ExternalLink size={10} className="text-neutral-600" />
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty / loading */}
        {!hasAiData && (
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            {loading ? (
              <>
                <RefreshCw size={11} className="animate-spin" />
                AI 분석 중…
              </>
            ) : track.sourceUrl ? (
              <button
                onClick={handleReanalyze}
                className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                <RefreshCw size={11} />
                AI 분석 시작
              </button>
            ) : (
              <span>AI 분석 정보 없음</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
