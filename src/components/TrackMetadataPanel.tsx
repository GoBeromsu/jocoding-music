import { useEffect, useState } from 'react'
import { Music2, X, Loader2 } from 'lucide-react'
import type { Track, EnrichedResult } from '@/types/index'

type EditableField = 'title' | 'artistName' | 'albumTitle'

interface Props {
  track: Track
  onClose: () => void
  onUpdate: (patch: Partial<Pick<Track, 'title' | 'artistName' | 'albumTitle' | 'isFavorite'>>) => void
  onDelete: () => void
}

export function TrackMetadataPanel({ track, onClose, onUpdate, onDelete }: Props) {
  const [enriched, setEnriched] = useState<EnrichedResult | null>(null)
  const [aiStep, setAiStep] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ field: EditableField; value: string } | null>(null)

  // Reset when track changes
  useEffect(() => {
    setEnriched(null)
    setAiStep(null)
    setEditing(null)
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
    ? track.coverArtPath.startsWith('http')
      ? track.coverArtPath
      : `music://localhost/${encodeURIComponent(track.coverArtPath)}`
    : null

  const genre = enriched?.genre ?? track.genre
  const mood = enriched?.mood ?? track.mood
  const summary = enriched?.summary ?? null
  const hasAiData = !!(genre || mood)

  const commitEdit = () => {
    if (!editing) return
    const trimmed = editing.value.trim()
    if (trimmed) onUpdate({ [editing.field]: trimmed })
    setEditing(null)
  }

  const renderEditable = (field: EditableField, value: string | null, className: string) => {
    if (editing?.field === field) {
      return (
        <input
          autoFocus
          value={editing.value}
          onChange={e => setEditing({ field, value: e.target.value })}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') setEditing(null)
          }}
          className={`${className} bg-neutral-800 rounded px-1 focus:outline-none focus:ring-1 focus:ring-violet-500/60 w-full`}
        />
      )
    }
    return (
      <span
        className={`${className} cursor-text hover:text-neutral-100 transition-colors`}
        title="클릭해서 편집"
        onClick={() => setEditing({ field, value: value ?? '' })}
      >
        {value ?? <span className="text-neutral-600 italic">—</span>}
      </span>
    )
  }

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

      {/* Track Info — inline editable */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-1">
          {renderEditable('title', track.title, 'text-sm font-semibold text-neutral-100 leading-tight block')}
          <button
            onClick={() => onUpdate({ isFavorite: !track.isFavorite })}
            className="text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0 mt-0.5"
            title={track.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            {track.isFavorite ? '★' : '☆'}
          </button>
        </div>
        {renderEditable('artistName', track.artistName, 'text-xs text-neutral-500 mt-0.5 block truncate')}
        {renderEditable('albumTitle', track.albumTitle, 'text-xs text-neutral-600 mt-0.5 block truncate')}
      </div>

      {/* AI Section */}
      <div className="px-4 pb-4 flex-1">
        <div className="flex items-center gap-1.5 mb-3">
          <Music2 size={12} className="text-neutral-500" />
          <span className="section-label">AI 분류</span>
        </div>

        {aiStep && (
          <div className="flex items-center gap-2 mb-3 text-xs text-violet-400">
            <Loader2 size={11} className="animate-spin" />
            {aiStep === 'ai-searching' ? '🔍 곡 정보 검색 중…' : '🎵 장르·무드 분류 중…'}
          </div>
        )}

        {hasAiData && (
          <div className="flex flex-wrap gap-2 mb-3">
            {genre && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-neutral-600 uppercase">Genre</span>
                <span className="pill-genre">{genre}</span>
              </div>
            )}
            {mood && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-neutral-600 uppercase">Mood</span>
                <span className="pill-mood">{mood}</span>
              </div>
            )}
          </div>
        )}

        {(enriched?.isCover && enriched?.originalArtist) && (
          <div className="mb-3 px-2.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-[9px] text-amber-500 uppercase font-medium mb-0.5">Cover Song</p>
            <p className="text-xs text-amber-300">Original: {enriched.originalArtist}</p>
          </div>
        )}

        {summary && (
          <p className="text-[11px] text-neutral-500 leading-relaxed mb-3">{summary}</p>
        )}

        {track.sourcePlatform && (
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <p className="text-[10px] text-neutral-600 uppercase mb-1">Source</p>
            <p className="text-xs text-neutral-500 capitalize">{track.sourcePlatform}</p>
          </div>
        )}

        {!hasAiData && !aiStep && (
          <p className="text-xs text-neutral-700">AI 분류 데이터가 없어요.</p>
        )}
      </div>

      {/* Delete */}
      <div className="px-4 py-3 border-t border-neutral-800">
        <button
          onClick={onDelete}
          className="w-full text-left text-xs text-red-500 hover:text-red-400 transition-colors py-1"
        >
          라이브러리에서 제거
        </button>
      </div>
    </div>
  )
}
