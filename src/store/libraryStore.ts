import { create } from 'zustand'
import type { Track } from '@/types/index'

export type View = 'tracks' | 'dashboard'

interface LibraryState {
  tracks: Track[]
  searchResults: Track[]
  searchQuery: string
  isSearching: boolean
  activeView: View

  setActiveView: (view: View) => void
  loadTracks: () => Promise<void>
  search: (query: string) => Promise<void>
  refreshTrack: (trackId: string) => Promise<void>
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  activeView: 'tracks',

  setActiveView: (view) => set({ activeView: view, searchQuery: '', searchResults: [] }),

  loadTracks: async () => {
    const tracks = await window.musicApp.library.getTracks()
    set({ tracks })
  },

  refreshTrack: async (trackId: string) => {
    const updated = await window.musicApp.library.getTrack(trackId)
    if (!updated) return
    set((state) => ({
      tracks: state.tracks.map(t => t.id === trackId ? updated : t),
    }))
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
