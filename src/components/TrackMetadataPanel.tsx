import { useEffect, useState, useRef } from 'react'
import { Music2, X, Loader2, Tag } from 'lucide-react'
import type { Track, EnrichedResult } from '@/types/index'
import { useLibraryStore } from '@/store/libraryStore'

type EditableField = 'title' | 'artistName' | 'albumTitle'

interface Props {
  track: Track
  onClose: () => void
  onUpdate: (patch: Partial<Pick<Track, 'title' | 'artistName' | 'albumTitle' | 'isFavorite' | 'tags'>>) => void
  onDelete: () => void
}

export function TrackMetadataPanel({ track, onClose, onUpdate, onDelete }: Props) {
  const { tracks } = useLibraryStore()
  const [enriched, setEnriched] = useState<EnrichedResult | null>(null)
  const [aiStep, setAiStep] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ field: EditableField; value: string } | null>(null)

  // Tag editing
  const [tagInput, setTagInput] = useState('')
  const tagInputRef = useRef<HTMLInputElement>(null)

  // All unique tags for autocomplete
  const allTags = Array.from(new Set(tracks.flatMap(t => t.tags ?? []))).sort()
  const currentTags: string[] = track.tags ?? []

  // Reset when track changes
  useEffect(() => {
    setEnriched(null)
    setAiStep(null)
    setEditing(null)
    setTagInput('')
  }, [track.id])

  // Listen for AI enrichment events for this track
  useEffect(() => {
    const unsubStatus = window.musicApp.system.onImportStatus((s) => {
      if (s.trackId === track.id && (s.step === 'ai-searching' || s.step === 'ai-classifying')) {
        setAiStep(s.step)
      } else if (s.trackId === track.id && (s.step === 'done' || s.step === 'error')) {
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
          className={`${className} app-surface rounded px-1 focus:outline-none focus:ring-1 focus:ring-[color:var(--app-accent)] w-full`}
        />
      )
    }
      return (
        <span
          className={`${className} cursor-text hover:text-[color:var(--app-text)] transition-colors`}
          title="클릭해서 편집"
          onClick={() => setEditing({ field, value: value ?? '' })}
        >
        {value ?? <span className="app-muted italic">—</span>}
      </span>
    )
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || currentTags.includes(trimmed)) return
    const newTags = [...currentTags, trimmed]
    onUpdate({ tags: newTags })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    const newTags = currentTags.filter(t => t !== tag)
    onUpdate({ tags: newTags })
  }

  const suggestions = tagInput
    ? allTags.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !currentTags.includes(t))
    : []

  return (
    <div className="w-64 flex-shrink-0 border-l border-[color:var(--app-border)] app-surface flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--app-border)]">
        <span className="text-xs font-semibold app-muted uppercase tracking-wider">Track Info</span>
        <button onClick={onClose} className="app-muted hover:text-[color:var(--app-text)] transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Cover Art */}
      <div className="px-4 pt-4 pb-3">
        <div className="w-full aspect-square rounded-lg overflow-hidden app-surface-subtle">
          {coverUrl ? (
            <img src={coverUrl} alt={track.title ?? ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center app-muted text-5xl">♪</div>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-1">
          {renderEditable('title', track.title, 'text-sm font-semibold app-text leading-tight block')}
          <button
            onClick={() => onUpdate({ isFavorite: !track.isFavorite })}
            className="app-accent hover:brightness-110 transition-colors flex-shrink-0 mt-0.5"
            title={track.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            {track.isFavorite ? '★' : '☆'}
          </button>
        </div>
        {renderEditable('artistName', track.artistName, 'text-xs app-muted mt-0.5 block truncate')}
        {renderEditable('albumTitle', track.albumTitle, 'text-xs app-muted mt-0.5 block truncate')}
      </div>

      {/* Tags Section */}
      <div className="px-4 pb-4 border-t border-[color:var(--app-border)] pt-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Tag size={11} className="app-muted" />
          <span className="section-label">태그</span>
        </div>

        {/* Tag chips */}
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {currentTags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 app-surface-subtle border app-border rounded-full leading-none"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="app-muted hover:text-error transition-colors ml-0.5"
                >
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tag input */}
        <div className="relative">
          <input
            ref={tagInputRef}
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { addTag(tagInput); e.preventDefault() }
              if (e.key === 'Escape') setTagInput('')
            }}
            placeholder="태그 추가…"
            className="w-full app-surface-subtle border app-border rounded px-2 py-1 text-xs app-text focus:outline-none placeholder:app-muted"
          />
          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-0.5 app-surface border app-border rounded-md overflow-hidden z-10 shadow-lg">
              {suggestions.slice(0, 5).map(s => (
                <button
                  key={s}
                  onClick={() => addTag(s)}
                  className="w-full text-left px-2 py-1 text-xs app-text hover:bg-surface-container-high transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Section */}
      <div className="px-4 pb-4 flex-1">
        <div className="flex items-center gap-1.5 mb-3">
          <Music2 size={12} className="app-muted" />
          <span className="section-label">AI 분류</span>
        </div>

        {aiStep && (
          <div className="flex items-center gap-2 mb-3 text-xs app-accent">
            <Loader2 size={11} className="animate-spin" />
            {aiStep === 'ai-searching' ? '🔍 곡 정보 검색 중…' : '🎵 장르·무드 분류 중…'}
          </div>
        )}

        {hasAiData && (
          <div className="flex flex-wrap gap-2 mb-3">
            {genre && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] app-muted uppercase">Genre</span>
                <span className="pill-genre">{genre}</span>
              </div>
            )}
            {mood && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] app-muted uppercase">Mood</span>
                <span className="pill-mood">{mood}</span>
              </div>
            )}
          </div>
        )}

        {(enriched?.isCover && enriched?.originalArtist) && (
          <div className="mb-3 px-2.5 py-2 app-surface-subtle border app-border rounded-lg">
            <p className="text-[9px] app-accent uppercase font-medium mb-0.5">Cover Song</p>
            <p className="text-xs app-muted">Original: {enriched.originalArtist}</p>
          </div>
        )}

        {summary && (
          <p className="text-[11px] app-muted leading-relaxed mb-3">{summary}</p>
        )}

        {track.sourcePlatform && (
          <div className="mt-3 pt-3 border-t border-[color:var(--app-border)]">
            <p className="text-[10px] app-muted uppercase mb-1">Source</p>
            <p className="text-xs app-muted capitalize">{track.sourcePlatform}</p>
          </div>
        )}

        {!hasAiData && !aiStep && (
          <p className="text-xs app-muted">AI 분류 데이터가 없어요.</p>
        )}
      </div>

      {/* Delete */}
      <div className="px-4 py-3 border-t border-[color:var(--app-border)]">
        <button
          onClick={onDelete}
          className="w-full text-left text-xs text-error hover:text-error/80 transition-colors py-1"
        >
          라이브러리에서 제거
        </button>
      </div>
    </div>
  )
}
