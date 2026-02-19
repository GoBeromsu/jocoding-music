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
  originalArtist: string | null
  isCover: boolean | null
  platformLinks: { platform: string; url: string }[]
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
      t.albumTitle?.toLowerCase().includes(q)
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
}

export const libraryStore = new LibraryStore()
