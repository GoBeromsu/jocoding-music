export interface Track {
  id: string
  filePath: string
  isImported: boolean
  title: string | null
  artistName: string | null
  albumTitle: string | null
  durationMs: number | null
  bitrate: number | null
  coverArtPath: string | null
  sourceUrl: string | null
  sourcePlatform: string | null
  originalArtist: string | null
  isCover: boolean | null
  platformLinks: PlatformLink[]
  playCount: number
  dateAdded: number
  trackNumber: number | null
}

export interface Album {
  title: string
  artistName: string | null
  year: number | null
  coverArtPath: string | null
  trackCount: number
}

export interface Artist {
  name: string
  albumCount: number
  trackCount: number
}

export interface ObsidianNote {
  trackId: string
  notePath: string
  vaultPath: string
  createdAt: number
  updatedAt: number
}

export interface PlatformLink {
  platform: string
  url: string
}

export interface EnrichedResult {
  performingArtist: string
  originalArtist: string | null
  isCover: boolean
  platformLinks: PlatformLink[]
  summary: string
}

export interface ImportStatus {
  step: 'idle' | 'downloading' | 'analyzing' | 'done' | 'error'
  percent: number
  message?: string
}

declare global {
  interface Window {
    musicApp: {
      library: {
        scanFolder: (folderPath: string) => Promise<{ count: number }>
        getTracks: () => Promise<Track[]>
        getTrack: (id: string) => Promise<Track | null>
        searchTracks: (query: string) => Promise<Track[]>
        getAlbums: () => Promise<Album[]>
        getArtists: () => Promise<Artist[]>
        deleteTrack: (id: string) => Promise<void>
        importUrl: (url: string) => Promise<{ trackId: string; title: string | null; artist: string | null; durationMs: number | null; sourcePlatform: string }>
        getPlatformLinks: (trackId: string) => Promise<PlatformLink[]>
      }
      player: {
        getAudioUrl: (trackId: string) => Promise<string>
        updatePlayCount: (trackId: string) => Promise<void>
      }
      obsidian: {
        selectVault: () => Promise<string | null>
        createNote: (trackId: string, vaultPath: string, content: string) => Promise<ObsidianNote>
        getNotesByTrack: (trackId: string) => Promise<ObsidianNote[]>
        openNote: (notePath: string) => Promise<void>
      }
      system: {
        selectFolder: () => Promise<string | null>
        onLibraryScanProgress: (
          cb: (progress: { done: number; total: number }) => void
        ) => () => void
        onImportStatus: (cb: (status: { step: string; percent: number }) => void) => () => void
        onImportEnriched: (cb: (data: { trackId: string; result: EnrichedResult }) => void) => () => void
        onImportError: (cb: (data: { trackId: string; message: string }) => void) => () => void
      }
      settings: {
        getApiKey: () => Promise<string | null>
        setApiKey: (key: string) => Promise<void>
      }
    }
  }
}
