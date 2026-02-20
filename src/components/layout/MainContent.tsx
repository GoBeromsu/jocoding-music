import { useEffect, useRef, useState } from 'react'
import { Search, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLibraryStore, type SortField } from '@/store/libraryStore'
import { usePlayerStore } from '@/store/playerStore'
import { TrackMetadataPanel } from '@/components/TrackMetadataPanel'
import { Dashboard } from '@/components/layout/Dashboard'
import type { Track } from '@/types/index'

const SORT_LABELS: Record<SortField, string> = {
  dateAdded: '추가일',
  modifiedAt: '수정일',
  title: '제목',
  artistName: '아티스트',
  playCount: '재생 수',
  filePath: '파일 경로',
}

function sortTracks(tracks: Track[], field: SortField, dir: 'asc' | 'desc'): Track[] {
  return [...tracks].sort((a, b) => {
    let av: string | number | null = null
    let bv: string | number | null = null

    if (field === 'title') { av = a.title; bv = b.title }
    else if (field === 'artistName') { av = a.artistName; bv = b.artistName }
    else if (field === 'playCount') { av = a.playCount; bv = b.playCount }
    else if (field === 'dateAdded') { av = a.dateAdded; bv = b.dateAdded }
    else if (field === 'filePath') { av = a.filePath; bv = b.filePath }
    else if (field === 'modifiedAt') { av = a.dateAdded; bv = b.dateAdded } // fallback to dateAdded

    // null always last
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1

    const cmp = typeof av === 'string'
      ? av.localeCompare(bv as string)
      : (av as number) - (bv as number)
    return dir === 'asc' ? cmp : -cmp
  })
}

export function MainContent() {
  const {
    activeView, tracks,
    searchQuery, searchResults,
    loadTracks, search,
    refreshTrack, updateTrack, deleteTrack,
    sortField, sortDir, setSortField, setSortDir,
    folders, selectedFolderId,
    addTrackToFolder, loadFolders,
  } = useLibraryStore()
  const { setTrack } = usePlayerStore()
  const [localQuery, setLocalQuery] = useState('')
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const selectedTrack = selectedTrackId
    ? tracks.find(t => t.id === selectedTrackId) ?? null
    : null

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{ trackId: string; x: number; y: number } | null>(null)
  const [folderSubMenu, setFolderSubMenu] = useState(false)

  // Pending deletes for undo
  const pendingDeletes = useRef(new Set<string>())

  useEffect(() => {
    loadTracks()
    loadFolders()
  }, [])

  // Refresh selected track when it gets enriched
  useEffect(() => {
    const unsub = window.musicApp.system.onImportEnriched(async ({ trackId }) => {
      await refreshTrack(trackId)
    })
    return unsub
  }, [])

  useEffect(() => {
    setLocalQuery('')
  }, [activeView])

  // Dismiss context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return
    const dismiss = () => { setCtxMenu(null); setFolderSubMenu(false) }
    window.addEventListener('click', dismiss)
    return () => window.removeEventListener('click', dismiss)
  }, [ctxMenu])

  const handleSearch = (q: string) => {
    setLocalQuery(q)
    search(q)
  }

  const handleDelete = (trackId: string) => {
    pendingDeletes.current.add(trackId)
    let cancelled = false

    toast(
      (t) => (
        <span className="flex items-center gap-3 text-sm">
          <span>트랙이 삭제됩니다</span>
          <button
            onClick={() => {
              cancelled = true
              toast.dismiss(t.id)
            }}
            className="text-amber-400 font-medium hover:text-amber-300"
          >
            실행 취소
          </button>
        </span>
      ),
      { duration: 3000, id: `delete-${trackId}` }
    )

    setTimeout(() => {
      pendingDeletes.current.delete(trackId)
      if (!cancelled) {
        deleteTrack(trackId)
        if (selectedTrackId === trackId) setSelectedTrackId(null)
      } else {
        loadTracks()
      }
    }, 3100)
  }

  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault()
    e.stopPropagation()
    let x = e.clientX
    const y = e.clientY
    if (x + 180 > window.innerWidth) x -= 180
    setCtxMenu({ trackId, x, y })
    setFolderSubMenu(false)
  }

  // Compute display tracks: search → folder filter → sort
  const baseTracks = searchQuery ? searchResults : tracks
  let filteredTracks = baseTracks.filter(t => !pendingDeletes.current.has(t.id))

  if (selectedFolderId === 'favorites') {
    filteredTracks = filteredTracks.filter(t => t.isFavorite)
  } else if (selectedFolderId === 'uncategorized') {
    const allFolderTrackIds = new Set(folders.flatMap(f => f.trackIds))
    filteredTracks = filteredTracks.filter(t => !allFolderTrackIds.has(t.id))
  } else if (selectedFolderId === 'untagged') {
    filteredTracks = filteredTracks.filter(t => !t.tags || t.tags.length === 0)
  } else if (selectedFolderId?.startsWith('tag:')) {
    const tag = selectedFolderId.slice(4)
    filteredTracks = filteredTracks.filter(t => t.tags?.includes(tag))
  } else if (selectedFolderId) {
    const folder = folders.find(f => f.id === selectedFolderId)
    if (folder) {
      filteredTracks = filteredTracks.filter(t => folder.trackIds.includes(t.id))
    }
  }

  const displayTracks = sortTracks(filteredTracks, sortField, sortDir)

  if (activeView === 'dashboard') {
    return (
      <main className="flex-1 flex overflow-hidden bg-neutral-950">
        <Dashboard />
      </main>
    )
  }

  const ctxTrack = ctxMenu ? tracks.find(t => t.id === ctxMenu.trackId) : null

  return (
    <main className="flex-1 flex overflow-hidden bg-neutral-950">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar + Sort */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by title, artist, or genre…"
                value={localQuery}
                onChange={e => handleSearch(e.target.value)}
                className="input-base pl-8 py-1.5 text-sm w-full"
              />
            </div>
            {/* Sort controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as SortField)}
                className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-600"
              >
                {(Object.entries(SORT_LABELS) as [SortField, string][]).map(([field, label]) => (
                  <option key={field} value={field}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-100 transition-colors"
                title={sortDir === 'asc' ? '오름차순' : '내림차순'}
              >
                {sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TrackGrid
            tracks={displayTracks}
            selectedTrackId={selectedTrackId}
            onSelect={(track) => setSelectedTrackId(track.id)}
            onPlay={(track) => { setTrack(track, displayTracks); setSelectedTrackId(track.id) }}
            onContextMenu={handleContextMenu}
          />
        </div>
      </div>

      {selectedTrack && (
        <TrackMetadataPanel
          track={selectedTrack}
          onClose={() => setSelectedTrackId(null)}
          onUpdate={(patch) => updateTrack(selectedTrack.id, patch)}
          onDelete={() => { handleDelete(selectedTrack.id); setSelectedTrackId(null) }}
        />
      )}

      {/* Context Menu */}
      {ctxMenu && ctxTrack && (
        <div
          className="ctx-menu"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="ctx-menu-item"
            onClick={() => {
              updateTrack(ctxMenu.trackId, { isFavorite: !ctxTrack.isFavorite })
              setCtxMenu(null)
            }}
          >
            {ctxTrack.isFavorite ? '★ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}
          </button>
          {folders.length > 0 && (
            <div
              className="ctx-menu-item flex items-center justify-between"
              onMouseEnter={() => setFolderSubMenu(true)}
              onMouseLeave={() => setFolderSubMenu(false)}
            >
              <span>폴더에 추가 →</span>
              {folderSubMenu && (
                <div className="absolute left-full top-0 ml-1 ctx-menu min-w-[140px]">
                  {folders.map(f => (
                    <button
                      key={f.id}
                      className="ctx-menu-item"
                      onClick={() => {
                        addTrackToFolder(f.id, ctxMenu.trackId)
                        setCtxMenu(null)
                        setFolderSubMenu(false)
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            className="ctx-menu-item-danger"
            onClick={() => {
              handleDelete(ctxMenu.trackId)
              setCtxMenu(null)
            }}
          >
            라이브러리에서 제거
          </button>
        </div>
      )}
    </main>
  )
}

function TrackGrid({ tracks, selectedTrackId, onSelect, onPlay, onContextMenu }: {
  tracks: Track[]
  selectedTrackId: string | null
  onSelect: (track: Track) => void
  onPlay: (track: Track) => void
  onContextMenu: (e: React.MouseEvent, trackId: string) => void
}) {
  const { currentTrack, isPlaying } = usePlayerStore()

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-600 gap-2">
        <span className="text-4xl">🎵</span>
        <p className="text-sm">아직 음악이 없어요.</p>
        <p className="text-xs text-neutral-700">좋아하는 노래의 URL을 붙여넣어 시작하세요.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
      {tracks.map(track => {
        const isActive = currentTrack?.id === track.id
        const isSelected = selectedTrackId === track.id
        const coverUrl = track.coverArtPath
          ? track.coverArtPath.startsWith('http')
            ? track.coverArtPath
            : `music://localhost/${encodeURIComponent(track.coverArtPath)}`
          : null

        return (
          <button
            key={track.id}
            onClick={() => onSelect(track)}
            onDoubleClick={() => onPlay(track)}
            onContextMenu={(e) => onContextMenu(e, track.id)}
            className={`flex flex-col items-start text-left group rounded-lg overflow-hidden p-1 transition-colors
              ${isActive ? 'ring-2 ring-amber-400/80 rounded-lg' : isSelected ? 'ring-2 ring-amber-500/50 rounded-lg' : 'hover:bg-neutral-800/60'}`}
          >
            <div className="w-full aspect-square bg-neutral-800 relative overflow-hidden rounded-lg mb-2">
              {coverUrl ? (
                <img src={coverUrl} alt={track.title ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
              ) : (
                <div className="cover-placeholder">♩</div>
              )}
              {isActive && isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-neutral-100 text-xl">▶</span>
                </div>
              )}
              {track.isFavorite && (
                <div className="absolute top-1 right-1 text-amber-400 text-xs leading-none">★</div>
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
                {track.genre && <span className="pill-genre">{track.genre}</span>}
                {track.mood && <span className="pill-mood">{track.mood}</span>}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
