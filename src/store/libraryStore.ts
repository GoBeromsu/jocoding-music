import { create } from 'zustand'
import type { Track, Folder } from '@/types/index'

export type View = 'tracks' | 'dashboard'
export type SortField = 'dateAdded' | 'modifiedAt' | 'title' | 'artistName' | 'playCount' | 'filePath'
export type SortDir = 'asc' | 'desc'

function loadSortField(): SortField {
  const v = localStorage.getItem('sort-field')
  const valid: SortField[] = ['dateAdded', 'modifiedAt', 'title', 'artistName', 'playCount', 'filePath']
  return (valid.includes(v as SortField) ? v : 'dateAdded') as SortField
}

function loadSortDir(): SortDir {
  const v = localStorage.getItem('sort-dir')
  return v === 'asc' ? 'asc' : 'desc'
}

interface LibraryState {
  tracks: Track[]
  searchResults: Track[]
  searchQuery: string
  isSearching: boolean
  activeView: View

  sortField: SortField
  sortDir: SortDir

  folders: Folder[]
  selectedFolderId: string | null

  setActiveView: (view: View) => void
  loadTracks: () => Promise<void>
  search: (query: string) => Promise<void>
  refreshTrack: (trackId: string) => Promise<void>
  updateTrack: (id: string, patch: Partial<Pick<Track, 'title' | 'artistName' | 'albumTitle' | 'isFavorite' | 'tags'>>) => Promise<void>
  deleteTrack: (id: string) => Promise<void>

  setSortField: (field: SortField) => void
  setSortDir: (dir: SortDir) => void

  loadFolders: () => Promise<void>
  createFolder: (name: string) => Promise<void>
  updateFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  addTrackToFolder: (folderId: string, trackId: string) => Promise<void>
  removeTrackFromFolder: (folderId: string, trackId: string) => Promise<void>
  setSelectedFolder: (id: string | null) => void
  updateTrackTags: (id: string, tags: string[]) => void
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  activeView: 'tracks',

  sortField: loadSortField(),
  sortDir: loadSortDir(),

  folders: [],
  selectedFolderId: null,

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

  updateTrack: async (id, patch) => {
    set((state) => ({
      tracks: state.tracks.map(t => t.id === id ? { ...t, ...patch } : t),
      searchResults: state.searchResults.map(t => t.id === id ? { ...t, ...patch } : t),
    }))
    await window.musicApp.library.updateTrack(id, patch)
  },

  deleteTrack: async (id) => {
    await window.musicApp.library.deleteTrack(id)
    set((state) => ({
      tracks: state.tracks.filter(t => t.id !== id),
      searchResults: state.searchResults.filter(t => t.id !== id),
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

  setSortField: (field) => {
    localStorage.setItem('sort-field', field)
    set({ sortField: field })
  },

  setSortDir: (dir) => {
    localStorage.setItem('sort-dir', dir)
    set({ sortDir: dir })
  },

  loadFolders: async () => {
    const folders = await window.musicApp.folders.getFolders()
    set({ folders })
  },

  createFolder: async (name) => {
    const folder = await window.musicApp.folders.createFolder(name)
    set((state) => ({ folders: [...state.folders, folder] }))
  },

  updateFolder: async (id, name) => {
    await window.musicApp.folders.updateFolder(id, { name })
    set((state) => ({
      folders: state.folders.map(f => f.id === id ? { ...f, name } : f),
    }))
  },

  deleteFolder: async (id) => {
    await window.musicApp.folders.deleteFolder(id)
    set((state) => ({
      folders: state.folders.filter(f => f.id !== id),
      selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
    }))
  },

  addTrackToFolder: async (folderId, trackId) => {
    await window.musicApp.folders.addTrackToFolder(folderId, trackId)
    set((state) => ({
      folders: state.folders.map(f =>
        f.id === folderId && !f.trackIds.includes(trackId)
          ? { ...f, trackIds: [...f.trackIds, trackId] }
          : f
      ),
    }))
  },

  removeTrackFromFolder: async (folderId, trackId) => {
    await window.musicApp.folders.removeTrackFromFolder(folderId, trackId)
    set((state) => ({
      folders: state.folders.map(f =>
        f.id === folderId
          ? { ...f, trackIds: f.trackIds.filter(id => id !== trackId) }
          : f
      ),
    }))
  },

  setSelectedFolder: (id) => set({ selectedFolderId: id }),

  updateTrackTags: (id, tags) => {
    set((state) => ({
      tracks: state.tracks.map(t => t.id === id ? { ...t, tags } : t),
      searchResults: state.searchResults.map(t => t.id === id ? { ...t, tags } : t),
    }))
    window.musicApp.library.updateTrack(id, { tags })
  },
}))
