export interface Track {
  id: string
  filePath: string
  isImported: boolean
  isFavorite: boolean
  title: string | null
  artistName: string | null
  albumTitle: string | null
  durationMs: number | null
  bitrate: number | null
  coverArtPath: string | null
  sourceUrl: string | null
  sourcePlatform: string | null
  genre: string | null
  mood: string | null
  playCount: number
  dateAdded: number
  trackNumber: number | null
  tags: string[]
  hasAudio?: boolean
  externalLinks?: string | null
}

export interface EnrichedResult {
  genre: string
  mood: string
  performingArtist: string
  originalArtist: string | null
  isCover: boolean
  summary: string
}

export interface ImportUrlResult {
  trackId: string
  title: string | null
  artist: string | null
  durationMs: number | null
  sourcePlatform: string
}

export interface TrackStats {
  id: string
  title: string | null
  artistName: string | null
  genre: string | null
  mood: string | null
  playCount: number
  dateAdded: number
  coverArtPath: string | null
}

export interface DashboardStats {
  totalTracks: number
  taggedTracks: number
  topGenres: { genre: string; trackCount: number }[]
  topMoods: { mood: string; trackCount: number }[]
  topTracks: TrackStats[]
  recentTracks: TrackStats[]
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  trackIds: string[]
  createdAt: number
  modifiedAt: number
}

declare global {
  interface Window {
    musicApp: {
      library: {
        getTracks: () => Promise<Track[]>
        getTrack: (id: string) => Promise<Track | null>
        searchTracks: (query: string) => Promise<Track[]>
        deleteTrack: (id: string) => Promise<void>
        updateTrack: (id: string, patch: Partial<Pick<Track, 'title' | 'artistName' | 'albumTitle' | 'isFavorite' | 'tags'>>) => Promise<void>
        importUrl: (url: string) => Promise<ImportUrlResult>
        importPlaylist: (url: string) => Promise<{ trackIds: string[]; count: number }>
      }
      player: {
        getAudioUrl: (trackId: string) => Promise<string>
        updatePlayCount: (trackId: string) => Promise<void>
      }
      system: {
        onImportStatus: (
          cb: (status: { step: string; percent: number; trackId?: string }) => void
        ) => () => void
        onImportEnriched: (
          cb: (data: { trackId: string; result: EnrichedResult }) => void
        ) => () => void
        onImportError: (
          cb: (data: { trackId: string; message: string }) => void
        ) => () => void
        onApiKeyUpdated: (
          cb: (data: { active: boolean }) => void
        ) => () => void
      }
      settings: {
        getApiKey: () => Promise<string | null>
        setApiKey: (key: string) => Promise<void>
        getCredits: () => Promise<number>
        useCredit: () => Promise<{ success: boolean; remaining: number }>
        getDownloadQuality: () => Promise<'best' | '192k' | '128k'>
        setDownloadQuality: (quality: 'best' | '192k' | '128k') => Promise<void>
      }
      dashboard: {
        getStats: () => Promise<DashboardStats>
        generateTasteSummary: () => Promise<string>
      }
      dev: {
        backfillTags: () => Promise<{
          total: number
          succeeded: number
          failed: number
          results: { id: string; success: boolean; error?: string }[]
        }>
      }
      folders: {
        getFolders: () => Promise<Folder[]>
        createFolder: (name: string) => Promise<Folder>
        updateFolder: (id: string, patch: { name: string }) => Promise<void>
        deleteFolder: (id: string) => Promise<void>
        addTrackToFolder: (folderId: string, trackId: string) => Promise<void>
        removeTrackFromFolder: (folderId: string, trackId: string) => Promise<void>
      }
    }
  }
}
