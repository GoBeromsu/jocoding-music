import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export interface TrackMeta {
  id: string
  filePath: string
  isImported: boolean
  title: string | null
  artistName: string | null
  albumTitle: string | null
  year: number | null
  trackNumber: number | null
  durationMs: number | null
  bitrate: number | null
  sampleRate: number | null
  fileSize: number | null
  mimeType: string | null
  coverArtPath: string | null
  tags: string[]
  isDeleted: boolean
  sourceUrl: string | null
  sourcePlatform: string | null
  genre: string | null
  mood: string | null
  playCount: number
  lastPlayedAt: number | null
  dateAdded: number
  modifiedAt: number
}

class LibraryStore {
  private tracksPath = ''
  private cache = new Map<string, TrackMeta>()

  init(libraryPath: string): void {
    this.tracksPath = path.join(libraryPath, 'tracks')
    fs.mkdirSync(this.tracksPath, { recursive: true })

    // Write global metadata if not exists
    const metaPath = path.join(this.tracksPath, '../metadata.json')
    if (!fs.existsSync(metaPath)) {
      fs.writeFileSync(metaPath, JSON.stringify({ version: 1, name: 'My Library' }, null, 2), 'utf-8')
    }

    // Load all track metadata into memory
    this.cache.clear()
    try {
      for (const entry of fs.readdirSync(this.tracksPath, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name.endsWith('.info')) {
          const metaFile = path.join(this.tracksPath, entry.name, 'metadata.json')
          try {
            const data = JSON.parse(fs.readFileSync(metaFile, 'utf-8')) as TrackMeta
            this.cache.set(data.id, data)
          } catch { /* skip corrupt */ }
        }
      }
    } catch { /* empty dir */ }
  }

  getAll(): TrackMeta[] {
    return Array.from(this.cache.values()).filter(t => !t.isDeleted)
  }

  get(id: string): TrackMeta | null {
    return this.cache.get(id) ?? null
  }

  upsert(data: TrackMeta): void {
    data.modifiedAt = Date.now()
    this.cache.set(data.id, data)
    const dir = this.getTrackDir(data.id)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(data, null, 2), 'utf-8')
  }

  softDelete(id: string): void {
    const track = this.cache.get(id)
    if (track) {
      this.upsert({ ...track, isDeleted: true })
    }
  }

  search(query: string): TrackMeta[] {
    const q = query.toLowerCase()
    return this.getAll().filter(t =>
      t.title?.toLowerCase().includes(q) ||
      t.artistName?.toLowerCase().includes(q) ||
      t.albumTitle?.toLowerCase().includes(q) ||
      t.genre?.toLowerCase().includes(q) ||
      t.mood?.toLowerCase().includes(q)
    )
  }

  getTrackDir(id: string): string {
    return path.join(this.tracksPath, `${id}.info`)
  }

  getAudioPath(id: string, ext: string): string {
    return path.join(this.getTrackDir(id), `audio.${ext}`)
  }

  newId(): string {
    return Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase()
  }

  getDashboardStats() {
    const tracks = this.getAll()

    const totalPlayCount = tracks.reduce((s, t) => s + t.playCount, 0)
    const totalPlayMs = tracks.reduce((sum, t) => {
      if (!t.durationMs || !t.playCount) return sum
      return sum + t.durationMs * t.playCount
    }, 0)
    const taggedTracks = tracks.filter(t => t.genre).length

    // Genre — both track count and play-count weighted
    const genreMap = new Map<string, { trackCount: number; playCount: number }>()
    for (const t of tracks) {
      if (!t.genre) continue
      const cur = genreMap.get(t.genre) ?? { trackCount: 0, playCount: 0 }
      genreMap.set(t.genre, { trackCount: cur.trackCount + 1, playCount: cur.playCount + t.playCount })
    }
    // Sort by play count first, then track count as tiebreaker
    const topGenres = Array.from(genreMap.entries())
      .map(([genre, v]) => ({ genre, ...v }))
      .sort((a, b) => b.playCount - a.playCount || b.trackCount - a.trackCount)
      .slice(0, 6)

    // Mood — same
    const moodMap = new Map<string, { trackCount: number; playCount: number }>()
    for (const t of tracks) {
      if (!t.mood) continue
      const cur = moodMap.get(t.mood) ?? { trackCount: 0, playCount: 0 }
      moodMap.set(t.mood, { trackCount: cur.trackCount + 1, playCount: cur.playCount + t.playCount })
    }
    const topMoods = Array.from(moodMap.entries())
      .map(([mood, v]) => ({ mood, ...v }))
      .sort((a, b) => b.playCount - a.playCount || b.trackCount - a.trackCount)
      .slice(0, 6)

    const toStats = (t: TrackMeta) => ({
      id: t.id,
      title: t.title,
      artistName: t.artistName,
      genre: t.genre,
      mood: t.mood,
      playCount: t.playCount,
      dateAdded: t.dateAdded,
      coverArtPath: t.coverArtPath,
    })

    // Top played tracks
    const topTracks = tracks
      .filter(t => t.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5)
      .map(toStats)

    // Recent additions
    const recentTracks = tracks
      .sort((a, b) => b.dateAdded - a.dateAdded)
      .slice(0, 5)
      .map(toStats)

    return {
      totalTracks: tracks.length,
      taggedTracks,
      totalPlayCount,
      totalPlayMs,
      topGenres,
      topMoods,
      topTracks,
      recentTracks,
    }
  }
}

export const libraryStore = new LibraryStore()
