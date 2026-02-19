import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import { TrackMetadataPanel } from '@/components/TrackMetadataPanel'
import { Dashboard } from '@/components/layout/Dashboard'
import type { Track } from '@/types/index'

export function MainContent() {
  const {
    activeView, tracks,
    searchQuery, searchResults,
    loadTracks, search,
    refreshTrack,
  } = useLibraryStore()
  const { setTrack } = usePlayerStore()
  const [localQuery, setLocalQuery] = useState('')
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)

  useEffect(() => {
    loadTracks()
  }, [])

  // Refresh selected track when it gets enriched
  useEffect(() => {
    const unsub = window.musicApp.system.onImportEnriched(async ({ trackId }) => {
      await refreshTrack(trackId)
      setSelectedTrack(prev => {
        if (prev?.id === trackId) {
          // will re-render with updated data from store
          return prev
        }
        return prev
      })
    })
    return unsub
  }, [])

  // After enrichment, update selectedTrack if it's the enriched track
  const { tracks: allTracks } = useLibraryStore()
  useEffect(() => {
    if (!selectedTrack) return
    const updated = allTracks.find(t => t.id === selectedTrack.id)
    if (updated && (updated.genre !== selectedTrack.genre || updated.mood !== selectedTrack.mood)) {
      setSelectedTrack(updated)
    }
  }, [allTracks])

  useEffect(() => {
    setLocalQuery('')
  }, [activeView])

  const handleSearch = (q: string) => {
    setLocalQuery(q)
    search(q)
  }

  const displayTracks = searchQuery ? searchResults : tracks

  if (activeView === 'dashboard') {
    return (
      <main className="flex-1 flex overflow-hidden bg-neutral-950">
        <Dashboard />
      </main>
    )
  }

  return (
    <main className="flex-1 flex overflow-hidden bg-neutral-950">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-neutral-800">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search songs, genres, moods…"
              value={localQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-800 rounded-md text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TrackGrid
            tracks={displayTracks}
            selectedTrack={selectedTrack}
            onSelect={(track) => setSelectedTrack(track)}
            onPlay={(track) => { setTrack(track, displayTracks); setSelectedTrack(track) }}
          />
        </div>
      </div>

      {selectedTrack && (
        <TrackMetadataPanel track={selectedTrack} onClose={() => setSelectedTrack(null)} />
      )}
    </main>
  )
}

function TrackGrid({ tracks, selectedTrack, onSelect, onPlay }: {
  tracks: Track[]
  selectedTrack: Track | null
  onSelect: (track: Track) => void
  onPlay: (track: Track) => void
}) {
  const { currentTrack, isPlaying } = usePlayerStore()

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-600 gap-2">
        <span className="text-4xl">🎵</span>
        <p className="text-sm">아직 트랙이 없습니다.</p>
        <p className="text-xs text-neutral-700">Import from URL로 YouTube/SoundCloud 음악을 추가하세요.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
      {tracks.map(track => {
        const isActive = currentTrack?.id === track.id
        const isSelected = selectedTrack?.id === track.id
        const coverUrl = track.coverArtPath
          ? `music://localhost/${encodeURIComponent(track.coverArtPath)}`
          : null

        return (
          <button
            key={track.id}
            onClick={() => onSelect(track)}
            onDoubleClick={() => onPlay(track)}
            className={`flex flex-col items-start text-left group rounded-lg overflow-hidden p-1 transition-colors
              ${isActive ? 'ring-2 ring-white rounded-lg' : isSelected ? 'ring-2 ring-neutral-500 rounded-lg' : 'hover:bg-neutral-900'}`}
          >
            <div className="w-full aspect-square bg-neutral-800 relative overflow-hidden rounded-lg mb-2">
              {coverUrl ? (
                <img src={coverUrl} alt={track.title ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 text-3xl">♪</div>
              )}
              {isActive && isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xl">▶</span>
                </div>
              )}
            </div>
            <span className="text-xs font-medium truncate w-full text-neutral-100 px-0.5">
              {track.title ?? 'Unknown Title'}
            </span>
            <span className="text-xs text-neutral-500 truncate w-full px-0.5 mb-1">
              {track.artistName ?? 'Unknown Artist'}
            </span>
            {/* Genre / Mood pills */}
            {(track.genre || track.mood) && (
              <div className="flex gap-1 flex-wrap px-0.5">
                {track.genre && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded-full leading-none">
                    {track.genre}
                  </span>
                )}
                {track.mood && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full leading-none">
                    {track.mood}
                  </span>
                )}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
