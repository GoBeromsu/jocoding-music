import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useLibraryStore } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import { TrackMetadataPanel } from '@/components/TrackMetadataPanel'
import type { Track, Album, Artist } from '@/types/index'

export function MainContent() {
  const {
    activeView, tracks, albums, artists,
    searchQuery, searchResults,
    loadTracks, search,
    setSelectedAlbum, setSelectedArtist,
  } = useLibraryStore()
  const { setTrack } = usePlayerStore()
  const [localQuery, setLocalQuery] = useState('')
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)

  useEffect(() => {
    loadTracks()
  }, [])

  useEffect(() => {
    setLocalQuery('')
  }, [activeView])

  const handleSearch = (q: string) => {
    setLocalQuery(q)
    search(q)
  }

  const displayTracks = searchQuery ? searchResults : tracks

  return (
    <main className="flex-1 flex overflow-hidden bg-neutral-950">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-neutral-800">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder={activeView === 'tracks' ? 'Search tracks…' : `Search ${activeView}…`}
              value={localQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-800 rounded-md text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeView === 'tracks' && (
            <TrackGrid
              tracks={displayTracks}
              selectedTrack={selectedTrack}
              onSelect={(track) => setSelectedTrack(track)}
              onPlay={(track) => { setTrack(track, displayTracks); setSelectedTrack(track) }}
            />
          )}
          {activeView === 'albums' && (
            <AlbumGrid albums={albums} onSelect={(title) => { setSelectedAlbum(title); loadTracks({ albumTitle: title }) }} />
          )}
          {activeView === 'artists' && (
            <ArtistList artists={artists} onSelect={(name) => { setSelectedArtist(name); loadTracks({ artistName: name }) }} />
          )}
        </div>
      </div>

      {selectedTrack && activeView === 'tracks' && (
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
      <div className="flex flex-col items-center justify-center h-full text-neutral-600">
        <p className="text-sm">No tracks yet.</p>
        <p className="text-xs mt-1">Add a folder from the sidebar to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
      {tracks.map(track => {
        const isActive = currentTrack?.id === track.id
        const coverUrl = track.coverArtPath
          ? `music://localhost/${encodeURIComponent(track.coverArtPath)}`
          : null

        return (
          <button
            key={track.id}
            onClick={() => onSelect(track)}
            onDoubleClick={() => onPlay(track)}
            className={`flex flex-col items-start text-left group rounded-lg overflow-hidden
              ${isActive ? 'ring-2 ring-white' : selectedTrack?.id === track.id ? 'ring-2 ring-neutral-500' : ''}`}
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
            <span className="text-xs text-neutral-500 truncate w-full px-0.5">
              {track.artistName ?? 'Unknown Artist'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function AlbumGrid({ albums, onSelect }: { albums: Album[]; onSelect: (title: string) => void }) {
  if (albums.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
        No albums yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
      {albums.map(album => (
        <button
          key={`${album.title}|||${album.artistName ?? ''}`}
          onClick={() => onSelect(album.title)}
          className="flex flex-col items-start text-left group"
        >
          <div className="w-full aspect-square bg-neutral-800 rounded-lg mb-2 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-700 transition-colors">
            <span className="text-3xl">🎵</span>
          </div>
          <span className="text-sm font-medium truncate w-full text-neutral-100 group-hover:text-white">
            {album.title}
          </span>
          <span className="text-xs text-neutral-500 truncate w-full">
            {album.artistName ?? 'Unknown'} · {album.trackCount} tracks
          </span>
        </button>
      ))}
    </div>
  )
}

function ArtistList({ artists, onSelect }: { artists: Artist[]; onSelect: (name: string) => void }) {
  if (artists.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
        No artists yet.
      </div>
    )
  }

  return (
    <div className="divide-y divide-neutral-800">
      {artists.map(artist => (
        <button
          key={artist.name}
          onClick={() => onSelect(artist.name)}
          className="w-full flex items-center gap-4 px-6 py-3 hover:bg-neutral-800 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-lg flex-shrink-0">
            🎤
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-100">{artist.name}</div>
            <div className="text-xs text-neutral-500">
              {artist.albumCount} albums · {artist.trackCount} tracks
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
