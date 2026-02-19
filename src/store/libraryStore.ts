import { create } from 'zustand'
import type { Track, Album, Artist } from '@/types/index'

type View = 'tracks' | 'albums' | 'artists'

interface LibraryState {
  tracks: Track[]
  albums: Album[]
  artists: Artist[]
  searchResults: Track[]
  searchQuery: string
  isSearching: boolean
  scanProgress: { done: number; total: number } | null
  activeView: View
  selectedAlbumTitle: string | null
  selectedArtistName: string | null

  setActiveView: (view: View) => void
  setSelectedAlbum: (title: string | null) => void
  setSelectedArtist: (name: string | null) => void
  loadTracks: (options?: { albumTitle?: string; artistName?: string }) => Promise<void>
  scanFolder: (folderPath: string) => Promise<void>
  search: (query: string) => Promise<void>
}

function derivedAlbums(tracks: Track[]): Album[] {
  const albumMap = new Map<string, Album>()
  for (const t of tracks) {
    if (!t.albumTitle) continue
    const key = `${t.albumTitle}|||${t.artistName ?? ''}`
    const existing = albumMap.get(key)
    if (existing) {
      existing.trackCount++
    } else {
      albumMap.set(key, {
        title: t.albumTitle,
        artistName: t.artistName,
        year: null,
        coverArtPath: t.coverArtPath,
        trackCount: 1,
      })
    }
  }
  return Array.from(albumMap.values()).sort((a, b) =>
    (a.artistName ?? '').localeCompare(b.artistName ?? '') || a.title.localeCompare(b.title)
  )
}

function derivedArtists(tracks: Track[]): Artist[] {
  const artistMap = new Map<string, { name: string; trackCount: number; albums: Set<string> }>()
  for (const t of tracks) {
    if (!t.artistName) continue
    const existing = artistMap.get(t.artistName)
    if (existing) {
      existing.trackCount++
      if (t.albumTitle) existing.albums.add(t.albumTitle)
    } else {
      artistMap.set(t.artistName, {
        name: t.artistName,
        trackCount: 1,
        albums: new Set(t.albumTitle ? [t.albumTitle] : []),
      })
    }
  }
  return Array.from(artistMap.values())
    .map(a => ({ name: a.name, trackCount: a.trackCount, albumCount: a.albums.size }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  albums: [],
  artists: [],
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  scanProgress: null,
  activeView: 'tracks',
  selectedAlbumTitle: null,
  selectedArtistName: null,

  setActiveView: (view) => set({ activeView: view, searchQuery: '', searchResults: [] }),
  setSelectedAlbum: (title) => set({ selectedAlbumTitle: title, activeView: 'tracks' }),
  setSelectedArtist: (name) => set({ selectedArtistName: name, activeView: 'tracks' }),

  loadTracks: async (options) => {
    let tracks = await window.musicApp.library.getTracks()
    if (options?.albumTitle) {
      tracks = tracks.filter(t => t.albumTitle === options.albumTitle)
    }
    if (options?.artistName) {
      tracks = tracks.filter(t => t.artistName === options.artistName)
    }
    const albums = derivedAlbums(tracks)
    const artists = derivedArtists(tracks)
    set({ tracks, albums, artists })
  },

  scanFolder: async (folderPath) => {
    set({ scanProgress: { done: 0, total: 0 } })

    const unsub = window.musicApp.system.onLibraryScanProgress((p) => {
      set({ scanProgress: p })
    })

    await window.musicApp.library.scanFolder(folderPath)
    unsub()
    set({ scanProgress: null })

    const tracks = await window.musicApp.library.getTracks()
    set({ tracks, albums: derivedAlbums(tracks), artists: derivedArtists(tracks) })
  },

  search: async (query) => {
    set({ searchQuery: query })
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false })
      get().loadTracks()
      return
    }
    set({ isSearching: true })
    const results = await window.musicApp.library.searchTracks(query)
    set({ searchResults: results, isSearching: false })
  },
}))
